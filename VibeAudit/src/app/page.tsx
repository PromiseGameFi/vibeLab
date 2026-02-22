"use client";
import React, { useState, useEffect } from "react";
import { Play, Square, Activity, ShieldAlert, Crosshair, Terminal, Zap, FileCode2 } from "lucide-react";
import { motion } from "framer-motion";

export default function VibeAuditDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ linesScanned: 0, riskScore: 0 });
  const [findings, setFindings] = useState<any[]>([]);

  // Stream parsing logic
  useEffect(() => {
    if (!isRunning) return;

    setLogs([]);
    setStats({ linesScanned: 0, riskScore: 0 });
    setFindings([]);

    const abortController = new AbortController();

    const startAudit = async () => {
      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "0x123", network: "Ethereum", intensity: "Balanced" }),
          signal: abortController.signal
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunkRemainder = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (chunkRemainder + chunk).split("\n\n");

          chunkRemainder = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.message) {
                  setLogs((prev) => [...prev, parsed.message]);
                } else if (parsed.action === "updateStats") {
                  setStats((prev) => ({ ...prev, ...parsed.data }));
                } else if (parsed.action === "addFinding") {
                  setFindings((prev) => [...prev, parsed.data]);
                } else if (parsed.action === "done") {
                  setIsRunning(false);
                }
              } catch (e) {
                console.error("Parse error", e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Stream error", err);
          setIsRunning(false);
        }
      }
    };

    startAudit();

    return () => abortController.abort();
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-vibe-primary/30">

      {/* Top Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-vibe-primary to-vibe-secondary flex items-center justify-center shadow-lg shadow-vibe-primary/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              VibeAudit
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-vibe-accent/10 text-vibe-accent border border-vibe-accent/20">
              Agent: Online
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${isRunning
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                : "bg-vibe-primary text-white hover:bg-vibe-primary/90 shadow-lg shadow-vibe-primary/20"
                }`}
            >
              {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              <span>{isRunning ? "Halt Campaign" : "Launch Audit"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

        {/* Left Column: Settings & Stats */}
        <div className="lg:col-span-4 space-y-6">

          {/* Campaign Settings */}
          <section className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
              <Crosshair className="w-4 h-4 mr-2 text-vibe-primary" />
              Target Scope
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contract Address</label>
                <input
                  type="text"
                  defaultValue="0x1234...5678"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary/50 transition-all text-gray-300 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Network</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-vibe-primary transition-all text-gray-300">
                    <option>Ethereum</option>
                    <option>Arbitrum</option>
                    <option>Somnia</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Intensity</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-vibe-primary transition-all text-gray-300">
                    <option>Balanced</option>
                    <option>Aggressive</option>
                    <option>Deep Scan</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Realtime Stats */}
          <section className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-vibe-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <FileCode2 className="w-5 h-5 text-vibe-primary mb-2" />
              <div className="text-2xl font-bold">{stats.linesScanned.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Lines Scanned</div>
            </div>
            <div className="glass-panel p-4 flex flex-col justify-center relative overflow-hidden group border-vibe-danger/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-vibe-danger/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <ShieldAlert className="w-5 h-5 text-vibe-danger mb-2" />
              <div className="text-2xl font-bold text-white">
                {findings.filter(f => f.severity === "High").length}
              </div>
              <div className="text-xs text-vibe-danger">Critical Findings</div>
            </div>
            <div className="glass-panel p-4 flex flex-col justify-center col-span-2 relative overflow-hidden">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <Activity className="w-5 h-5 text-vibe-secondary mb-2" />
                  <div className="text-xs text-gray-400">Current Risk Score</div>
                </div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  {stats.riskScore}/100
                </div>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-vibe-accent via-yellow-500 to-red-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${stats.riskScore}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Execution Stream & Findings */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">

          {/* Execution Stream Map */}
          <section className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[400px] border-border/50">
            <div className="bg-card/80 border-b border-border/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-200">Execution Stream</h2>
              </div>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              </div>
            </div>

            <div className="flex-1 bg-[#0a0a0a] p-4 font-mono text-xs overflow-y-auto space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic flex items-center h-full justify-center">
                  Agent is idle. Ready to launch audit.
                </div>
              ) : (
                logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
              ${log.includes("[CRITICAL]") || log.includes("[ALERT]") ? "text-red-400" : ""}
              ${log.includes("[WARN]") ? "text-yellow-400" : ""}
              ${log.includes("[AI]") ? "text-vibe-secondary font-medium tracking-wide" : ""}
              ${log.includes("[VALIDATE]") ? "text-vibe-primary" : ""}
              ${log.includes("[INFO]") || log.includes("[RECON]") || log.includes("[MAPPING]") ? "text-gray-400" : ""}
                    `}
                  >
                    {log}
                  </motion.div>
                ))
              )}
              {isRunning && (
                <div className="text-gray-500 animate-pulse mt-2">_</div>
              )}
            </div>
          </section>

          {/* Validated Findings Table */}
          <section className="glass-panel p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center bg-card/40">
              <h2 className="text-sm font-semibold text-gray-200">Validated Findings</h2>
              <span className="text-xs text-gray-500">Auto-updated by validation engine</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 bg-background/50 border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Vulnerability</th>
                    <th className="px-5 py-3 font-medium">Location</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {findings.length > 0 ? (
                    findings.map((finding, idx) => (
                      <tr key={idx} className="bg-red-500/5 hover:bg-red-500/10 transition-colors">
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold border border-red-500/20">
                            {finding.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-200 font-medium">{finding.vulnerability}</td>
                        <td className="px-5 py-3 text-gray-400 font-mono text-xs">{finding.location}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center text-vibe-accent text-xs">
                            <ShieldAlert className="w-3 h-3 mr-1" /> {finding.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-xs italic">
                        No validated findings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main >
    </div >
  );
}
