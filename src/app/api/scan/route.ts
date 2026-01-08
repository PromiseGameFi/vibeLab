import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdir, rm, readFile } from "fs/promises";
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

// Helper to run command and capture output even on non-zero exit
async function runCommand(cmd: string, options: { cwd: string; timeout: number; maxBuffer?: number }): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
        exec(cmd, {
            cwd: options.cwd,
            timeout: options.timeout,
            maxBuffer: options.maxBuffer || 50 * 1024 * 1024,
        }, (error, stdout, stderr) => {
            resolve({
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: error ? (error as NodeJS.ErrnoException & { code?: number }).code || 1 : 0
            });
        });
    });
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
        const cloneResult = await runCommand(`git clone --depth 1 ${cloneUrl} repo`, { cwd: scanDir, timeout: 120000 });

        if (cloneResult.exitCode !== 0 && !existsSync(path.join(scanDir, "repo"))) {
            throw new Error(`Failed to clone repository: ${cloneResult.stderr}`);
        }

        const repoPath = path.join(scanDir, "repo");
        const results: ScanResult[] = [];
        const scanStats = { semgrep: 0, trivy: 0, gitleaks: 0, npm: 0 };

        // Path to custom Vibeship rules (2000+ rules)
        const rulesDir = path.join(process.cwd(), 'src/lib/scanner-rules');
        const gitleaksConfig = path.join(process.cwd(), 'src/lib/gitleaks.toml');

        // ===== SEMGREP SCAN =====
        // Using custom rules + multiple public rule packs for maximum detection
        // This provides Vercel-compatible scanning without Docker
        const publicPacks = [
            'p/r2c-security-audit',  // Security audit rules
            'p/r2c-ci',              // CI/CD security
            'p/owasp-top-ten',       // OWASP Top 10
            'p/cwe-top-25',          // CWE Top 25
            'p/javascript',          // JS security
            'p/typescript',          // TS security
            'p/python',              // Python security
            'p/nodejs',              // Node.js security
            'p/react',               // React security
            'p/default',             // Default comprehensive
        ].map(p => `--config=${p}`).join(' ');

        const semgrepResult = await runCommand(
            `semgrep --config=${rulesDir} ${publicPacks} --json --timeout 300 --max-target-bytes 10000000 . 2>/dev/null || true`,
            { cwd: repoPath, timeout: 600000, maxBuffer: 100 * 1024 * 1024 }
        );

        try {
            // Try to parse JSON from stdout
            const jsonMatch = semgrepResult.stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const semgrepResults = JSON.parse(jsonMatch[0]);

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
                    scanStats.semgrep++;
                });
            }
        } catch (e) {
            console.error("Semgrep parse error:", e);
        }

        // ===== TRIVY SCAN (vulnerabilities + secrets + misconfig) =====
        const trivyResult = await runCommand(
            `trivy fs --format json --scanners vuln,secret,misconfig --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL . 2>/dev/null || true`,
            { cwd: repoPath, timeout: 180000 }
        );

        try {
            const jsonMatch = trivyResult.stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const trivyResults = JSON.parse(jsonMatch[0]);

                trivyResults.Results?.forEach((result: {
                    Vulnerabilities?: TrivyVulnerability[],
                    Secrets?: Array<{ Title: string; Severity: string; Match: string; StartLine: number }>,
                    Misconfigurations?: Array<{ Title: string; Severity: string; Message: string; Resolution: string }>,
                    Target?: string
                }) => {
                    // Vulnerabilities
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
                        scanStats.trivy++;
                    });

                    // Secrets from Trivy
                    result.Secrets?.forEach((secret) => {
                        results.push({
                            id: uuidv4(),
                            scanner: 'trivy',
                            severity: 'critical',
                            title: `Secret: ${secret.Title}`,
                            description: `Secret detected in ${result.Target}`,
                            file: result.Target,
                            line: secret.StartLine,
                            code: secret.Match?.slice(0, 50) + '...',
                        });
                        scanStats.trivy++;
                    });

                    // Misconfigurations
                    result.Misconfigurations?.forEach((misconf) => {
                        const severity = mapSeverity(misconf.Severity);
                        results.push({
                            id: uuidv4(),
                            scanner: 'trivy',
                            severity,
                            title: misconf.Title,
                            description: misconf.Message,
                            file: result.Target,
                            fix: misconf.Resolution,
                        });
                        scanStats.trivy++;
                    });
                });
            }
        } catch (e) {
            console.error("Trivy parse error:", e);
        }

        // ===== GITLEAKS SCAN =====
        // Using custom Vibeship config with 45+ secret patterns
        const gitleaksReport = path.join(scanDir, "gitleaks.json");
        await runCommand(
            `gitleaks detect --source . --config ${gitleaksConfig} --report-path ${gitleaksReport} --report-format json --no-git 2>/dev/null || true`,
            { cwd: repoPath, timeout: 120000 }
        );

        if (existsSync(gitleaksReport)) {
            try {
                const gitleaksOut = await readFile(gitleaksReport, 'utf-8');
                if (gitleaksOut.trim()) {
                    const gitleaksResults: GitleaksSecret[] = JSON.parse(gitleaksOut);

                    gitleaksResults.forEach((secret: GitleaksSecret) => {
                        results.push({
                            id: uuidv4(),
                            scanner: 'gitleaks',
                            severity: 'critical',
                            title: `Secret: ${secret.Description}`,
                            description: `Potential secret or credential found`,
                            file: secret.File,
                            line: secret.StartLine,
                            code: secret.Match?.replace(/./g, '*').slice(0, 30) + '***',
                        });
                        scanStats.gitleaks++;
                    });
                }
            } catch (e) {
                console.error("Gitleaks parse error:", e);
            }
        }

        // ===== NPM AUDIT =====
        const packageJsonPath = path.join(repoPath, "package.json");
        if (existsSync(packageJsonPath)) {
            // Install deps first
            await runCommand('npm install --package-lock-only --ignore-scripts 2>/dev/null || true', {
                cwd: repoPath,
                timeout: 180000
            });

            const npmResult = await runCommand('npm audit --json 2>/dev/null || true', {
                cwd: repoPath,
                timeout: 60000
            });

            try {
                const jsonMatch = npmResult.stdout.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const npmResults = JSON.parse(jsonMatch[0]);

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
                        scanStats.npm++;
                    });
                }
            } catch (e) {
                console.error("npm audit parse error:", e);
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
                semgrep: scanStats.semgrep,
                trivy: scanStats.trivy,
                gitleaks: scanStats.gitleaks,
                'npm-audit': scanStats.npm,
            },
        };

        // Cleanup
        await rm(scanDir, { recursive: true, force: true });

        console.log(`Scan complete: ${results.length} findings from ${Object.values(scanStats).reduce((a, b) => a + b, 0)} total checks`);

        return NextResponse.json({
            success: true,
            scanId,
            repoUrl,
            results,
            summary,
            stats: scanStats,
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
    const s = severity?.toLowerCase() || '';
    if (s === 'critical' || s === 'error') return 'critical';
    if (s === 'high' || s === 'warning') return 'high';
    if (s === 'medium' || s === 'moderate') return 'medium';
    if (s === 'low') return 'low';
    return 'info';
}
