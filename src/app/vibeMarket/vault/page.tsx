"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Archive,
    Plus,
    Trash2,
    RefreshCw,
    Copy,
    Check,
    Sparkles
} from "lucide-react";

interface VaultItem {
    id: string;
    content: string;
    performance: "high" | "medium" | "low";
    lastUsed: string;
    tags: string[];
}

const refreshHooks = [
    "Here's a reminder that",
    "I keep coming back to this idea:",
    "Still thinking about",
    "One year later, this still holds:",
    "Reposting because it's important:"
];

export default function VaultPage() {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [newContent, setNewContent] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-vault");
        if (saved) {
            setItems(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("vibemarket-vault", JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!newContent.trim()) return;
        setItems([...items, {
            id: Date.now().toString(),
            content: newContent,
            performance: "medium",
            lastUsed: new Date().toISOString(),
            tags: []
        }]);
        setNewContent("");
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const refreshItem = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const hook = refreshHooks[Math.floor(Math.random() * refreshHooks.length)];
        const refreshed = `${hook}\n\n${item.content}`;
        navigator.clipboard.writeText(refreshed);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyItem = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <Archive className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Evergreen Vault</h1>
                        <p className="text-white/40 text-sm">Save and recycle your best-performing content</p>
                    </div>
                </div>
            </header>

            {/* Add New */}
            <section className="mb-12">
                <div className="vibe-glass rounded-3xl p-6 border border-white/5">
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Paste your best-performing tweet here..."
                        className="w-full bg-transparent border-none outline-none text-white resize-none min-h-[100px] placeholder:text-white/20 mb-4"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-white/20">Saved items persist in your browser</p>
                        <button
                            onClick={addItem}
                            disabled={!newContent.trim()}
                            className="px-6 py-3 rounded-xl bg-accent-primary/20 border border-accent-primary/30 text-accent-primary font-bold text-sm hover:bg-accent-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add to Vault
                        </button>
                    </div>
                </div>
            </section>

            {/* Vault Items */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Your Vault ({items.length})</h2>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 text-white/20">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Your vault is empty. Add your best tweets to recycle them later.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                                <p className="text-white/80 mb-4 whitespace-pre-wrap">{item.content}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/20">
                                        Added {new Date(item.lastUsed).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyItem(item.id, item.content)}
                                            className="px-3 py-1 rounded-lg bg-white/5 text-white/40 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-1"
                                        >
                                            {copied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied === item.id ? "Copied" : "Copy"}
                                        </button>
                                        <button
                                            onClick={() => refreshItem(item.id)}
                                            className="px-3 py-1 rounded-lg bg-accent-secondary/10 text-accent-secondary text-xs font-bold hover:bg-accent-secondary hover:text-white transition-all flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Refresh & Copy
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Tips */}
            <section className="mt-12 p-6 rounded-3xl bg-accent-primary/5 border border-accent-primary/10">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-accent-primary mb-1">Pro Tip</h3>
                        <p className="text-white/60 text-sm">Click "Refresh & Copy" to add a fresh hook to your evergreen content. This prevents your reposts from feeling repetitive.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
