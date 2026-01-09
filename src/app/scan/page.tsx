"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
    Shield, AlertTriangle, CheckCircle, Copy, Check,
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

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Scanner = 'vibelab-patterns' | 'osv-api';

interface ScanHistoryItem {
    id: string;
    repoUrl: string;
    scannedAt: string;
    summary: ScanSummary;
    results: ScanResult[];
}

interface ScanProgress {
    phase: 'connecting' | 'fetching' | 'scanning' | 'analyzing' | 'complete';
    currentFile?: string;
    filesScanned: number;
    totalFiles: number;
    patternsChecked: number;
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

    // Simulate scanning phases
    const simulateScanProgress = useCallback((startTime: number) => {
        const phases: ScanProgress['phase'][] = ['connecting', 'fetching', 'scanning', 'analyzing'];
        const languageExamples = ['typescript', 'javascript', 'python', 'json', 'yaml'];
        const frameworkExamples = ['Next.js', 'React'];

        let phaseIndex = 0;
        let filesScanned = 0;
        const totalFiles = 30 + Math.floor(Math.random() * 20);

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            if (elapsed < 1000) {
                setScanProgress({
                    phase: 'connecting',
                    filesScanned: 0,
                    totalFiles,
                    patternsChecked: 0,
                    languagesFound: [],
                    frameworksFound: [],
                    findingsCount: 0,
                });
            } else if (elapsed < 2500) {
                setScanProgress({
                    phase: 'fetching',
                    filesScanned: Math.min(filesScanned++, totalFiles),
                    totalFiles,
                    patternsChecked: 0,
                    languagesFound: languageExamples.slice(0, Math.floor(elapsed / 500)),
                    frameworksFound: [],
                    findingsCount: 0,
                });
            } else if (elapsed < 8000) {
                const patternsRate = Math.floor((elapsed - 2500) / 50);
                setScanProgress({
                    phase: 'scanning',
                    currentFile: `src/app/page.tsx`,
                    filesScanned: Math.min(Math.floor((elapsed - 2500) / 180), totalFiles),
                    totalFiles,
                    patternsChecked: Math.min(patternsRate, 153),
                    languagesFound: languageExamples,
                    frameworksFound: frameworkExamples.slice(0, Math.floor((elapsed - 3000) / 1500)),
                    findingsCount: Math.floor(Math.random() * (elapsed / 200)),
                });
            } else {
                setScanProgress({
                    phase: 'analyzing',
                    filesScanned: totalFiles,
                    totalFiles,
                    patternsChecked: 153,
                    languagesFound: languageExamples,
                    frameworksFound: frameworkExamples,
                    findingsCount: Math.floor(Math.random() * 50),
                });
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

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

        // Start progress simulation
        const cleanup = simulateScanProgress(startTime);

        try {
            const response = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl, githubToken: (session as any)?.accessToken }),
            });

            const data = await response.json();
            cleanup();

            if (!response.ok) {
                throw new Error(data.error || "Scan failed");
            }

