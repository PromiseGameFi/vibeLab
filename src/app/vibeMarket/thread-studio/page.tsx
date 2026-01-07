"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Copy, Plus, Trash2, Wand2, Check, MessageSquare } from "lucide-react";

interface Thread {
    id: string;
    content: string;
}

const hookTemplates = [
    "I spent 100 hours learning [topic]. Here's what I wish I knew:",
    "The harsh truth about [topic] nobody tells you:",
    "Stop doing [common mistake]. Here's what works:",
    "I analyzed 1,000 [things]. Here's what separates winners:",
    "The [number] rules of [topic] I learned the hard way:"
];

export default function ThreadStudioPage() {
    const [threads, setThreads] = useState<Thread[]>([{ id: "1", content: "" }]);
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
            "The next part changed everything.",
            "Wait until you see what comes next."
        ];
        const random = cliffhangers[Math.floor(Math.random() * cliffhangers.length)];
        updateThread(threads[index].id, threads[index].content + "\n\n" + random);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <button onClick={copyAllThreads} className="btn-primary">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Thread"}
                </button>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Thread Studio</h1>
                        <p className="text-[var(--foreground-secondary)]">Build viral threads with AI hooks</p>
                    </div>
                </div>
            </header>

            {/* Hook Templates */}
            <section className="mb-10">
                <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    Hook Templates
                </h2>
                <div className="flex flex-wrap gap-2">
                    {hookTemplates.map((template, i) => (
                        <button
                            key={i}
                            onClick={() => applyHook(template)}
                            className="badge hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all cursor-pointer"
                        >
                            {template.slice(0, 35)}...
                        </button>
                    ))}
                </div>
            </section>

            {/* Thread Builder */}
            <section className="space-y-4">
                {threads.map((thread, index) => (
                    <div key={thread.id} className="relative">
                        <span className="absolute -left-8 top-6 text-[var(--foreground-muted)] font-mono text-sm">
                            {index + 1}/
                        </span>
                        <div className="card p-6">
                            <textarea
                                value={thread.content}
                                onChange={(e) => updateThread(thread.id, e.target.value)}
                                placeholder={index === 0 ? "Start with a hook..." : "Continue your thread..."}
                                className="w-full bg-transparent border-none outline-none text-white resize-none min-h-[100px] placeholder:text-[var(--foreground-muted)]"
                            />
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                                <span className="text-xs text-[var(--foreground-muted)] font-mono">
                                    {thread.content.length}/280
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generateCliffhanger(index)}
                                        className="badge hover:bg-[var(--accent-secondary)] hover:text-white hover:border-[var(--accent-secondary)] cursor-pointer"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        Cliffhanger
                                    </button>
                                    {threads.length > 1 && (
                                        <button
                                            onClick={() => removeThread(thread.id)}
                                            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addThread}
                    className="w-full p-6 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] text-[var(--foreground-secondary)] font-medium flex items-center justify-center gap-2 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Tweet to Thread
                </button>
            </section>
        </div>
    );
}
