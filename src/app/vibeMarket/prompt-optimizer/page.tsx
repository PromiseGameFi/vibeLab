"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Wand2, TrendingDown, Copy, Check,
    Sparkles, Zap, AlertTriangle, ArrowRight
} from "lucide-react";

// Common filler words and phrases to remove
const fillerPatterns = [
    { pattern: /\bplease\b/gi, replacement: "" },
    { pattern: /\bkindly\b/gi, replacement: "" },
    { pattern: /\bI would like you to\b/gi, replacement: "" },
    { pattern: /\bCan you please\b/gi, replacement: "" },
    { pattern: /\bCould you please\b/gi, replacement: "" },
    { pattern: /\bI want you to\b/gi, replacement: "" },
    { pattern: /\bI need you to\b/gi, replacement: "" },
    { pattern: /\bbasically\b/gi, replacement: "" },
    { pattern: /\bactually\b/gi, replacement: "" },
    { pattern: /\bjust\b/gi, replacement: "" },
    { pattern: /\breally\b/gi, replacement: "" },
    { pattern: /\bvery\b/gi, replacement: "" },
    { pattern: /\bquite\b/gi, replacement: "" },
    { pattern: /\bliterally\b/gi, replacement: "" },
    { pattern: /\bin order to\b/gi, replacement: "to" },
    { pattern: /\bdue to the fact that\b/gi, replacement: "because" },
    { pattern: /\bat this point in time\b/gi, replacement: "now" },
    { pattern: /\bfor the purpose of\b/gi, replacement: "for" },
    { pattern: /\bin the event that\b/gi, replacement: "if" },
    { pattern: /\bwith regard to\b/gi, replacement: "about" },
    { pattern: /\bin terms of\b/gi, replacement: "for" },
    { pattern: /\bIt is important to note that\b/gi, replacement: "" },
    { pattern: /\bAs an AI language model,?\s*/gi, replacement: "" },
    { pattern: /\bI'm happy to help\b\.?\s*/gi, replacement: "" },
];

// Optimization tips based on prompt analysis
const analyzePrompt = (text: string) => {
    const tips: string[] = [];

    if (text.length > 500) {
        tips.push("Consider breaking into smaller, focused prompts");
    }
    if (/please|kindly/i.test(text)) {
        tips.push("Remove politeness - AI doesn't need 'please'");
    }
    if (/I want you to|I need you to/i.test(text)) {
        tips.push("Start with action verbs directly: 'Write...', 'Create...'");
    }
    if (/explain in detail|be very specific/i.test(text)) {
        tips.push("Add specific constraints instead: 'in 3 bullet points'");
    }
    if (/\?\s*$/.test(text)) {
        tips.push("Commands work better than questions for most tasks");
    }
    if (text.split('\n').length < 2 && text.length > 200) {
        tips.push("Use bullet points or numbered lists for clarity");
    }

    return tips;
};

const optimizePrompt = (text: string): string => {
    let optimized = text;

    // Apply all filler pattern replacements
    fillerPatterns.forEach(({ pattern, replacement }) => {
        optimized = optimized.replace(pattern, replacement);
    });

    // Clean up multiple spaces and extra whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Remove orphan punctuation
    optimized = optimized.replace(/\s+([,.!?])/g, '$1');
    optimized = optimized.replace(/,\s*,/g, ',');

    return optimized;
};

const charsToTokens = (chars: number) => Math.ceil(chars / 4);

export default function PromptOptimizerPage() {
    const [originalPrompt, setOriginalPrompt] = useState("");
    const [copied, setCopied] = useState(false);

    const optimizedPrompt = useMemo(() => {
        return optimizePrompt(originalPrompt);
    }, [originalPrompt]);

    const tips = useMemo(() => {
        return analyzePrompt(originalPrompt);
    }, [originalPrompt]);

    const originalTokens = charsToTokens(originalPrompt.length);
    const optimizedTokens = charsToTokens(optimizedPrompt.length);
    const tokensSaved = originalTokens - optimizedTokens;
    const savingsPercent = originalTokens > 0
        ? ((tokensSaved / originalTokens) * 100).toFixed(0)
        : 0;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(optimizedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <Link href="/vibeMarket/token-calc" className="btn-ghost text-[var(--accent)]">
                    Token Calculator <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Prompt Optimizer</h1>
                        <p className="text-[var(--foreground-secondary)]">Compress prompts to save tokens and money</p>
                    </div>
                </div>
            </header>

            {/* Input/Output Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Original Prompt */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            Original Prompt
                        </h2>
                        <span className="text-sm text-[var(--foreground-muted)]">
                            ~{originalTokens.toLocaleString()} tokens
                        </span>
                    </div>
                    <textarea
                        value={originalPrompt}
                        onChange={(e) => setOriginalPrompt(e.target.value)}
                        placeholder="Paste your verbose prompt here...

Example:
'Hello, I would like you to please kindly help me write a very detailed blog post about machine learning. Can you please make it really comprehensive and include basically all the important information that readers might need?'"
                        className="input w-full min-h-[200px] resize-none text-sm"
                    />
                </div>

                {/* Optimized Prompt */}
                <div className="card p-5 border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-green-400 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Optimized Prompt
                        </h2>
                        <span className="text-sm text-green-400">
                            ~{optimizedTokens.toLocaleString()} tokens
                        </span>
                    </div>
                    <div className="bg-[var(--background)] rounded-xl p-4 min-h-[200px] text-sm text-white whitespace-pre-wrap">
                        {optimizedPrompt || (
                            <span className="text-[var(--foreground-muted)] italic">
                                Optimized prompt will appear here...
                            </span>
                        )}
                    </div>
                    {optimizedPrompt && (
                        <button
                            onClick={copyToClipboard}
                            className="btn-primary w-full mt-4"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Copy Optimized Prompt"}
                        </button>
                    )}
                </div>
            </div>

            {/* Savings Banner */}
            {tokensSaved > 0 && (
                <div className="card p-4 mb-8 border-green-500/30 bg-green-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingDown className="w-6 h-6 text-green-400" />
                            <div>
                                <p className="text-green-400 font-medium">
                                    Saved {tokensSaved} tokens ({savingsPercent}% reduction)
                                </p>
                                <p className="text-sm text-[var(--foreground-secondary)]">
                                    ≈ ${((tokensSaved / 1_000_000) * 3).toFixed(4)} saved per request (at Claude Sonnet rates)
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">-{savingsPercent}%</p>
                            <p className="text-xs text-[var(--foreground-muted)]">tokens</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Optimization Tips */}
            {tips.length > 0 && (
                <div className="card p-5 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                        <h2 className="font-semibold text-white">More Optimizations</h2>
                    </div>
                    <div className="space-y-2">
                        {tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-[var(--accent)]">•</span>
                                <span className="text-[var(--foreground-secondary)]">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* What Gets Removed */}
            <div className="card p-5 border-orange-500/20 bg-orange-500/5">
                <h3 className="font-semibold text-orange-400 mb-4">What Gets Removed</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {["please", "kindly", "basically", "actually", "just", "really", "very", "quite", "literally"].map(word => (
                        <div key={word} className="px-3 py-2 rounded-lg bg-orange-500/10 text-orange-300">
                            <span className="line-through opacity-60">"{word}"</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-4">
                    Also removes: "I would like you to", "Can you please", "I want you to", and other filler phrases
                </p>
            </div>
        </div>
    );
}
