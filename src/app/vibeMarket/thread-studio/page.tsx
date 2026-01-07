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
            <div className="flex items-center justify-between mb-12">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to VibeMarket
                </Link>
                <button
                    onClick={copyAllThreads}
                    className="px-4 py-2 rounded-xl bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary text-sm font-bold flex items-center gap-2 hover:bg-accent-secondary hover:text-white transition-all"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Thread"}
                </button>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Thread Studio</h1>
                        <p className="text-white/40 text-sm">Build viral threads with AI-powered hooks</p>
                    </div>
                </div>
            </header>

            {/* Hook Templates */}
            <section className="mb-12">
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-primary" />
                    Hook Templates
                </h2>
                <div className="flex flex-wrap gap-2">
                    {hookTemplates.map((template, i) => (
                        <button
                            key={i}
                            onClick={() => applyHook(template)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-accent-primary/10 hover:border-accent-primary/30 hover:text-white transition-all"
                        >
                            {template.slice(0, 40)}...
                        </button>
                    ))}
                </div>
            </section>

            {/* Thread Builder */}
            <section className="space-y-4">
                {threads.map((thread, index) => (
                    <div key={thread.id} className="relative group">
                        <div className="absolute -left-8 top-4 text-white/10 font-mono text-sm font-bold">
                            {index + 1}/
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                            <textarea
                                value={thread.content}
                                onChange={(e) => updateThread(thread.id, e.target.value)}
                                placeholder={index === 0 ? "Start with a hook..." : "Continue your thread..."}
                                className="w-full bg-transparent border-none outline-none text-white resize-none min-h-[100px] placeholder:text-white/20"
                            />
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                <span className="text-xs text-white/20 font-mono">
                                    {thread.content.length}/280
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generateCliffhanger(index)}
                                        className="px-3 py-1 rounded-lg bg-white/5 text-white/40 text-xs font-bold hover:bg-accent-primary/10 hover:text-accent-primary transition-all flex items-center gap-1"
                                    >
                                        <Wand2 className="w-3 h-3" />
                                        Cliffhanger
                                    </button>
                                    {threads.length > 1 && (
                                        <button
                                            onClick={() => removeThread(thread.id)}
                                            className="p-2 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
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
                    className="w-full p-6 rounded-2xl border-2 border-dashed border-white/10 text-white/20 font-bold flex items-center justify-center gap-2 hover:border-accent-secondary/30 hover:text-accent-secondary hover:bg-accent-secondary/5 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Tweet to Thread
                </button>
            </section>

            {/* Preview */}
            <section className="mt-12 p-8 rounded-3xl bg-black/40 border border-white/5">
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Thread Preview</h2>
                <div className="space-y-4">
                    {threads.map((thread, index) => (
                        <div key={thread.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0"></div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold">@yourusername</span>
                                    <span className="text-white/40 text-sm">· now</span>
                                </div>
                                <p className="text-white/80 whitespace-pre-wrap">{thread.content || "(empty tweet)"}</p>
                                {index < threads.length - 1 && (
                                    <div className="w-[2px] h-4 bg-white/10 ml-4 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