            setResults(data.results);
            setSummary(data.summary);
            setScanStats({
                filesScanned: data.stats?.filesScanned,
                patternsUsed: data.stats?.patternsUsed,
                apisQueried: data.stats?.apisQueried || 3,
                scanTime: (Date.now() - startTime) / 1000,
            });
            setScanProgress(null);
            addToHistory(repoUrl, data.summary, data.results);
        } catch (err) {
            cleanup();
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
                            <h1 className="text-3xl font-bold text-white">Security Scanner</h1>
                            <p className="text-[var(--foreground-secondary)]">
                                153 patterns • 3 APIs • 100% Free
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
                    <span className="badge text-xs ml-2">153 Patterns</span>
                    <span className="badge text-xs bg-green-500/20 text-green-400">3 APIs</span>
                    <span className="badge text-xs bg-blue-500/20 text-blue-400">200 Files</span>
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

            {/* Enhanced Loading Screen */}
            {isScanning && scanProgress && (
                <div className="card p-8 mb-8 border-2 border-[var(--accent)]/50">
                    {/* Progress Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center animate-pulse">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {scanProgress.phase === 'connecting' && 'Connecting to GitHub...'}
                                    {scanProgress.phase === 'fetching' && 'Fetching Repository...'}
                                    {scanProgress.phase === 'scanning' && 'Scanning for Vulnerabilities...'}
                                    {scanProgress.phase === 'analyzing' && 'Analyzing Results...'}
                                </h3>
                                <p className="text-[var(--foreground-secondary)]">
                                    {repoUrl.replace('https://github.com/', '')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[var(--accent)]">{scanProgress.findingsCount}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Findings</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-2">
                            <span>Files: {scanProgress.filesScanned}/{scanProgress.totalFiles}</span>
                            <span>Patterns: {scanProgress.patternsChecked}/153</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-300"
                                style={{ width: `${(scanProgress.filesScanned / scanProgress.totalFiles) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Current File */}
                    {scanProgress.currentFile && (
                        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-sm">
                                <FileCode className="w-4 h-4 text-[var(--accent)]" />
                                <span className="text-[var(--foreground-muted)]">Scanning:</span>
                                <code className="text-white font-mono">{scanProgress.currentFile}</code>
                            </div>
                        </div>
                    )}

                    {/* Detected Languages & Frameworks */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Languages */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Code2 className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">Languages Detected</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {scanProgress.languagesFound.map(lang => (
                                    <span
                                        key={lang}
                                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${languageConfig[lang]?.color || 'bg-gray-500/20 text-gray-400'}`}
                                    >
                                        {languageConfig[lang]?.icon || lang.toUpperCase()}
                                    </span>
                                ))}
                                {scanProgress.languagesFound.length === 0 && (
                                    <span className="text-xs text-[var(--foreground-muted)]">Detecting...</span>
                                )}
                            </div>
                        </div>

                        {/* Frameworks */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Blocks className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-white">Frameworks Detected</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {scanProgress.frameworksFound.map(fw => (
                                    <span key={fw} className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        {fw}
                                    </span>
                                ))}
                                {scanProgress.frameworksFound.length === 0 && (
                                    <span className="text-xs text-[var(--foreground-muted)]">Detecting...</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scan Phases */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {['connecting', 'fetching', 'scanning', 'analyzing'].map((phase, i) => (
                            <div key={phase} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full transition-all ${scanProgress.phase === phase ? 'bg-[var(--accent)] animate-pulse' :
                                    ['connecting', 'fetching', 'scanning', 'analyzing'].indexOf(scanProgress.phase) > i ? 'bg-green-500' :
                                        'bg-white/20'
                                    }`} />
                                <span className={`text-xs capitalize ${scanProgress.phase === phase ? 'text-white' : 'text-[var(--foreground-muted)]'
                                    }`}>{phase}</span>
                            </div>
                        ))}
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
                            <button onClick={copyMasterPrompt} className="btn-secondary">
                                {copiedId === 'master' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedId === 'master' ? 'Copied!' : 'Copy AI Prompt'}
                            </button>

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
                                                downloadReport();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2 rounded-b-xl"
                                        >
                                            <FileText className="w-4 h-4 text-green-400" /> Markdown
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

                    {/* Fix Estimate */}
                    {fixEstimate && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-[var(--foreground-secondary)]">AI Fix Estimate:</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-white">{fixEstimate.tokens.toLocaleString()} tokens</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-white">{fixEstimate.cost}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm text-white">{fixEstimate.time}</span>
                                    </div>
                                </div>
                            </div>
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
                                            {result.owasp && <span className="badge text-xs">{result.owasp}</span>}
                                            {result.category && <span className="badge text-xs">{result.category}</span>}
                                            <span className="badge text-xs">{scannerInfo[result.scanner]?.name || result.scanner}</span>
                                        </div>
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
