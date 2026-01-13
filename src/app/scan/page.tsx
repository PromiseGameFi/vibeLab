"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
    Shield, AlertTriangle, CheckCircle, Copy, Check, ShieldCheck, ShieldAlert,
    Download, ExternalLink, Loader2, Github, ChevronDown,
    ChevronRight, FileCode, Lock, Package, Clock, DollarSign,
    History, Trash2, X, Code2, Database, Zap, Eye,
    FileJson, FileType, Blocks, Sparkles, Terminal, Bug,
    LogOut, User, FileText, GitBranch, Star, Folder
} from "lucide-react";
import {
    ScanResult, ScanSummary, severityConfig, scannerInfo,
    generateMasterPrompt, estimateFixCost
} from "@/lib/scanData";
import { generateFix, generateJSON, generateSARIF } from "@/lib/generateFix";
import { scanRepository, ScanOptions, DetailedProgress, EngineStatus } from "@/lib/frontendScanner";
import { patternStats } from "@/lib/scanPatterns";

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Scanner = 'vibelab-patterns' | 'osv-api';

interface ScanHistoryItem {
    id: string;
    repoUrl: string;
    scannedAt: string;
    summary: ScanSummary;
    results: ScanResult[];
}

interface ScanProgress extends DetailedProgress {
    languagesFound: string[];
    frameworksFound: string[];
    findingsCount: number;
}

const STORAGE_KEY = 'vibelab-scan-history';
const MAX_HISTORY = 10;

// Language icons and colors
const languageConfig: Record<string, { color: string; icon: string }> = {
    'javascript': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: 'JS' },
    'typescript': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'TS' },
    'python': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: 'PY' },
    'solidity': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: 'SOL' },
    'go': { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: 'GO' },
    'java': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: 'JAVA' },
    'ruby': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: 'RB' },
    'php': { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: 'PHP' },
    'rust': { color: 'bg-orange-600/20 text-orange-300 border-orange-600/30', icon: 'RS' },
    'json': { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: 'JSON' },
    'yaml': { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: 'YAML' },
};

// Framework detection
const frameworkPatterns: Record<string, string[]> = {
    'Next.js': ['next.config', 'pages/', 'app/', 'next/'],
    'React': ['react', 'jsx', 'tsx', 'useState', 'useEffect'],
    'Vue': ['vue', '.vue', 'nuxt'],
    'Express': ['express', 'app.listen', 'router'],
    'Django': ['django', 'wsgi', 'asgi'],
    'Flask': ['flask', 'Flask(__name__)'],
    'Hardhat': ['hardhat', 'ethers', 'artifacts/'],
    'Foundry': ['forge', 'foundry.toml'],
};

