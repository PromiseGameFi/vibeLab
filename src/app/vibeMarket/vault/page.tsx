"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Plus, Trash2, RefreshCw, Copy, Check, Sparkles } from "lucide-react";

interface VaultItem {
    id: string;
    content: string;
    lastUsed: string;
}

const refreshHooks = [
    "Here's a reminder that",
    "I keep coming back to this:",
    "Still thinking about",
    "One year later, this holds:",
    "Reposting because it's important:"
];

export default function VaultPage() {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [newContent, setNewContent] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-vault");
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-vault", JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!newContent.trim()) return;
        setItems([...items, {
            id: Date.now().toString(),
            content: newContent,
            lastUsed: new Date().toISOString()
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
        navigator.clipboard.writeText(`${hook}\n\n${item.content}`);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyItem = (id: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Archive className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Evergreen Vault</h1>
                        <p className="text-[var(--foreground-secondary)]">Recycle your best content</p>
                    </div>
                </div>
            </header>

            {/* Add New */}
            <div className="card p-6 mb-10">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste your best-performing tweet here..."
                    className="input resize-none min-h-[100px] mb-4"
                />
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--foreground-muted)]">Saved to your browser</p>
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

            {/* Vault Items */}
            <section>
                <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                    Your Vault ({items.length})
                </h2>

                {items.length === 0 ? (
                    <div className="card p-12 text-center text-[var(--foreground-muted)]">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Your vault is empty</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="card p-5 group">
                                <p className="text-white mb-4 whitespace-pre-wrap">{item.content}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[var(--foreground-muted)]">
                                        Added {new Date(item.lastUsed).toLocaleDateString()}
                                    </span>
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
                        ))}
                    </div>
                )}
            </section>

            {/* Tip */}
            <div className="card p-5 mt-10 border-[var(--accent)]/30 bg-[var(--accent)]/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent)] mb-1">Pro Tip</h3>
                        <p className="text-[var(--foreground-secondary)] text-sm">
                            Click "Refresh" to add a fresh hook to your evergreen content.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
