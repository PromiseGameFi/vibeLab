import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, rm, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ScanResult, ScanSummary, generateFixPrompt } from "@/lib/scanData";

const execAsync = promisify(exec);

// Temporary directory for cloned repos
const SCAN_DIR = "/tmp/vibelab-scans";

interface SemgrepFinding {
    check_id: string;
    path: string;
    start: { line: number };
    extra: {
        message: string;
        severity: string;
        metadata?: {
            cwe?: string[];
            owasp?: string[];
        };
        lines?: string;
    };
}

interface TrivyVulnerability {
    VulnerabilityID: string;
    PkgName: string;
    Severity: string;
    Title: string;
    Description: string;
    FixedVersion?: string;
}

interface GitleaksSecret {
    Description: string;
    File: string;
    StartLine: number;
    Secret: string;
    Match: string;
}

interface NpmAuditVulnerability {
    name: string;
    severity: string;
    title: string;
    url: string;
    fixAvailable: boolean;
}

export async function POST(request: NextRequest) {
    const scanId = uuidv4();
    const scanDir = path.join(SCAN_DIR, scanId);

    try {
        const body = await request.json();
        const { repoUrl } = body;

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }

        // Validate GitHub URL
        const githubRegex = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
        if (!githubRegex.test(repoUrl)) {
            return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
        }

        // Create scan directory
        await mkdir(scanDir, { recursive: true });

        // Clone repository
        const cloneUrl = repoUrl.endsWith('.git') ? repoUrl : `${repoUrl}.git`;
        await execAsync(`git clone --depth 1 ${cloneUrl} repo`, { cwd: scanDir, timeout: 60000 });

        const repoPath = path.join(scanDir, "repo");
        const results: ScanResult[] = [];

        // Run Semgrep
        try {
            const { stdout: semgrepOut } = await execAsync(
                `semgrep --config=auto --json --timeout 60 .`,
                { cwd: repoPath, timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
            );
            const semgrepResults = JSON.parse(semgrepOut);

            semgrepResults.results?.forEach((finding: SemgrepFinding) => {
                const severity = mapSeverity(finding.extra.severity);
                results.push({
                    id: uuidv4(),
                    scanner: 'semgrep',
                    severity,
                    title: finding.check_id.split('.').pop() || finding.check_id,
                    description: finding.extra.message,
                    file: finding.path,
                    line: finding.start.line,
                    code: finding.extra.lines,
                    cwe: finding.extra.metadata?.cwe?.join(', '),
                    owasp: finding.extra.metadata?.owasp?.join(', '),
                });
            });
        } catch (e) {
            console.log("Semgrep scan completed with warnings or no findings");
        }

        // Run Trivy
        try {
            const { stdout: trivyOut } = await execAsync(
                `trivy fs --format json --scanners vuln .`,
                { cwd: repoPath, timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
            );
            const trivyResults = JSON.parse(trivyOut);

            trivyResults.Results?.forEach((result: { Vulnerabilities?: TrivyVulnerability[], Target?: string }) => {
                result.Vulnerabilities?.forEach((vuln: TrivyVulnerability) => {
                    const severity = mapSeverity(vuln.Severity);
                    results.push({
                        id: uuidv4(),
                        scanner: 'trivy',
                        severity,
                        title: `${vuln.PkgName}: ${vuln.VulnerabilityID}`,
                        description: vuln.Description || vuln.Title,
                        file: result.Target,
                        fix: vuln.FixedVersion ? `Upgrade to ${vuln.FixedVersion}` : undefined,
                    });
                });
            });
        } catch (e) {
            console.log("Trivy scan completed with warnings or no findings");
        }

        // Run Gitleaks
        try {
            const gitleaksReport = path.join(scanDir, "gitleaks.json");
            await execAsync(
                `gitleaks detect --source . --report-path ${gitleaksReport} --report-format json`,
                { cwd: repoPath, timeout: 60000 }
            );

            if (existsSync(gitleaksReport)) {
                const gitleaksOut = await readFile(gitleaksReport, 'utf-8');
                const gitleaksResults: GitleaksSecret[] = JSON.parse(gitleaksOut);

                gitleaksResults.forEach((secret: GitleaksSecret) => {
                    results.push({
                        id: uuidv4(),
                        scanner: 'gitleaks',
                        severity: 'critical',
                        title: `Secret Detected: ${secret.Description}`,
                        description: `Potential secret or credential found in ${secret.File}`,
                        file: secret.File,
                        line: secret.StartLine,
                        code: secret.Match?.replace(secret.Secret, '***REDACTED***'),
                    });
                });
            }
        } catch (e) {
            // Gitleaks returns exit code 1 when secrets are found
            const gitleaksReport = path.join(scanDir, "gitleaks.json");
            if (existsSync(gitleaksReport)) {
                try {
                    const gitleaksOut = await readFile(gitleaksReport, 'utf-8');
                    const gitleaksResults: GitleaksSecret[] = JSON.parse(gitleaksOut);

                    gitleaksResults.forEach((secret: GitleaksSecret) => {
                        results.push({
                            id: uuidv4(),
                            scanner: 'gitleaks',
                            severity: 'critical',
                            title: `Secret Detected: ${secret.Description}`,
                            description: `Potential secret or credential found in ${secret.File}`,
                            file: secret.File,
                            line: secret.StartLine,
                            code: secret.Match?.replace(secret.Secret, '***REDACTED***'),
                        });
                    });
                } catch { }
            }
        }

        // Run npm audit if package.json exists
        const packageJsonPath = path.join(repoPath, "package.json");
        if (existsSync(packageJsonPath)) {
            try {
                // Install dependencies first
                await execAsync('npm install --package-lock-only --ignore-scripts', {
                    cwd: repoPath,
                    timeout: 120000
                });

                const { stdout: npmOut } = await execAsync(
                    'npm audit --json',
                    { cwd: repoPath, timeout: 60000 }
                );
                const npmResults = JSON.parse(npmOut);

                Object.values(npmResults.vulnerabilities || {}).forEach((vuln: unknown) => {
                    const v = vuln as NpmAuditVulnerability;
                    const severity = mapSeverity(v.severity);
                    results.push({
                        id: uuidv4(),
                        scanner: 'npm-audit',
                        severity,
                        title: `${v.name}: ${v.title}`,
                        description: v.title,
                        fix: v.fixAvailable ? 'Update available' : undefined,
                    });
                });
            } catch (e) {
                // npm audit returns exit code 1 when vulnerabilities are found
                try {
                    const parsed = JSON.parse((e as { stdout?: string }).stdout || '{}');
                    Object.values(parsed.vulnerabilities || {}).forEach((vuln: unknown) => {
                        const v = vuln as NpmAuditVulnerability;
                        const severity = mapSeverity(v.severity);
                        results.push({
                            id: uuidv4(),
                            scanner: 'npm-audit',
                            severity,
                            title: `${v.name}: ${v.title}`,
                            description: v.title,
                            fix: v.fixAvailable ? 'Update available' : undefined,
                        });
                    });
                } catch { }
            }
        }

        // Generate fix prompts for all results
        results.forEach(r => {
            r.fixPrompt = generateFixPrompt(r);
        });

        // Calculate summary
        const summary: ScanSummary = {
            total: results.length,
            critical: results.filter(r => r.severity === 'critical').length,
            high: results.filter(r => r.severity === 'high').length,
            medium: results.filter(r => r.severity === 'medium').length,
            low: results.filter(r => r.severity === 'low').length,
            info: results.filter(r => r.severity === 'info').length,
            scanners: {
                semgrep: results.filter(r => r.scanner === 'semgrep').length,
                trivy: results.filter(r => r.scanner === 'trivy').length,
                gitleaks: results.filter(r => r.scanner === 'gitleaks').length,
                'npm-audit': results.filter(r => r.scanner === 'npm-audit').length,
            },
        };

        // Cleanup
        await rm(scanDir, { recursive: true, force: true });

        return NextResponse.json({
            success: true,
            scanId,
            repoUrl,
            results,
            summary,
        });

    } catch (error) {
        // Cleanup on error
        try {
            await rm(scanDir, { recursive: true, force: true });
        } catch { }

        console.error("Scan error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Scan failed",
        }, { status: 500 });
    }
}

function mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const s = severity.toLowerCase();
    if (s === 'critical' || s === 'error') return 'critical';
    if (s === 'high' || s === 'warning') return 'high';
    if (s === 'medium' || s === 'moderate') return 'medium';
    if (s === 'low') return 'low';
    return 'info';
}
