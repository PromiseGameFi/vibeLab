import { allPatterns, VulnPattern, patternStats } from './scanPatterns';
import { allWeb3Patterns, detectWeb3Language } from './web3Patterns';
import { allApiPatterns } from './apiSecurityPatterns';
import { allAdditionalPatterns } from './additionalPatterns';

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
    scanner?: 'vibelab-patterns' | 'web3-patterns';
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

export interface EngineStatus {
    id: string;
    name: string;
    status: 'waiting' | 'scanning' | 'complete' | 'error';
    findings: number;
}

export interface DetailedProgress {
    phase: 'connecting' | 'fetching' | 'scanning' | 'analyzing' | 'complete';
    currentFile?: string;
    filesScanned: number;
    totalFiles: number;
    engines: EngineStatus[];
    auditLog: string[];
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
        web3Findings: number;
        pentestFindings: number;
        infraFindings: number;
        unitTestFindings: number;
        maliciousFindings: number;
    };
    patternsUsed: number;
}

export interface ScanOptions {
    githubToken?: string;
    maxFiles?: number;
    onProgress?: (progress: DetailedProgress) => void;
}

let currentToken: string | undefined;

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Core scan function
export function scanFileContent(
    content: string,
    filename: string,
    patterns: VulnPattern[] = allPatterns
): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const lines = content.split('\n');
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'sol': 'solidity', 'go': 'go', 'java': 'java',
        'rb': 'ruby', 'php': 'php', 'cs': 'csharp', 'rs': 'rust'
    };
    const fileLanguage = langMap[ext];

    for (const pattern of patterns) {
        if (pattern.languages && fileLanguage && !pattern.languages.includes(fileLanguage)) continue;
        pattern.pattern.lastIndex = 0;
        let match;
        while ((match = pattern.pattern.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
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
                scanner: 'vibelab-patterns',
            });
            if (!pattern.pattern.global) break;
        }
    }
    return findings;
}

// Specialized scanners
export function scanWeb3Content(content: string, filename: string): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const web3Language = detectWeb3Language(filename);
    if (!web3Language) return findings;
    const applicablePatterns = allWeb3Patterns.filter(p => {
        if (p.language === 'typescript') return web3Language === 'typescript' || web3Language === 'javascript';
        return p.language === web3Language;
    });
    for (const pattern of applicablePatterns) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        const lines = content.split('\n');
        let match;
        while ((match = regex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
            findings.push({
                id: generateId(),
                ruleId: pattern.id,
                severity: pattern.severity,
                category: pattern.category,
                title: pattern.name,
                message: pattern.description,
                file: filename,
                line: lineNumber,
                code: (lines[lineNumber - 1] || '').trim().substring(0, 200),
                fix: pattern.fix,
                scanner: 'web3-patterns',
            });
            if (!regex.global) break;
        }
    }
    return findings;
}

export function scanApiContent(content: string, filename: string): ScanFinding[] {
    return scanFileContent(content, filename, allPatterns.filter(p => p.category === 'api'));
}

export function scanAdditionalContent(content: string, filename: string): ScanFinding[] {
    const lowerName = filename.toLowerCase();
    const isDockerfile = lowerName.includes('dockerfile');
    const isCICD = lowerName.includes('.github/workflows') || lowerName.includes('.gitlab-ci');
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const isReactFile = ['js', 'jsx', 'ts', 'tsx'].includes(ext);

    const applicablePatterns = allAdditionalPatterns.filter(p => {
        if (p.category === 'container' && !isDockerfile) return false;
        if (p.category === 'cicd' && !isCICD) return false;
        if (p.category === 'react' && !isReactFile) return false;
        return true;
    });

    const findings: ScanFinding[] = [];
    const lines = content.split('\n');
    for (const pattern of applicablePatterns) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        let match;
        while ((match = regex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
            findings.push({
                id: generateId(),
                ruleId: pattern.id,
                severity: pattern.severity,
                category: pattern.category,
                title: pattern.name,
                message: pattern.description,
                file: filename,
                line: lineNumber,
                code: (lines[lineNumber - 1] || '').trim().substring(0, 200),
                fix: pattern.fix,
                scanner: 'vibelab-patterns',
            });
            if (!regex.global) break;
        }
    }
    return findings;
}

// GitHub API Helpers
const getGitHubHeaders = () => {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeLab-Scanner/1.0'
    };
    const token = currentToken || process.env.GITHUB_TOKEN;
    if (token) headers['Authorization'] = `token ${token}`;
    return headers;
};

