import { NextRequest, NextResponse } from "next/server";
import { scanRepository, ScanResult } from "@/lib/frontendScanner";
import { patternStats } from "@/lib/scanPatterns";
import { v4 as uuidv4 } from "uuid";

// Frontend-only scanner - 100% free, works on Vercel
// Uses: GitHub API + JS patterns + OSV API (no system binaries)

export async function POST(request: NextRequest) {
    const scanId = uuidv4();

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

        // Run the frontend-only scan
        const result: ScanResult = await scanRepository(repoUrl);

        // Convert to response format
        const findings = [
            ...result.findings.map(f => ({
                id: f.id,
                scanner: 'vibelab-patterns',
                severity: f.severity,
                title: f.title,
                description: f.message,
                file: f.file,
                line: f.line,
                code: f.code,
                cwe: f.cwe,
                owasp: f.owasp,
                category: f.category,
            })),
            ...result.dependencies.map(d => ({
                id: d.id,
                scanner: 'osv-api',
                severity: d.severity,
                title: d.title,
                description: d.description,
                file: 'package.json',
                package: d.package,
                version: d.version,
                fixedVersion: d.fixedVersion,
                cve: d.cve,
                category: 'dependency',
            })),
        ];

        const summary = {
            total: result.stats.totalFindings,
            critical: result.stats.critical,
            high: result.stats.high,
            medium: result.stats.medium,
            low: result.stats.low,
            info: result.stats.info,
            scanners: {
                'vibelab-patterns': result.findings.length,
                'osv-api': result.dependencies.length,
            },
        };

        console.log(`Scan complete: ${result.stats.totalFindings} findings using ${result.patternsUsed} patterns`);

        return NextResponse.json({
            success: true,
            scanId,
            repoUrl,
            results: findings,
            summary,
            stats: {
                filesScanned: result.stats.filesScanned,
                patternsUsed: result.patternsUsed,
                dependencyVulns: result.stats.dependencyVulns,
            },
            meta: {
                engine: 'vibelab-frontend-scanner',
                version: '2.0.0',
                patternCategories: patternStats,
            },
        });

    } catch (error) {
        console.error("Scan error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Scan failed",
        }, { status: 500 });
    }
}
