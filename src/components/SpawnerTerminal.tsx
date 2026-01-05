"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Sparkles, ChevronRight, Binary, Zap, Cpu } from "lucide-react";

interface SpawnerTerminalProps {
    onSpawn: (intent: string) => void;
}

export default function SpawnerTerminal({ onSpawn }: SpawnerTerminalProps) {
    const [input, setInput] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [isSpawning, setIsSpawning] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs((prev) => [...prev, `> ${msg}`]);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSpawning) return;

        setIsSpawning(true);
        setLogs([]);
        addLog(`Initializing Vibe Scouter...`);

        // Simulations
        const steps = [
            "Analyzing project intent...",
            "Mapping tool dependencies...",
            "Calculating optimal P-parameters...",
            "Fetching community blueprints...",
            "Optimizing synergy coefficients...",
            "STACK READY TO SPAWN."
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
            addLog(step);
        }

        onSpawn(input);
        setIsSpawning(false);
    };

    return (
        <div className="w-full max-w-3xl mx-auto relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>

            <div className="relative vibe-glass rounded-2xl border border-white/10 overflow-hidden bg-black/60 shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                        <Binary className="w-3 h-3" />
                        Vibe Spawner v2.0
                    </div>
                    <div className="w-12"></div>
                </div>

                {/* Terminal Body */}
                <div
                    ref={scrollRef}
                    className="h-48 overflow-y-auto px-6 py-4 font-mono text-sm space-y-1.5 scrollbar-hide"
                >
                    {logs.length === 0 && !input && (
                        <div className="text-white/20 flex flex-col gap-2 pt-2">
                            <p className="flex items-center gap-2 italic">
                                <Sparkles className="w-3 h-3" />
                                Input your high-level goal to spawn a custom AI tool stack...
                            </p>
                            <p className="text-[10px] opacity-50">e.g. "Build a cinematic 3D game ad with voiceover" or "Rapidly prototype a React web app with deep auth"</p>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={`
              ${log.includes("INITIALIZING") ? "text-accent-primary font-bold" : ""}
              ${log.includes("STACK READY") ? "text-accent-secondary font-black scale-105" : "text-white/40"}
              transition-all duration-300
            `}>
                            {log}
                        </div>
                    ))}
                </div>

                {/* Console Input */}
                <form onSubmit={handleSubmit} className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-4">
                    <ChevronRight className={`w-5 h-5 ${isSpawning ? "text-white/10 animate-pulse" : "text-accent-primary"}`} />
                    <input
                        autoFocus
                        type="text"
                        disabled={isSpawning}
                        placeholder={isSpawning ? "Processing intentions..." : "EXECUTE INTENT_"}
                        className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-white/10 disabled:opacity-50"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isSpawning || !input.trim()}
                        className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-white transition-all disabled:opacity-0"
                    >
                        <Zap className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Decorative Badges */}
            <div className="flex justify-center gap-8 mt-6 overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/10 uppercase tracking-widest whitespace-nowrap">
                    <Cpu className="w-3 h-3" />
                    Multi-Model Agnostic
                </div>
                <div className="h-4 w-[1px] bg-white/5"></div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/10 uppercase tracking-widest whitespace-nowrap">
                    <Zap className="w-3 h-3" />
                    Instant Blueprinting
                </div>
            </div>
        </div>
    );
}