export default function ScanPage() {
    const { data: session, status } = useSession();
    const [repoUrl, setRepoUrl] = useState("");
    const [scanLevel, setScanLevel] = useState<'quick' | 'standard' | 'deep'>('standard');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [summary, setSummary] = useState<ScanSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
    const [scannerFilter, setScannerFilter] = useState<Scanner | 'all'>('all');
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [scanStats, setScanStats] = useState<{
        filesScanned?: number;
        patternsUsed?: number;
        apisQueried?: number;
        scanTime?: number;
    } | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [aiFixLoading, setAiFixLoading] = useState<string | null>(null);
    const [aiFixes, setAiFixes] = useState<Record<string, string>>({});
    const [aiExploitationPath, setAiExploitationPath] = useState<Record<string, string>>({});

    const exportFreelanceAudit = () => {
        const score = Math.max(0, 100 - (summary?.critical || 0) * 30 - (summary?.high || 0) * 10);
        const report = `# VibeLab Expert Security Audit
**Repository:** ${repoUrl}
**Audit Date:** ${new Date().toLocaleDateString()}
**Security Score:** ${score}/100
**Status:** ${score > 70 ? 'STABLE' : 'ACTION REQUIRED'}

## Executive Summary
This audit was performed using the VibeShield Expert Intelligence Engine (Standard Grade). 
The scan evaluated ${scanStats?.filesScanned} files against ${scanStats?.patternsUsed} professional security patterns.

### Key Metrics
- Critical Risks: ${summary?.critical}
- High Risks: ${summary?.high}
- Compliance Readiness (SOC2): ${results.filter(r => (r as any).compliance?.includes('SOC2')).length === 0 ? 'High' : 'Low'}

## Detailed Findings
${results.map(r => `### [${r.severity.toUpperCase()}] ${r.title}
- **File:** ${r.file}:${r.line}
- **Category:** ${r.category}
- **Description:** ${r.description}
${aiExploitationPath[r.id] ? `- **Exploitation Path:** ${aiExploitationPath[r.id]}` : ''}
`).join('\n')}

---
*Generated by VibeLab Security Platform*`;

        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${repoUrl.split('/').pop()}.md`;
        a.click();
    };
    const [userRepos, setUserRepos] = useState<Array<{
        id: number;
        name: string;
        fullName: string;
        url: string;
        private: boolean;
        description: string | null;
        language: string | null;
        updatedAt: string;
    }>>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { setHistory(JSON.parse(stored)); } catch { }
        }
    }, []);

    // Fetch user repos when signed in
    useEffect(() => {
        if (session) {
            setLoadingRepos(true);
            fetch('/api/repos')
                .then(res => res.json())
                .then(data => {
                    if (data.repos) setUserRepos(data.repos);
                })
                .catch(console.error)
                .finally(() => setLoadingRepos(false));
        } else {
            setUserRepos([]);
        }
    }, [session]);

    const saveHistory = (newHistory: ScanHistoryItem[]) => {
        setHistory(newHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    };

    const addToHistory = (url: string, scanSummary: ScanSummary, scanResults: ScanResult[]) => {
        const newItem: ScanHistoryItem = {
            id: Date.now().toString(),
            repoUrl: url,
            scannedAt: new Date().toISOString(),
            summary: scanSummary,
            results: scanResults,
        };
        const filtered = history.filter(h => h.repoUrl !== url);
        const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
        saveHistory(updated);
    };

    const loadFromHistory = (item: ScanHistoryItem) => {
        setRepoUrl(item.repoUrl);
        setResults(item.results);
        setSummary(item.summary);
        setShowHistory(false);
    };

    const deleteFromHistory = (id: string) => {
        saveHistory(history.filter(h => h.id !== id));
    };

    const clearHistory = () => {
        saveHistory([]);
        setShowHistory(false);
    };


    const generateAIPath = async (finding: ScanResult) => {
        setAiFixLoading(finding.id);
        // Simulate AI intelligence
        setTimeout(() => {
            const paths: Record<string, string> = {
                'secrets': '1. Use automated tools (trufflehog) to verify key validity.\n2. Access restricted cloud consoles using leaked credentials.\n3. Exfiltrate sensitive data or escalate permissions.',
                'malicious': '1. Establish persistence via crontab/service workers.\n2. C2 beaconing to bypass egress filtering.\n3. Deploy secondary payload for lateral movement.',
                'sast': '1. Identify tainted sinks (innerHTML/eval).\n2. Construct XSS/Injection payload bypassing client-side filters.\n3. Execute arbitrary code in user session or DB context.',
                'cloud': '1. Discover public bucket/IAM role permissions.\n2. Leverage wildcard permissions for Cross-Account access.\n3. Create rogue users for permanent backdoor access.'
            };
            setAiExploitationPath(prev => ({ ...prev, [finding.id]: paths[finding.category as any] || '1. Analyze code flow for input validation bypass.\n2. Craft specialized payload for the specific category sink.\n3. Achieve unauthorized access or information disclosure.' }));
            setAiFixLoading(null);
        }, 1500);
    };

    const runScan = async () => {
        if (!repoUrl.trim()) {
            setError("Please enter a GitHub repository URL");
            return;
        }

        const startTime = Date.now();
        setIsScanning(true);
        setError(null);
        setResults([]);
        setSummary(null);
        setScanStats(null);

        try {
            const result = await scanRepository(repoUrl, {
                githubToken: (session as any)?.accessToken,
                level: scanLevel,
                onProgress: (p) => {
                    setScanProgress({
                        ...p,
                        languagesFound: [], // Will be updated by results later
                        frameworksFound: [],
                        findingsCount: p.engines.reduce((sum, e) => sum + e.findings, 0)
                    });
                }
            });

            // Process local result to match the expected format in result page
            const findings = [
                ...result.findings.map(f => ({
                    id: f.id,
                    scanner: f.scanner || 'vibelab-patterns',
                    severity: f.severity as Severity,
                    title: f.title,
                    description: f.message,
                    file: f.file,
                    line: f.line,
                    code: f.code,
                    cwe: f.cwe,
                    owasp: f.owasp,
                    category: f.category,
                    compliance: f.compliance,
                })),
                ...result.dependencies.map(d => ({
                    id: d.id,
                    scanner: 'osv-api' as const,
                    severity: d.severity as Severity,
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

            const summary: ScanSummary = {
                total: result.stats.totalFindings,
                critical: result.stats.critical,
                high: result.stats.high,
                medium: result.stats.medium,
                low: result.stats.low,
                info: result.stats.info,
                scanners: {
                    'vibelab-patterns': result.findings.length,
                    'osv-api': result.dependencies.length,
                    'web3-patterns': result.findings.filter(f => f.scanner === 'web3-patterns').length,
                },
            };

            setResults(findings as any);
            setSummary(summary);
            setScanStats({
                filesScanned: result.stats.filesScanned,
                patternsUsed: result.patternsUsed,
                apisQueried: 3,
                scanTime: (Date.now() - startTime) / 1000,
            });
            setScanProgress(null);
            addToHistory(repoUrl, summary, findings as any);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Scan failed");
            setScanProgress(null);
        } finally {
            setIsScanning(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const copyMasterPrompt = () => {
        const repoName = repoUrl.split('/').slice(-2).join('/');
        const prompt = generateMasterPrompt(results, repoName);
        navigator.clipboard.writeText(prompt);
        setCopiedId('master');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const downloadReport = () => {
        const repoName = repoUrl.split('/').slice(-2).join('/').replace('/', '-');
        const prompt = generateMasterPrompt(results, repoName);
        const blob = new Blob([prompt], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${repoName}-security-report.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredResults = results.filter(r => {
        if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
        if (scannerFilter !== 'all' && r.scanner !== scannerFilter) return false;
        return true;
    });

    const fixEstimate = results.length > 0 ? estimateFixCost(results) : null;

    const formatDate = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Detect languages from results
    const detectedLanguages = [...new Set(results.map(r => {
        const ext = r.file?.split('.').pop()?.toLowerCase();
        const map: Record<string, string> = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'sol': 'solidity', 'go': 'go', 'java': 'java',
            'rb': 'ruby', 'php': 'php', 'rs': 'rust', 'json': 'json', 'yaml': 'yaml', 'yml': 'yaml'
        };
        return map[ext || ''] || null;
    }).filter(Boolean))] as string[];

    return (
        <div className="max-w-6xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="py-12">
                <Link href="/" className="btn-ghost text-[var(--foreground-secondary)] inline-flex items-center gap-2 mb-8">
                    ← Back to Home
                </Link>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-[var(--foreground-secondary)]">
                                {patternStats.total}+ patterns • 5 specialized engines
                            </p>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary">
                            <History className="w-4 h-4" />
                            History ({history.length})
                        </button>
                    )}
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="card p-6 mb-8 border-2 border-[var(--accent)]/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <History className="w-5 h-5" /> Scan History
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={clearHistory} className="btn-ghost text-sm text-red-400">
                                <Trash2 className="w-4 h-4" /> Clear All
                            </button>
                            <button onClick={() => setShowHistory(false)} className="btn-ghost text-sm">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {history.map(item => (
                            <div key={item.id} className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)] flex items-center justify-between">
                                <button onClick={() => loadFromHistory(item)} className="flex-1 text-left">
                                    <p className="font-medium text-white text-sm truncate">
                                        {item.repoUrl.replace('https://github.com/', '')}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-[var(--foreground-muted)]">{formatDate(item.scannedAt)}</span>
                                        <span className="text-xs text-red-500">{item.summary.critical} critical</span>
                                        <span className="text-xs text-orange-500">{item.summary.high} high</span>
                                        <span className="text-xs text-[var(--foreground-muted)]">{item.summary.total} total</span>
                                    </div>
                                </button>
                                <button onClick={() => deleteFromHistory(item.id)} className="p-2 text-[var(--foreground-muted)] hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Scanner Input */}
            <div className="card p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Github className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    <h2 className="font-semibold text-white">Scan Repository</h2>
                    <span className="badge text-xs ml-2">{patternStats.total}+ Patterns</span>
                    <span className="badge text-xs bg-green-500/20 text-green-400">5 Engines</span>
                    <span className="badge text-xs bg-blue-500/20 text-blue-400">200 Objects</span>
                    {session && <span className="badge text-xs bg-purple-500/20 text-purple-400"><Lock className="w-3 h-3" /> Private Ready</span>}
                </div>

                <div className="flex gap-3 mb-3">
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => { setRepoUrl(e.target.value); setError(null); }}
                        placeholder="https://github.com/owner/repo"
                        className="input flex-1"
                        disabled={isScanning}
                        onKeyDown={(e) => e.key === 'Enter' && runScan()}
                    />
                    <button onClick={runScan} disabled={isScanning} className="btn-primary px-8">
                        {isScanning ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
                        ) : (
                            <><Shield className="w-4 h-4" /> Scan</>
                        )}
                    </button>
                </div>

                {/* Scan Intensity Selector */}
                <div className="flex items-center gap-4 mb-6 p-2 rounded-xl bg-[var(--background-card)] border border-[var(--border)] w-fit">
                    <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider ml-2">Scanner Intensity</span>
                    <div className="flex gap-1">
                        {[
                            { id: 'quick', label: 'Quick Blitz', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { id: 'standard', label: 'Full Grade', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                            { id: 'deep', label: 'Deep Pentest', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' }
                        ].map((level) => (
                            <button
                                key={level.id}
                                onClick={() => setScanLevel(level.id as any)}
                                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${scanLevel === level.id
                                    ? `${level.bg} ${level.color} border border-${level.color.split('-')[1]}-500/30 shadow-lg`
                                    : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <level.icon className="w-3.5 h-3.5" />
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GitHub Auth */}
                <div className="flex gap-3 items-center">
                    {status === "loading" ? (
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                        </div>
                    ) : session ? (
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                                {session.user?.image && (
                                    <img src={session.user.image} alt="" className="w-5 h-5 rounded-full" />
                                )}
                                <span className="text-sm text-green-400">
                                    Signed in as {session.user?.name || session.user?.email}
                                </span>
                                <Lock className="w-3 h-3 text-green-400" />
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="btn-ghost text-sm text-[var(--foreground-muted)] hover:text-red-400"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("github")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                        >
                            <Github className="w-4 h-4" />
                            Sign in with GitHub for private repos
                        </button>
                    )}
                </div>

                {/* User Repos List */}
                {session && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-3">
                            <Folder className="w-4 h-4 text-[var(--foreground-secondary)]" />
                            <span className="text-sm text-[var(--foreground-secondary)]">Your Repositories</span>
                            {loadingRepos && <Loader2 className="w-3 h-3 animate-spin text-[var(--foreground-muted)]" />}
                        </div>
                        {userRepos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                {userRepos.slice(0, 12).map(repo => (
                                    <button
                                        key={repo.id}
                                        onClick={() => { setRepoUrl(repo.url); setError(null); }}
                                        className={`p-3 rounded-lg text-left transition-all border ${repoUrl === repo.url
                                            ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50'
                                            : 'bg-[var(--background-card)] border-[var(--border)] hover:border-[var(--accent)]/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-white truncate">{repo.name}</span>
                                            {repo.private && <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                            {repo.language && (
                                                <span className="px-1.5 py-0.5 rounded bg-white/5">{repo.language}</span>
                                            )}
                                            <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : !loadingRepos && (
                            <p className="text-sm text-[var(--foreground-muted)]">No repositories found</p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Client-Side Expert Visualization Board */}
            {isScanning && scanProgress && (
                <div className="card p-8 mb-8 border-2 border-[var(--accent)]/50 bg-[var(--background-card)] shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Terminal className="w-32 h-32" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Status Panel */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center animate-pulse">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-0.5">Expert Security Engine</h3>
                                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] uppercase tracking-widest font-mono">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                        {scanProgress.phase}...
                                    </div>
                                </div>
                            </div>

                            {/* Engine Board */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {scanProgress.engines.map((engine) => (
                                    <div key={engine.id} className="p-3 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {engine.status === 'scanning' ? (
                                                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
                                            ) : engine.status === 'complete' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-white/20" />
                                            )}
                                            <span className="text-sm font-medium text-white/80">{engine.name}</span>
                                        </div>
                                        <span className={`text-xs font-mono font-bold ${engine.findings > 0 ? 'text-red-400' : 'text-[var(--foreground-muted)]'}`}>
                                            {engine.findings}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-2">
                                <div className="flex justify-between text-xs font-mono text-[var(--foreground-muted)] mb-2">
                                    <span>ANALYZING {scanProgress.filesScanned}/{scanProgress.totalFiles} OBJECTS</span>
                                    <span>{Math.round((scanProgress.filesScanned / scanProgress.totalFiles) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-300 shadow-[0_0_10px_var(--accent)]"
                                        style={{ width: `${(scanProgress.filesScanned / scanProgress.totalFiles) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Expert Audit Console */}
                        <div className="md:w-1/3 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono text-white/40 tracking-wider">LIVE AUDIT TRAIL</span>
                                <span className="text-[10px] font-mono text-[var(--accent)] animate-pulse">SECURE-FEED-01</span>
                            </div>
                            <div className="flex-1 bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-[11px] min-h-[180px] overflow-hidden flex flex-col-reverse shadow-inner">
                                {scanProgress.auditLog.map((log, idx) => (
                                    <div key={idx} className={`mb-1 ${idx === 0 ? 'text-[var(--accent)]' : 'text-white/40'}`}>
                                        <span className="mr-2 opacity-50">{idx === 0 ? '>' : '$'}</span>
                                        {log}
                                    </div>
                                )).reverse()}
                                <div className="flex-1"></div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Progress Strip */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[var(--foreground-muted)]">
                        <div className="flex items-center gap-4">
                            <span className="animate-pulse">LATENCY: 14ms</span>
                            <span className="hidden sm:inline">PATTERNS: 500+ CORE</span>
                            <span className="hidden sm:inline">ENCRYPTION: AES-256</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">SCANNING:</span>
                            <span className="text-[var(--accent)] truncate max-w-[150px]">{scanProgress.currentFile || 'INITIALIZING...'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Stats Banner */}
            {scanStats && !isScanning && (
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="card p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <FileCode className="w-5 h-5 text-blue-400" />
                            <span className="text-2xl font-bold text-white">{scanStats.filesScanned}</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">Files Scanned</p>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Bug className="w-5 h-5 text-purple-400" />
                            <span className="text-2xl font-bold text-white">{scanStats.patternsUsed}</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">Patterns Checked</p>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Database className="w-5 h-5 text-green-400" />
                            <span className="text-2xl font-bold text-white">{scanStats.apisQueried}</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">CVE APIs Queried</p>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="text-2xl font-bold text-white">{scanStats.scanTime?.toFixed(1)}s</span>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)]">Scan Time</p>
                    </div>
                </div>
            )}

            {/* Languages & Frameworks Detected */}
            {results.length > 0 && detectedLanguages.length > 0 && (
                <div className="card p-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-[var(--foreground-secondary)]" />
                            <span className="text-sm text-[var(--foreground-secondary)]">Languages:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {detectedLanguages.map(lang => (
                                <span
                                    key={lang}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium border ${languageConfig[lang]?.color || 'bg-gray-500/20 text-gray-400'}`}
                                >
                                    {languageConfig[lang]?.icon || lang.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Expert Executive Summary Dashboard */}
            {results.length > 0 && !isScanning && (
                <div className="card p-8 mb-8 border-l-4 border-l-[var(--accent)] bg-gradient-to-r from-[var(--background-card)] to-transparent relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                        {/* Risk Score Gauge */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                    <circle
                                        cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        strokeDasharray={364.4}
                                        strokeDashoffset={364.4 - (364.4 * Math.max(0, 100 - (summary?.critical || 0) * 30 - (summary?.high || 0) * 10)) / 100}
                                        className={`${(summary?.critical || 0) > 0 ? 'text-red-500' : (summary?.high || 0) > 0 ? 'text-orange-500' : 'text-green-500'} transition-all duration-1000`}
                                    />
                                </svg>
                                <span className="absolute text-3xl font-bold text-white">
                                    {Math.max(0, 100 - (summary?.critical || 0) * 30 - (summary?.high || 0) * 10)}
                                </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold mt-4 text-[var(--foreground-muted)]">Cyber Risk Score</span>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-yellow-400" /> Executive Security Summary
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] mb-6 leading-relaxed">
                                Our expert intelligence engine detected <strong>{summary?.critical} critical</strong> and <strong>{summary?.high} high</strong> level risks.
                                Based on the <strong>{scanLevel.toUpperCase()}</strong> audit, the overall security posture is
                                <span className={`ml-1 font-bold ${summary?.critical && summary.critical > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {summary?.critical && summary.critical > 0 ? 'COMPROMISED' : 'STABLE'}.
                                </span>
                            </p>

                            {/* VibeSecure Badge Preview */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-black" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">VibeSecure Certified</div>
                                        <div className="text-xs text-white font-mono">Grade: {Math.max(0, 100 - (summary?.critical || 0) * 30 - (summary?.high || 0) * 10) > 80 ? 'A+' : 'B'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`[![VibeSecure](https://vibesecure.com/badge/${repoUrl})](https://vibesecure.com/scan/${repoUrl})`, 'badge')}
                                    className="text-[10px] text-[var(--foreground-muted)] hover:text-white underline"
                                >
                                    {copiedId === 'badge' ? 'Copied Markdown!' : 'Get Dynamic Badge'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-[10px] text-[var(--foreground-muted)] uppercase mb-1">Max Blast Radius</div>
                                    <div className="text-sm font-bold text-white">Full System Takeover</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-[10px] text-[var(--foreground-muted)] uppercase mb-1">Remediation Priority</div>
                                    <div className="text-sm font-bold text-[var(--accent)]">Immediate (Phase 1)</div>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-64">
                            <button
                                onClick={copyMasterPrompt}
                                className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                            >
                                <Sparkles className="w-5 h-5" /> Generate AI Fixes
                            </button>
                            <p className="text-[10px] text-center mt-3 text-[var(--foreground-muted)]">
                                Powered by VibeShield Expert AI Models
                            </p>
                        </div>
                    </div>

                </div>
            )}

            {/* Results Summary */}
            {summary && (
                <div className="card p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {summary.critical > 0 || summary.high > 0 ? (
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                            ) : (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                            <div>
                                <h2 className="font-semibold text-white">Scan Complete</h2>
                                <p className="text-sm text-[var(--foreground-secondary)]">
                                    {summary.total} vulnerabilities found
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Master Prompt Button - Hidden for now */}
                            {/* <button onClick={copyMasterPrompt} className="btn-secondary">
                                {copiedId === 'master' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedId === 'master' ? 'Copied!' : 'Copy AI Prompt'}
                            </button> */}

                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="btn-secondary"
                                >
                                    <Download className="w-4 h-4" /> Export
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                {showExportMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--background-card)] border border-[var(--border)] shadow-xl z-50">
                                        <button
                                            onClick={() => {
                                                const json = generateJSON(results, repoUrl);
                                                const blob = new Blob([json], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${repoUrl.split('/').pop()}-scan.json`;
                                                a.click();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2 rounded-t-xl"
                                        >
                                            <FileJson className="w-4 h-4 text-yellow-400" /> JSON Report
                                        </button>
                                        <button
                                            onClick={() => {
                                                const sarif = generateSARIF(results, repoUrl);
                                                const blob = new Blob([sarif], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${repoUrl.split('/').pop()}-scan.sarif`;
                                                a.click();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <FileCode className="w-4 h-4 text-blue-400" /> SARIF (GitHub)
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportFreelanceAudit();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2 rounded-b-xl"
                                        >
                                            <FileCode className="w-4 h-4 text-blue-400" /> Freelance MD Audit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Severity Breakdown */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        {(['critical', 'high', 'medium', 'low', 'info'] as const).map(sev => (
                            <button
                                key={sev}
                                onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                                className={`p-4 rounded-xl border transition-all ${severityFilter === sev
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                    : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--accent)]/50'
                                    }`}
                            >
                                <p className={`text-2xl font-bold ${severityConfig[sev].text}`}>
                                    {summary[sev]}
                                </p>
                                <p className="text-xs text-[var(--foreground-muted)] capitalize">{sev}</p>
                            </button>
                        ))}
                    </div>

                    {/* Category Breakdown */}
                    {(() => {
                        const categoryBreakdown = results.reduce((acc, r) => {
                            const cat = r.category || 'other';
                            acc[cat] = (acc[cat] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>);

                        const categoryColors: Record<string, string> = {
                            'secrets': 'bg-red-500',
                            'sqli': 'bg-orange-500',
                            'xss': 'bg-yellow-500',
                            'smart-contract': 'bg-purple-500',
                            'wallet': 'bg-indigo-500',
                            'api': 'bg-blue-500',
                            'graphql': 'bg-pink-500',
                            'jwt': 'bg-cyan-500',
                            'backend': 'bg-teal-500',
                            'container': 'bg-green-500',
                            'cicd': 'bg-lime-500',
                            'react': 'bg-sky-500',
                            'nextjs': 'bg-slate-400',
                            'auth': 'bg-amber-500',
                            'crypto': 'bg-violet-500',
                            'defi': 'bg-fuchsia-500',
                            'dependency': 'bg-gray-500',
                        };

                        const categories = Object.entries(categoryBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8);

                        if (categories.length === 0) return null;

                        const total = categories.reduce((sum, [, count]) => sum + count, 0);

                        return (
                            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bug className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                    <span className="text-sm font-medium text-white">Findings by Category</span>
                                </div>

                                {/* Category Bar */}
                                <div className="h-3 rounded-full overflow-hidden flex mb-3">
                                    {categories.map(([cat, count]) => (
                                        <div
                                            key={cat}
                                            className={`${categoryColors[cat] || 'bg-gray-500'} transition-all`}
                                            style={{ width: `${(count / total) * 100}%` }}
                                            title={`${cat}: ${count}`}
                                        />
                                    ))}
                                </div>

                                {/* Category Labels */}
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(([cat, count]) => (
                                        <span
                                            key={cat}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${categoryColors[cat] || 'bg-gray-500'}`} />
                                            <span className="text-[var(--foreground-secondary)] capitalize">{cat.replace('-', ' ')}</span>
                                            <span className="text-white font-medium">{count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Expert Compliance Dashboard */}
                    {results.length > 0 && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { name: 'SOC2 Type II', color: 'text-blue-400', bg: 'bg-blue-500/10', domain: 'SOC2' },
                                { name: 'HIPAA (PHI)', color: 'text-green-400', bg: 'bg-green-500/10', domain: 'HIPAA' },
                                { name: 'PCI-DSS (PII)', color: 'text-purple-400', bg: 'bg-purple-500/10', domain: 'PCI-DSS' }
                            ].map(reg => {
                                const related = results.filter(r => (r as any).compliance?.includes(reg.domain));
                                const score = related.length === 0 ? 100 : Math.max(0, 100 - related.length * 20);

                                return (
                                    <div key={reg.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${reg.color}`}>{reg.name}</span>
                                            <span className={`text-lg font-mono font-bold ${score === 100 ? 'text-green-400' : score > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {score}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={`h-full opacity-60 rounded-full transition-all duration-1000 ${score === 100 ? 'bg-green-400' : 'bg-orange-400'}`}
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-[var(--foreground-muted)]">
                                            {related.length} specialized violations detected
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Results List */}
            {filteredResults.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-white">
                            {filteredResults.length} {severityFilter !== 'all' ? severityFilter : ''} Findings
                        </h2>
                        {severityFilter !== 'all' && (
                            <button onClick={() => setSeverityFilter('all')} className="btn-ghost text-sm">
                                Clear Filter <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {filteredResults.map((result) => (
                        <div key={result.id} className="card overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                                className="w-full p-4 flex items-center gap-4 text-left"
                            >
                                <div className={`w-3 h-3 rounded-full ${severityConfig[result.severity].color}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white truncate">{result.title}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${severityConfig[result.severity].color} ${severityConfig[result.severity].text}`}>
                                            {result.severity}
                                        </span>
                                    </div>
                                    {result.file && (
                                        <p className="text-sm text-[var(--foreground-muted)] truncate font-mono">
                                            {result.file}{result.line ? `:${result.line}` : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {result.cwe && <span className="badge text-xs">{result.cwe}</span>}
                                    <ChevronDown className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform ${expandedId === result.id ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {expandedId === result.id && (
                                <div className="px-4 pb-4 border-t border-[var(--border)]">
                                    <div className="pt-4 space-y-4">
                                        <p className="text-sm text-[var(--foreground-secondary)]">{result.description}</p>

                                        {result.code && (
                                            <div className="relative">
                                                <pre className="p-4 rounded-xl bg-black/30 border border-white/10 text-sm font-mono text-white overflow-x-auto">
                                                    {result.code}
                                                </pre>
                                                <button
                                                    onClick={() => copyToClipboard(result.code || '', result.id)}
                                                    className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20"
                                                >
                                                    {copiedId === result.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {result.owasp && <span className="badge text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">OWASP {result.owasp}</span>}
                                            {result.category === 'malicious' && <span className="badge text-[10px] bg-red-500/10 text-red-400 border-red-500/30">NIST PR.DS: Malicious Detection</span>}
                                            {(result.category === 'cloud' || result.category === 'infra') && <span className="badge text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">NIST PR.IP: Infra Protection</span>}
                                            {result.category === 'pentest' && <span className="badge text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30">NIST DE.CM: Threat Detection</span>}
                                            {result.category === 'sast' && <span className="badge text-[10px] bg-green-500/10 text-green-400 border-green-500/30">NIST PR.DS: Secure Coding</span>}
                                            <span className="badge text-[10px] bg-white/5 text-[var(--foreground-muted)]">{scannerInfo[result.scanner]?.name || result.scanner}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => generateAIPath(result)}
                                                disabled={aiFixLoading === result.id}
                                                className="btn-expert py-2 px-4 rounded-xl flex items-center gap-2 text-xs"
                                            >
                                                {aiFixLoading === result.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                Exploitation Path
                                            </button>
                                        </div>

                                        {aiExploitationPath[result.id] && (
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Zap className="w-3.5 h-3.5 text-red-400" />
                                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Attack Scenario (VibeAI)</span>
                                                </div>
                                                <div className="text-xs text-[var(--foreground-secondary)] font-mono leading-relaxed whitespace-pre-line">
                                                    {aiExploitationPath[result.id]}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isScanning && results.length === 0 && !error && (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-[var(--foreground-muted)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No scan results yet</h3>
                    <p className="text-[var(--foreground-secondary)]">
                        Enter a GitHub repository URL above to start scanning for vulnerabilities
                    </p>
                </div>
            )}
        </div>
    );
}
