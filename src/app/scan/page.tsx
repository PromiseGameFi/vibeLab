"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Shield, Search, AlertTriangle, CheckCircle, Copy, Check,
    Download, ExternalLink, Filter, Loader2, Github, ChevronDown,
    ChevronRight, FileCode, Lock, Package, Clock, DollarSign
} from "lucide-react";
import {
    ScanResult, ScanSummary, severityConfig, scannerInfo,
    generateMasterPrompt, estimateFixCost
} from "@/lib/scanData";

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Scanner = 'semgrep' | 'trivy' | 'gitleaks' | 'npm-audit';

export default function ScanPage() {
    const [repoUrl, setRepoUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState("");
    const [results, setResults] = useState<ScanResult[]>([]);
    const [summary, setSummary] = useState<ScanSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
    const [scannerFilter, setScannerFilter] = useState<Scanner | 'all'>('all');

    const runScan = async () => {
        if (!repoUrl.trim()) {
            setError("Please enter a GitHub repository URL");
            return;
        }

        setIsScanning(true);
        setError(null);
        setResults([]);
        setSummary(null);
        setScanStatus("Cloning repository...");

        try {
            const response = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Scan failed");
            }

            setResults(data.results);
            setSummary(data.summary);
            setScanStatus("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Scan failed");
            setScanStatus("");
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

    return (
        <div className="max-w-6xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="py-12">
                <Link href="/" className="btn-ghost text-[var(--foreground-secondary)] inline-flex items-center gap-2 mb-8">
                    ← Back to Home
                </Link>

                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Security Scanner</h1>
                        <p className="text-[var(--foreground-secondary)]">
                            Analyze repositories for vulnerabilities with AI-ready fix prompts
                        </p>
                    </div>
                </div>
            </div>

            {/* Scanner Input */}
            <div className="card p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Github className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    <h2 className="font-semibold text-white">Scan Repository</h2>
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => { setRepoUrl(e.target.value); setError(null); }}
                        placeholder="https://github.com/owner/repo"
                        className="input flex-1"
                        disabled={isScanning}
                    />
                    <button
                        onClick={runScan}
                        disabled={isScanning || !repoUrl.trim()}
                        className="btn-primary disabled:opacity-50"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Scan
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {isScanning && scanStatus && (
                    <div className="mt-4 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {scanStatus}
                    </div>
                )}

                {/* Scanner Info */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(scannerInfo).map(([key, info]) => (
                        <div key={key} className="p-3 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                            <div className="text-lg mb-1">{info.icon}</div>
                            <p className="text-sm font-medium text-white">{info.name}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">{info.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Results */}
            {summary && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="card p-4 text-center">
                            <p className="text-3xl font-bold text-white">{summary.total}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Total Issues</p>
                        </div>
                        <div className="card p-4 text-center border-red-500/30">
                            <p className="text-3xl font-bold text-red-500">{summary.critical}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Critical</p>
                        </div>
                        <div className="card p-4 text-center border-orange-500/30">
                            <p className="text-3xl font-bold text-orange-500">{summary.high}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">High</p>
                        </div>
                        <div className="card p-4 text-center border-yellow-500/30">
                            <p className="text-3xl font-bold text-yellow-500">{summary.medium}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Medium</p>
                        </div>
                        <div className="card p-4 text-center border-blue-500/30">
                            <p className="text-3xl font-bold text-blue-500">{summary.low}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Low</p>
                        </div>
                        <div className="card p-4 text-center">
                            <p className="text-3xl font-bold text-gray-500">{summary.info}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Info</p>
                        </div>
                    </div>

                    {/* Fix Estimate & Actions */}
                    <div className="card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            {fixEstimate && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-[var(--foreground-secondary)]">
                                            Est. fix cost: <strong className="text-white">{fixEstimate.cost}</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[var(--accent)]" />
                                        <span className="text-sm text-[var(--foreground-secondary)]">
                                            Est. time: <strong className="text-white">{fixEstimate.time}</strong>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={copyMasterPrompt} className="btn-secondary">
                                {copiedId === 'master' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedId === 'master' ? 'Copied!' : 'Copy Master Prompt'}
                            </button>
                            <button onClick={downloadReport} className="btn-primary">
                                <Download className="w-4 h-4" />
                                Download Report
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
                            <span className="text-sm text-[var(--foreground-muted)]">Filter:</span>
                        </div>

                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                            className="input py-2 px-3 text-sm"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">🔴 Critical</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🔵 Low</option>
                            <option value="info">⚪ Info</option>
                        </select>

                        <select
                            value={scannerFilter}
                            onChange={(e) => setScannerFilter(e.target.value as Scanner | 'all')}
                            className="input py-2 px-3 text-sm"
                        >
                            <option value="all">All Scanners</option>
                            <option value="semgrep">🔍 Semgrep</option>
                            <option value="trivy">📦 Trivy</option>
                            <option value="gitleaks">🔐 Gitleaks</option>
                            <option value="npm-audit">📋 npm audit</option>
                        </select>

                        <span className="text-sm text-[var(--foreground-muted)]">
                            Showing {filteredResults.length} of {results.length}
                        </span>
                    </div>

                    {/* Findings List */}
                    <div className="space-y-3">
                        {filteredResults.length === 0 ? (
                            <div className="card p-12 text-center">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                <p className="text-lg font-semibold text-white mb-2">No Issues Found!</p>
                                <p className="text-[var(--foreground-secondary)]">
                                    {results.length === 0
                                        ? "Your repository passed all security checks."
                                        : "No issues match the current filters."}
                                </p>
                            </div>
                        ) : (
                            filteredResults.map((result) => {
                                const severity = severityConfig[result.severity];
                                const scanner = scannerInfo[result.scanner];
                                const isExpanded = expandedId === result.id;

                                return (
                                    <div
                                        key={result.id}
                                        className={`card border-l-4 ${severity.color.replace('bg-', 'border-')}`}
                                    >
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : result.id)}
                                            className="w-full p-4 flex items-start gap-4 text-left"
                                        >
                                            <div className={`w-8 h-8 rounded-lg ${severity.color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-sm">{severity.icon}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-medium ${severity.text}`}>
                                                        {severity.label}
                                                    </span>
                                                    <span className="text-xs text-[var(--foreground-muted)]">•</span>
                                                    <span className="text-xs text-[var(--foreground-muted)]">
                                                        {scanner.icon} {scanner.name}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-white truncate">{result.title}</h3>
                                                {result.file && (
                                                    <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-1 mt-1">
                                                        <FileCode className="w-3 h-3" />
                                                        {result.file}{result.line ? `:${result.line}` : ''}
                                                    </p>
                                                )}
                                            </div>

                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
                                                <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                                                    {result.description}
                                                </p>

                                                {result.code && (
                                                    <div className="mb-4">
                                                        <p className="text-xs text-[var(--foreground-muted)] mb-2">Vulnerable Code:</p>
                                                        <pre className="p-3 rounded-lg bg-black/50 text-xs text-red-400 font-mono overflow-x-auto">
                                                            {result.code}
                                                        </pre>
                                                    </div>
                                                )}

                                                {(result.cwe || result.owasp) && (
                                                    <div className="flex gap-2 mb-4">
                                                        {result.cwe && (
                                                            <span className="badge text-xs">{result.cwe}</span>
                                                        )}
                                                        {result.owasp && (
                                                            <span className="badge text-xs">{result.owasp}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {result.fix && (
                                                    <p className="text-sm text-green-400 mb-4">
                                                        💡 Fix: {result.fix}
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() => copyToClipboard(result.fixPrompt || '', result.id)}
                                                    className="btn-secondary text-sm"
                                                >
                                                    {copiedId === result.id ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4" />
                                                            Copy Fix Prompt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* Empty State */}
            {!isScanning && !summary && !error && (
                <div className="card p-12 text-center">
                    <Shield className="w-16 h-16 mx-auto mb-6 text-[var(--foreground-muted)]" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Scan a GitHub Repository
                    </h2>
                    <p className="text-[var(--foreground-secondary)] max-w-md mx-auto mb-6">
                        Enter a public GitHub repository URL to analyze it for security vulnerabilities.
                        Get AI-ready fix prompts for every issue found.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Semgrep SAST', 'Trivy Deps', 'Gitleaks Secrets', 'npm audit'].map(s => (
                            <span key={s} className="badge">{s}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
