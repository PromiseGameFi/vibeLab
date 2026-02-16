"use client";

import { useState } from "react";
import { FolderSearch, ShieldCheck, AlertTriangle, FileCode } from "lucide-react";

export default function VibeAuditPage() {
    const [path, setPath] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleScan = async () => {
        if (!path) return;
        setIsScanning(true);
        setReport(null);

        // Placeholder for Server Action
        // const result = await scancontracts(path);

        // Simulating delay for now
        setTimeout(() => {
            setReport("# Audit Report\n\n**Scanning Complete**\n\nNo vulnerabilities found in simulation.");
            setIsScanning(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <ShieldCheck className="w-10 h-10" />
                        <h1 className="text-4xl font-bold tracking-tight text-white">VibeAudit</h1>
                    </div>
                    <p className="text-xl text-neutral-400 max-w-2xl">
                        Defensive AI security scanner for your local smart contracts.
                        Detect reentrancy, overflow, and logic errors before deployment.
                    </p>
                </header>

                {/* Input Section */}
                <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-neutral-400 uppercase tracking-wider">
                            Target Directory
                        </label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <FolderSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                                <input
                                    type="text"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    placeholder="e.g. d:/Github/my-project/contracts"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={handleScan}
                                disabled={isScanning || !path}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center shadow-lg shadow-emerald-900/20"
                            >
                                {isScanning ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <FileCode className="w-5 h-5" />
                                        Start Audit
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500 pl-1">
                            * Scans local files. No data leaves your machine except to the AI provider.
                        </p>
                    </div>
                </section>

                {/* Results Section */}
                {report && (
                    <section className="animate-fade-in space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <h2 className="text-lg font-semibold">Audit Findings</h2>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 prose prose-invert max-w-none prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-300">
                                {report}
                            </pre>
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
