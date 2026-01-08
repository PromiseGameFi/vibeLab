// Frontend-only security scanner engine
// 100% free, works on Vercel, no external binaries needed

import { allPatterns, VulnPattern, patternStats } from './scanPatterns';

export interface ScanFinding {
    id: string;
    ruleId: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    message: string;
    file: string;
    line: number;
    code: string;
    cwe?: string;
    owasp?: string;
    fix?: string;
}

export interface DependencyVuln {
    id: string;
    package: string;
    version: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    fixedVersion?: string;
    cve?: string;
}

export interface ScanResult {
    findings: ScanFinding[];
    dependencies: DependencyVuln[];
    stats: {
        filesScanned: number;
        totalFindings: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
        dependencyVulns: number;
    };
    patternsUsed: number;
}

// Generate unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Scan a single file content against all patterns
export function scanFileContent(
    content: string,
    filename: string,
    patterns: VulnPattern[] = allPatterns
): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const lines = content.split('\n');

    // Determine file language
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'sol': 'solidity', 'go': 'go', 'java': 'java',
        'rb': 'ruby', 'php': 'php', 'cs': 'csharp', 'rs': 'rust',
    };
    const fileLanguage = langMap[ext];

    for (const pattern of patterns) {
        // Skip patterns for other languages
        if (pattern.languages && fileLanguage && !pattern.languages.includes(fileLanguage)) {
            continue;
        }

        // Reset regex lastIndex
        pattern.pattern.lastIndex = 0;

        let match;
        while ((match = pattern.pattern.exec(content)) !== null) {
            // Find line number
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

            // Get the matching line
            const codeLine = lines[lineNumber - 1] || '';

            findings.push({
                id: generateId(),
                ruleId: pattern.id,
                severity: pattern.severity,
                category: pattern.category,
                title: pattern.title,
                message: pattern.message,
                file: filename,
                line: lineNumber,
                code: codeLine.trim().substring(0, 200),
                cwe: pattern.cwe,
                owasp: pattern.owasp,
                fix: pattern.fix,
            });

            // Prevent infinite loops for non-global regex
            if (!pattern.pattern.global) break;
        }
    }

    return findings;
}

// GitHub token for higher rate limits (5000/hour vs 60/hour)
const getGitHubHeaders = () => {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeLab-Scanner/1.0'
    };

    // Use token if available (server-side only)
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Fetch repository contents via GitHub API
export async function fetchRepoContents(
    repoUrl: string
): Promise<{ files: Array<{ path: string; content: string }>; packageJson?: object }> {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) throw new Error('Invalid GitHub URL. Please use format: https://github.com/owner/repo');

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '').replace(/\/$/, '');

    // Try multiple branches
    const branches = ['main', 'master', 'develop', 'dev'];
    let treeData = null;
    let lastError = '';

    for (const branch of branches) {
        try {
            const treeUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${branch}?recursive=1`;
            const response = await fetch(treeUrl, { headers: getGitHubHeaders() });

            if (response.ok) {
                treeData = await response.json();
                break;
            } else if (response.status === 403) {
                const remaining = response.headers.get('X-RateLimit-Remaining');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                if (remaining === '0') {
                    const resetTime = new Date(Number(rateLimitReset) * 1000).toLocaleTimeString();
                    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}. Add GITHUB_TOKEN to .env.local for 5000 req/hour.`);
                }
                lastError = 'Access forbidden';
            } else if (response.status === 404) {
                lastError = `Branch '${branch}' not found`;
                continue;
            } else {
                lastError = `GitHub API error: ${response.status}`;
            }
        } catch (e) {
            if ((e as Error).message.includes('rate limit')) throw e;
            lastError = (e as Error).message;
        }
    }

    if (!treeData || !treeData.tree) {
        throw new Error(`Failed to fetch repo: ${lastError}. Make sure the repository is public.`);
    }

    return processTree(owner, cleanRepo, treeData.tree);
}