export async function fetchRepoContents(repoUrl: string) {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '').replace(/\/$/, '');
    const branches = ['main', 'master'];
    let treeData = null;
    for (const branch of branches) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${branch}?recursive=1`, { headers: getGitHubHeaders() });
            if (response.ok) { treeData = await response.json(); break; }
        } catch { }
    }
    if (!treeData) throw new Error('Repo fetch failed');
    return processTree(owner, cleanRepo, treeData.tree);
}

async function processTree(owner: string, repo: string, tree: any[]) {
    const files: any[] = [];
    let packageJson: any;
    const scannable = ['.js', '.jsx', '.ts', '.tsx', '.py', '.sol', '.go', '.java', '.rb', '.php', '.yml', '.yaml', '.json', '.sh'];
    const targets = tree.filter(t => t.type === 'blob' && scannable.some(ext => t.path.endsWith(ext))).slice(0, 200);
    for (const file of targets) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, { headers: getGitHubHeaders() });
            if (res.ok) {
                const data = await res.json();
                const content = atob(data.content.replace(/\n/g, ''));
                files.push({ path: file.path, content });
                if (file.path.endsWith('package.json')) packageJson = JSON.parse(content);
            }
        } catch { }
    }
    return { files, packageJson };
}

// Progress-aware Main Scanner
export async function scanRepository(repoUrl: string, options?: ScanOptions): Promise<ScanResult> {
    const onProgress = options?.onProgress;
    const engines: EngineStatus[] = [
        { id: 'sast', name: 'SAST Core', status: 'waiting', findings: 0 },
        { id: 'pentest', name: 'Pentest Engine', status: 'waiting', findings: 0 },
        { id: 'unittest', name: 'Unit Test Guard', status: 'waiting', findings: 0 },
        { id: 'infra', name: 'Infra Audit', status: 'waiting', findings: 0 },
        { id: 'supply', name: 'Supply Chain', status: 'waiting', findings: 0 }
    ];
    const auditLog: string[] = [];

    const updateProgress = (phase: DetailedProgress['phase'], currentFile?: string, filesScanned = 0, totalFiles = 0) => {
        onProgress?.({ phase, currentFile, filesScanned, totalFiles, engines: [...engines], auditLog: [...auditLog].slice(-10) });
    };

    const addLog = (msg: string) => {
        auditLog.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
        updateProgress('scanning');
    };

    currentToken = options?.githubToken;
    addLog("Initializing expert engines...");
    const { owner, repo } = { owner: repoUrl.split('/')[3], repo: repoUrl.split('/')[4] }; // simplified for progress
    updateProgress('fetching');
    const { files, packageJson } = await fetchRepoContents(repoUrl);

    updateProgress('scanning', undefined, 0, files.length);
    const allFindings: ScanFinding[] = [];
    const batchSize = 5;

    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(async (file) => {
            engines[0].status = 'scanning';
            const sast = scanFileContent(file.content, file.path);
            engines[0].findings += sast.length; allFindings.push(...sast);

            engines[1].status = 'scanning';
            const pentest = scanFileContent(file.content, file.path, allPatterns.filter(p => p.category === 'pentest'));
            engines[1].findings += pentest.length; allFindings.push(...pentest);

            engines[2].status = 'scanning';
            const ut = (file.path.includes('test') || file.path.includes('spec'))
                ? scanFileContent(file.content, file.path, allPatterns.filter(p => p.category === 'test-security')) : [];
            engines[2].findings += ut.length; allFindings.push(...ut);

            engines[3].status = 'scanning';
            const infra = scanFileContent(file.content, file.path, allPatterns.filter(p => p.category === 'infra' || p.category === 'cloud'));
            engines[3].findings += infra.length; allFindings.push(...infra);

            allFindings.push(...scanWeb3Content(file.content, file.path));
        }));
        updateProgress('scanning', batch[batch.length - 1].path, Math.min(i + batchSize, files.length), files.length);
    }

    engines.forEach(e => e.status = 'complete');
    addLog("Auditing supply chain...");
    const dependencyVulns = packageJson ? await scanDependencies(packageJson) : [];

    const stats = {
        filesScanned: files.length,
        totalFindings: allFindings.length + dependencyVulns.length,
        critical: allFindings.filter(f => f.severity === 'critical').length + dependencyVulns.filter(d => d.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length + dependencyVulns.filter(d => d.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length + dependencyVulns.filter(d => d.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length + dependencyVulns.filter(d => d.severity === 'low').length,
        info: allFindings.filter(f => f.severity === 'info').length,
        dependencyVulns: dependencyVulns.length,
        web3Findings: allFindings.filter(f => f.scanner === 'web3-patterns').length,
        pentestFindings: allFindings.filter(f => f.category === 'pentest').length,
        infraFindings: allFindings.filter(f => f.category === 'infra' || f.category === 'cloud').length,
        unitTestFindings: allFindings.filter(f => f.category === 'test-security').length,
        maliciousFindings: allFindings.filter(f => f.category === 'malicious').length,
    };

    updateProgress('complete');
    return { findings: allFindings, dependencies: dependencyVulns, stats, patternsUsed: patternStats.total };
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
    const allMerged = [...osvVulns, ...depsDevVulns, ...githubVulns];
    const seen = new Set<string>();

    for (const vuln of allMerged) {
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
            data.results?.forEach((result: any, index: number) => {
                const [pkgName, pkgVersion] = deps[index];
                result.vulns?.forEach((vuln: any) => {
                    vulns.push({
                        id: generateId(),
                        package: pkgName,
                        version: pkgVersion,
                        severity: mapCvssSeverity(vuln.severity),
                        title: vuln.summary || vuln.id,
                        description: vuln.details || vuln.summary || 'Vulnerability detected',
                        fixedVersion: vuln.affected?.[0]?.ranges?.[0]?.events?.find((e: any) => e.fixed)?.fixed,
                        cve: vuln.aliases?.find((a: string) => a.startsWith('CVE-')),
                    });
                });
            });
        }
    } catch (e) { console.warn('OSV API error:', e); }
    return vulns;
}

// deps.dev API (Google)
async function queryDepsDev(deps: [string, string][]): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];
    const packagesToQuery = deps.slice(0, 20);

    for (const [name, version] of packagesToQuery) {
        try {
            const cleanVersion = version.replace(/^[\^~>=<]/, '').split(' ')[0];
            const url = `https://api.deps.dev/v3/systems/npm/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(cleanVersion)}`;
            const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                const data = await response.json();
                if (data.advisoryKeys?.length > 0) {
                    for (const advisory of data.advisoryKeys) {
                        vulns.push({
                            id: generateId(), package: name, version: cleanVersion, severity: 'high',
                            title: `Security Advisory: ${advisory.id}`,
                            description: `Package ${name}@${cleanVersion} has a security advisory`,
                            cve: advisory.id.startsWith('CVE-') ? advisory.id : undefined,
                        });
                    }
                }
            }
        } catch { }
        await new Promise(r => setTimeout(r, 100));
    }
    return vulns;
}

