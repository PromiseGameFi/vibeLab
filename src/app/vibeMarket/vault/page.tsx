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

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-vault");
        if (saved) {
            setItems(JSON.parse(saved));
        }
    }, []);

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
            <div className="flex items-center justify-between mb-10">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center">
                        <Archive className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Evergreen Vault</h1>
                        <p className="text-[var(--foreground-secondary)] text-sm">Save and recycle your best-performing content</p>
                    </div>
                </div>
            </header>

            {/* Add New */}
            <section className="mb-10">
                <div className="vibe-card p-5">
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Paste your best-performing tweet here..."
                        className="vibe-input w-full resize-none min-h-[100px] mb-4"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--foreground-secondary)]">Saved items persist in your browser</p>
                        <button
                            onClick={addItem}
                            disabled={!newContent.trim()}
                            className="vibe-btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Add to Vault
                        </button>
                    </div>
                </div>
            </section>

            {/* Vault Items */}
            <section>
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Your Vault ({items.length})</h2>

                {items.length === 0 ? (
                    <div className="text-center py-16 text-[var(--foreground-secondary)]">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Your vault is empty. Add your best tweets to recycle them later.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="vibe-card p-5 group">
                                <p className="text-[var(--foreground)] mb-4 whitespace-pre-wrap">{item.content}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[var(--foreground-secondary)]">
                                        Added {new Date(item.lastUsed).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyItem(item.id, item.content)}
                                            className="vibe-badge hover:bg-[var(--foreground)] hover:text-[var(--background)] cursor-pointer flex items-center gap-1"
                                        >
                                            {copied === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied === item.id ? "Copied" : "Copy"}
                                        </button>
                                        <button
                                            onClick={() => refreshItem(item.id)}
                                            className="vibe-badge hover:bg-[var(--accent-secondary)] hover:text-white hover:border-[var(--accent-secondary)] cursor-pointer flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Refresh & Copy
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 rounded-lg text-[var(--foreground-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
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
            <section className="mt-10 p-5 rounded-xl bg-[var(--accent-primary)] bg-opacity-5 border border-[var(--accent-primary)] border-opacity-20">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent-primary)] mb-1">Pro Tip</h3>
                        <p className="text-[var(--foreground-secondary)] text-sm">Click "Refresh & Copy" to add a fresh hook to your evergreen content. This prevents your reposts from feeling repetitive.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
