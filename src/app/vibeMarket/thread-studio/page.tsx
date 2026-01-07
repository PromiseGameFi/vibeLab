"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Sparkles,
    Copy,
    Plus,
    Trash2,
    Wand2,
    MessageSquare,
    Check
} from "lucide-react";

interface Thread {
    id: string;
    content: string;
}

const hookTemplates = [
    "I spent 100 hours learning [topic]. Here's what I wish I knew from the start:",
    "The harsh truth about [topic] nobody tells you:",
    "Stop doing [common mistake]. Here's what actually works:",
    "I analyzed 1,000 [things]. Here's what separates winners from losers:",
    "The [number] rules of [topic] I learned the hard way:"
];

export default function ThreadStudioPage() {
    const [threads, setThreads] = useState<Thread[]>([
        { id: "1", content: "" }
    ]);
    const [copied, setCopied] = useState(false);

    const addThread = () => {
        setThreads([...threads, { id: Date.now().toString(), content: "" }]);
    };

    const removeThread = (id: string) => {
        if (threads.length > 1) {
            setThreads(threads.filter(t => t.id !== id));
        }
    };

    const updateThread = (id: string, content: string) => {
        setThreads(threads.map(t => t.id === id ? { ...t, content } : t));
    };

    const applyHook = (template: string) => {
        if (threads.length > 0) {
            updateThread(threads[0].id, template);
        }
    };

    const copyAllThreads = () => {
        const fullThread = threads.map((t, i) => `${i + 1}/ ${t.content}`).join("\n\n");
        navigator.clipboard.writeText(fullThread);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateCliffhanger = (index: number) => {
        const cliffhangers = [
            "But here's where it gets interesting...",
            "And that's just the beginning.",
            "The next part changed everything for me.",
            "Wait until you see what comes next.",
            "This is where most people give up. Don't."
        ];
        const randomCliffhanger = cliffhangers[Math.floor(Math.random() * cliffhangers.length)];
        updateThread(threads[index].id, threads[index].content + "\n\n" + randomCliffhanger);
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
                <button
                    onClick={copyAllThreads}
                    className="vibe-btn-primary flex items-center gap-2"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Thread"}
                </button>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Thread Studio</h1>
                        <p className="text-[var(--foreground-secondary)] text-sm">Build viral threads with AI-powered hooks</p>
                    </div>
                </div>
            </header>

            {/* Hook Templates */}
            <section className="mb-10">
                <h2 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                    Hook Templates
                </h2>
                <div className="flex flex-wrap gap-2">
                    {hookTemplates.map((template, i) => (
                        <button
                            key={i}
                            onClick={() => applyHook(template)}
                            className="vibe-badge hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)] transition-all cursor-pointer"
                        >
                            {template.slice(0, 40)}...
                        </button>
                    ))}
                </div>
            </section>

            {/* Thread Builder */}
            <section className="space-y-4">
                {threads.map((thread, index) => (
                    <div key={thread.id} className="relative">
                        <div className="absolute -left-8 top-6 text-[var(--foreground-secondary)] font-mono text-sm font-semibold">
                            {index + 1}/
                        </div>
                        <div className="vibe-card p-6">
                            <textarea
                                value={thread.content}
                                onChange={(e) => updateThread(thread.id, e.target.value)}
                                placeholder={index === 0 ? "Start with a hook..." : "Continue your thread..."}
                                className="w-full bg-transparent border-none outline-none text-[var(--foreground)] resize-none min-h-[100px] placeholder:text-[var(--foreground-secondary)] placeholder:opacity-50"
                            />
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                                <span className="text-xs text-[var(--foreground-secondary)] font-mono">
                                    {thread.content.length}/280
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generateCliffhanger(index)}
                                        className="vibe-badge hover:bg-[var(--accent-secondary)] hover:text-white hover:border-[var(--accent-secondary)] transition-all cursor-pointer flex items-center gap-1"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        Cliffhanger
                                    </button>
                                    {threads.length > 1 && (
                                        <button
                                            onClick={() => removeThread(thread.id)}
                                            className="p-2 rounded-lg text-[var(--foreground-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Thread Button */}
                <button
                    onClick={addThread}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--foreground-secondary)] font-semibold flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:bg-opacity-5 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Tweet to Thread
                </button>
            </section>

            {/* Preview */}
            <section className="mt-10 vibe-card p-8">
                <h2 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-6">Thread Preview</h2>
                <div className="space-y-4">
                    {threads.map((thread, index) => (
                        <div key={thread.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] flex-shrink-0"></div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[var(--foreground)] font-semibold">@yourusername</span>
                                    <span className="text-[var(--foreground-secondary)] text-sm">· now</span>
                                </div>
                                <p className="text-[var(--foreground)] whitespace-pre-wrap">{thread.content || "(empty tweet)"}</p>
                                {index < threads.length - 1 && (
                                    <div className="w-0.5 h-4 bg-[var(--border)] ml-4 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
