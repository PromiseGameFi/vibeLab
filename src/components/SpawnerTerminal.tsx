"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

interface SpawnerTerminalProps {
    onSpawn: (intent: string) => void;
}

export default function SpawnerTerminal({ onSpawn }: SpawnerTerminalProps) {
    const [input, setInput] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [isSpawning, setIsSpawning] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs((prev) => [...prev, msg]);
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
        addLog("Initializing Vibe Scouter...");

        const steps = [
            "Analyzing project intent...",
            "Mapping tool dependencies...",
            "Fetching community blueprints...",
            "Stack ready."
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
            addLog(step);
        }

        onSpawn(input);
        setIsSpawning(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27ca40]"></div>
                    </div>
                    <span className="text-xs text-[var(--foreground-muted)] ml-2">Vibe Spawner</span>
                </div>

                {/* Body */}
                <div
                    ref={scrollRef}
                    className="h-32 overflow-y-auto p-4 font-mono text-sm space-y-1"
                >
                    {logs.length === 0 && !input && (
                        <div className="text-[var(--foreground-muted)]">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                Describe your project to generate a blueprint...
                            </span>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={`
                            ${log.includes("ready") ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground-secondary)]"}
                        `}>
                            → {log}
                        </div>
                    ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)] flex gap-3">
                    <input
                        autoFocus
                        type="text"
                        disabled={isSpawning}
                        placeholder="Build a cinematic 3D game ad..."
                        className="input flex-1"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isSpawning || !input.trim()}
                        className="btn-primary disabled:opacity-40"
                    >
                        <Zap className="w-4 h-4" />
                        Spawn
                    </button>
                </form>
            </div>

            {/* Feature Pills */}
            <div className="flex justify-center gap-4 mt-6">
                <span className="badge">
                    <Zap className="w-3 h-3" />
                    Instant Blueprinting
                </span>
                <span className="badge">
                    Multi-Model Support
                </span>
            </div>
        </div>
    );
}