async function processTree(
    owner: string,
    repo: string,
    tree: Array<{ path: string; type: string; size?: number }>
): Promise<{ files: Array<{ path: string; content: string }>; packageJson?: object }> {
    const files: Array<{ path: string; content: string }> = [];
    let packageJson: object | undefined;

    // Filter scannable files
    const scannableExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.sol', '.go', '.java', '.rb', '.php',
        '.cs', '.rs', '.vue', '.svelte', '.yaml', '.yml', '.json', '.env', '.sh',
    ];

    const scannableFiles = tree.filter(item => {
        if (item.type !== 'blob') return false;
        if ((item.size || 0) > 500000) return false; // Skip files > 500KB
        if (item.path.includes('node_modules/')) return false;
        if (item.path.includes('vendor/')) return false;
        if (item.path.includes('.min.')) return false;
        if (item.path.includes('dist/')) return false;
        if (item.path.includes('build/')) return false;

        return scannableExtensions.some(ext => item.path.endsWith(ext));
    });

    // Fetch file contents (limit to 50 files for performance)
    const filesToFetch = scannableFiles.slice(0, 50);

    for (const file of filesToFetch) {
        try {
            const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
            const response = await fetch(contentUrl, { headers: getGitHubHeaders() });

            if (response.ok) {
                const data = await response.json();
                if (data.encoding === 'base64' && data.content) {
                    const content = atob(data.content.replace(/\n/g, ''));
                    files.push({ path: file.path, content });

                    // Capture package.json for dependency scanning
                    if (file.path === 'package.json' || file.path.endsWith('/package.json')) {
                        try {
                            packageJson = JSON.parse(content);
                        } catch { }
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch ${file.path}:`, e);
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 50));
    }

    return { files, packageJson };
}

// Scan dependencies using OSV API (Google's Open Source Vulnerabilities)
export async function scanDependencies(
    packageJson: object
): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];

    const pkg = packageJson as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };

    const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
    };

    const depEntries = Object.entries(allDeps).slice(0, 100);
    if (depEntries.length === 0) return vulns;

    // Query all APIs in parallel for maximum coverage
    const [osvVulns, depsDevVulns, githubVulns] = await Promise.all([
        queryOSV(depEntries),
        queryDepsDev(depEntries),
        queryGitHubAdvisory(depEntries),
    ]);

    // Merge and deduplicate
    const allVulns = [...osvVulns, ...depsDevVulns, ...githubVulns];
    const seen = new Set<string>();

    for (const vuln of allVulns) {
        const key = `${vuln.package}:${vuln.cve || vuln.title}`;
        if (!seen.has(key)) {
            seen.add(key);
            vulns.push(vuln);
        }
    }

    return vulns;
}

// OSV API (Google) - 40,000+ CVEs
async function queryOSV(deps: [string, string][]): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];
    const queries = deps.map(([name, version]) => ({
        package: { name, ecosystem: 'npm' },
        version: version.replace(/^[\^~>=<]/, '').split(' ')[0],
    }));

    try {
        const response = await fetch('https://api.osv.dev/v1/querybatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queries }),
        });

        if (response.ok) {
            const data = await response.json();
            data.results?.forEach((result: {
                vulns?: Array<{
                    id: string; summary?: string; details?: string;
                    severity?: Array<{ type: string; score: string }>;
                    affected?: Array<{ ranges?: Array<{ events?: Array<{ fixed?: string }> }> }>;
                    aliases?: string[];
                }>
            }, index: number) => {
                const [pkgName, pkgVersion] = deps[index];
                result.vulns?.forEach(vuln => {
                    vulns.push({
                        id: generateId(),
                        package: pkgName,
                        version: pkgVersion,
                        severity: mapCvssSeverity(vuln.severity),
                        title: vuln.summary || vuln.id,
                        description: vuln.details || vuln.summary || 'Vulnerability detected',
                        fixedVersion: vuln.affected?.[0]?.ranges?.[0]?.events?.find(e => e.fixed)?.fixed,
                        cve: vuln.aliases?.find(a => a.startsWith('CVE-')),
                    });
                });
            });
        }
    } catch (e) { console.warn('OSV API error:', e); }
    return vulns;
}

// deps.dev API (Google) - Comprehensive package data
async function queryDepsDev(deps: [string, string][]): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];

    // Query top 20 packages to avoid rate limits
    const packagesToQuery = deps.slice(0, 20);

    for (const [name, version] of packagesToQuery) {
        try {
            const cleanVersion = version.replace(/^[\^~>=<]/, '').split(' ')[0];
            const url = `https://api.deps.dev/v3/systems/npm/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(cleanVersion)}`;

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                const data = await response.json();

                // Check for advisories
                if (data.advisoryKeys?.length > 0) {
                    for (const advisory of data.advisoryKeys) {
                        vulns.push({
                            id: generateId(),
                            package: name,
                            version: cleanVersion,
                            severity: 'high',
                            title: `Security Advisory: ${advisory.id}`,
                            description: `Package ${name}@${cleanVersion} has a security advisory`,
                            cve: advisory.id.startsWith('CVE-') ? advisory.id : undefined,
                        });
                    }
                }
            }
        } catch { /* Skip on error */ }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
    }

    return vulns;
}

// GitHub Advisory API - Real-time CVEs
async function queryGitHubAdvisory(deps: [string, string][]): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];

    // Query top 10 packages
    const packagesToQuery = deps.slice(0, 10);

    for (const [name] of packagesToQuery) {
        try {
            const url = `https://api.github.com/advisories?ecosystem=npm&package=${encodeURIComponent(name)}&per_page=5`;

            const response = await fetch(url, {
                headers: { 'Accept': 'application/vnd.github+json' },
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                const advisories = await response.json();

                for (const adv of advisories) {
                    vulns.push({
                        id: generateId(),
                        package: name,
                        version: 'any',
                        severity: mapGitHubSeverity(adv.severity),
                        title: adv.summary || adv.ghsa_id,
                        description: adv.description?.slice(0, 500) || 'Security advisory',
                        cve: adv.cve_id,
                        fixedVersion: adv.vulnerabilities?.[0]?.patched_versions,
                    });
                }
            }
        } catch { /* Skip on error */ }

        await new Promise(r => setTimeout(r, 100));
    }

    return vulns;
}

