"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Archive, Plus, Trash2, RefreshCw, Copy, Check,
    Sparkles, Flame, Zap, FileText, Filter, Search
} from "lucide-react";

interface VaultItem {
    id: string;
    content: string;
    lastUsed: string;
    useCount: number;
    performance: "high" | "medium" | "low";
}

const refreshHooks = [
    "Here's a reminder that",
    "I keep coming back to this:",
    "Still thinking about",
    "One year later, this holds:",
    "Reposting because it's important:",
    "This hit different back then:",
    "A thread worth revisiting:"
];

const performanceLabels = {
    high: { label: "High Performer", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    medium: { label: "Solid", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    low: { label: "Archive", icon: FileText, color: "text-[var(--foreground-muted)]", bg: "bg-[var(--background-card)]", border: "border-[var(--border)]" }
};

export default function VaultPage() {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [newContent, setNewContent] = useState("");
    const [newPerformance, setNewPerformance] = useState<"high" | "medium" | "low">("medium");
    const [copied, setCopied] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-vault-v2");
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-vault-v2", JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!newContent.trim()) return;
        setItems([...items, {
            id: Date.now().toString(),
            content: newContent,
            lastUsed: new Date().toISOString(),
            useCount: 0,
            performance: newPerformance
        }]);
        setNewContent("");
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updatePerformance = (id: string, performance: "high" | "medium" | "low") => {
        setItems(items.map(i => i.id === id ? { ...i, performance } : i));
    };

    const refreshItem = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const hook = refreshHooks[Math.floor(Math.random() * refreshHooks.length)];
        const refreshed = `${hook}\n\n${item.content}`;
        navigator.clipboard.writeText(refreshed);
        setItems(items.map(i => i.id === id ? { ...i, useCount: i.useCount + 1, lastUsed: new Date().toISOString() } : i));
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyItem = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setItems(items.map(i => i.id === id ? { ...i, useCount: i.useCount + 1, lastUsed: new Date().toISOString() } : i));
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const filteredItems = items
        .filter(item => filter === "all" || item.performance === filter)
        .filter(item => searchQuery === "" || item.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.performance] - order[b.performance];
        });

    const stats = {
        total: items.length,
        high: items.filter(i => i.performance === "high").length,
        medium: items.filter(i => i.performance === "medium").length,
        low: items.filter(i => i.performance === "low").length
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Archive className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Evergreen Vault</h1>
                        <p className="text-[var(--foreground-secondary)]">Save and recycle your best-performing content</p>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <p className="text-xs text-[var(--foreground-muted)]">Total</p>
                </div>
                <button
                    onClick={() => setFilter(filter === "high" ? "all" : "high")}
                    className={`card p-4 text-center transition-all ${filter === "high" ? 'border-orange-500/50' : ''}`}
                >
                    <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
                    <p className="text-xs text-[var(--foreground-muted)]">High</p>
                </button>
                <button
                    onClick={() => setFilter(filter === "medium" ? "all" : "medium")}
                    className={`card p-4 text-center transition-all ${filter === "medium" ? 'border-yellow-500/50' : ''}`}
                >
                    <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
                    <p className="text-xs text-[var(--foreground-muted)]">Solid</p>
                </button>
                <button
                    onClick={() => setFilter(filter === "low" ? "all" : "low")}
                    className={`card p-4 text-center transition-all ${filter === "low" ? 'border-[var(--border-hover)]' : ''}`}
                >
                    <div className="text-2xl font-bold text-[var(--foreground-muted)]">{stats.low}</div>
                    <p className="text-xs text-[var(--foreground-muted)]">Archive</p>
                </button>
            </div>

            {/* Add New */}
            <div className="card p-6 mb-8">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste your best-performing tweet here..."
                    className="input resize-none min-h-[100px] mb-4"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--foreground-muted)]">Performance:</span>
                        {(["high", "medium", "low"] as const).map(perf => {
                            const config = performanceLabels[perf];
                            const Icon = config.icon;
                            return (
                                <button
                                    key={perf}
                                    onClick={() => setNewPerformance(perf)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${newPerformance === perf
                                        ? `${config.bg} ${config.border} border ${config.color}`
                                        : 'bg-[var(--background-card)] text-[var(--foreground-muted)] border border-[var(--border)]'
                                        }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={addItem}
                        disabled={!newContent.trim()}
                        className="btn-primary disabled:opacity-40"
                    >
                        <Plus className="w-4 h-4" />
                        Add to Vault
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vault..."
                    className="input pl-10"
                />
            </div>

            {/* Vault Items */}
            <section>
                {filteredItems.length === 0 ? (
                    <div className="card p-12 text-center text-[var(--foreground-muted)]">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>{items.length === 0 ? "Your vault is empty" : "No items match your filter"}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredItems.map(item => {
                            const config = performanceLabels[item.performance];
                            const Icon = config.icon;
                            return (
                                <div key={item.id} className={`card p-5 group ${config.border} border`}>
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${config.bg} ${config.color}`}>
                                            <Icon className="w-3 h-3" />
                                            {config.label}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {(["high", "medium", "low"] as const).map(perf => (
                                                <button
                                                    key={perf}
                                                    onClick={() => updatePerformance(item.id, perf)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${item.performance === perf
                                                        ? performanceLabels[perf].bg
                                                        : 'hover:bg-[var(--background-card)]'
                                                        }`}
                                                >
                                                    {React.createElement(performanceLabels[perf].icon, {
                                                        className: `w-3 h-3 ${item.performance === perf ? performanceLabels[perf].color : 'text-[var(--foreground-muted)]'}`
                                                    })}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-white mb-4 whitespace-pre-wrap">{item.content}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                                            <span>Used {item.useCount}x</span>
                                            <span>Last: {new Date(item.lastUsed).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => copyItem(item.id, item.content)}
                                                className="badge hover:bg-white hover:text-black cursor-pointer"
                                            >
                                                {copied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => refreshItem(item.id)}
                                                className="badge hover:bg-[var(--accent-secondary)] hover:text-white hover:border-[var(--accent-secondary)] cursor-pointer"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Tip */}
            <div className="card p-5 mt-10 border-[var(--accent)]/30 bg-[var(--accent)]/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent)] mb-1">Pro Tips</h3>
                        <ul className="text-[var(--foreground-secondary)] text-sm space-y-1">
                            <li>• Tag high performers to prioritize them in recycling</li>
                            <li>• "Refresh" adds a new hook to make content feel fresh</li>
                            <li>• Usage stats help you identify your best evergreens</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