// GitHub Advisory API
async function queryGitHubAdvisory(deps: [string, string][]): Promise<DependencyVuln[]> {
    const vulns: DependencyVuln[] = [];
    const packagesToQuery = deps.slice(0, 10);
    for (const [name] of packagesToQuery) {
        try {
            const response = await fetch(`https://api.github.com/advisories?ecosystem=npm&package=${encodeURIComponent(name)}&per_page=5`, { headers: { 'Accept': 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                const advisories = await response.json();
                for (const adv of advisories) {
                    vulns.push({
                        id: generateId(), package: name, version: 'any', severity: mapGitHubSeverity(adv.severity),
                        title: adv.summary || adv.ghsa_id,
                        description: adv.description?.slice(0, 500) || 'Security advisory',
                        cve: adv.cve_id,
                        fixedVersion: adv.vulnerabilities?.[0]?.patched_versions,
                    });
                }
            }
        } catch { }
        await new Promise(r => setTimeout(r, 100));
    }
    return vulns;
}

function mapCvssSeverity(severity?: any[]): 'critical' | 'high' | 'medium' | 'low' {
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
    const map: any = { 'critical': 'critical', 'high': 'high', 'moderate': 'medium', 'low': 'low' };
    return map[severity?.toLowerCase()] || 'medium';
}

function parseRepoUrl(url: string): { owner: string, repo: string } {
    const cleanUrl = url.replace('https://github.com/', '').replace(/\/$/, '').replace(/\.git$/, '');
    const [owner, repo] = cleanUrl.split('/');
    return { owner, repo };
}