function mapCvssSeverity(severity?: Array<{ type: string; score: string }>): 'critical' | 'high' | 'medium' | 'low' {
    if (!severity?.length) return 'medium';
    const cvss = severity.find(s => s.type === 'CVSS_V3');
    if (cvss) {
        const score = parseFloat(cvss.score);
        if (score >= 9.0) return 'critical';
        if (score >= 7.0) return 'high';
        if (score >= 4.0) return 'medium';
        return 'low';
    }
    return 'medium';
}

function mapGitHubSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const map: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
        'critical': 'critical', 'high': 'high', 'moderate': 'medium', 'low': 'low'
    };
    return map[severity?.toLowerCase()] || 'medium';
}

// Main scan function with enhanced multi-API detection
export async function scanRepository(repoUrl: string): Promise<ScanResult> {
    // Fetch repo contents
    const { files, packageJson } = await fetchRepoContents(repoUrl);

    // Scan all files with expanded patterns
    const allFindings: ScanFinding[] = [];
    for (const file of files) {
        const findings = scanFileContent(file.content, file.path);
        allFindings.push(...findings);
    }

    // Scan dependencies with multiple APIs
    const dependencyVulns = packageJson ? await scanDependencies(packageJson) : [];

    // Calculate stats
    const stats = {
        filesScanned: files.length,
        totalFindings: allFindings.length + dependencyVulns.length,
        critical: allFindings.filter(f => f.severity === 'critical').length + dependencyVulns.filter(d => d.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length + dependencyVulns.filter(d => d.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length + dependencyVulns.filter(d => d.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length + dependencyVulns.filter(d => d.severity === 'low').length,
        info: allFindings.filter(f => f.severity === 'info').length,
        dependencyVulns: dependencyVulns.length,
        apisQueried: 3, // OSV, deps.dev, GitHub Advisory
    };

    return {
        findings: allFindings,
        dependencies: dependencyVulns,
        stats,
        patternsUsed: patternStats.total,
    };
}

