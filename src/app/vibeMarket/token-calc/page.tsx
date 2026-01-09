"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Calculator, DollarSign, Zap, TrendingDown,
    Copy, Check, Info, Sparkles, Brain, MessageSquare
} from "lucide-react";

// Token pricing per 1M tokens (as of Jan 2025)
const providers = [
    {
        id: "gpt-4o",
        name: "GPT-4o",
        company: "OpenAI",
        inputPer1M: 2.50,
        outputPer1M: 10.00,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/30"
    },
    {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        company: "OpenAI",
        inputPer1M: 0.15,
        outputPer1M: 0.60,
        color: "text-green-300",
        bg: "bg-green-500/10",
        border: "border-green-500/30"
    },
    {
        id: "claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        company: "Anthropic",
        inputPer1M: 3.00,
        outputPer1M: 15.00,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30"
    },
    {
        id: "claude-3-haiku",
        name: "Claude 3 Haiku",
        company: "Anthropic",
        inputPer1M: 0.25,
        outputPer1M: 1.25,
        color: "text-orange-300",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30"
    },
    {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        company: "Google",
        inputPer1M: 1.25,
        outputPer1M: 5.00,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30"
    },
    {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        company: "Google",
        inputPer1M: 0.075,
        outputPer1M: 0.30,
        color: "text-blue-300",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30"
    },
    {
        id: "deepseek-v3",
        name: "DeepSeek V3",
        company: "DeepSeek",
        inputPer1M: 0.27,
        outputPer1M: 1.10,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30"
    }
];

// Rough word-to-token conversion (1 token ≈ 0.75 words for English)
const wordsToTokens = (words: number) => Math.ceil(words / 0.75);
const charsToTokens = (chars: number) => Math.ceil(chars / 4);

export default function TokenCalculatorPage() {
    const [inputMethod, setInputMethod] = useState<"tokens" | "words" | "paste">("tokens");
    const [inputTokens, setInputTokens] = useState(1000);
    const [outputTokens, setOutputTokens] = useState(500);
    const [pastedText, setPastedText] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    // Calculate tokens from pasted text
    const estimatedTokens = useMemo(() => {
        if (inputMethod === "paste" && pastedText) {
            return charsToTokens(pastedText.length);
        }
        return inputTokens;
    }, [inputMethod, pastedText, inputTokens]);

    // Calculate costs for all providers
    const costs = useMemo(() => {
        return providers.map(provider => {
            const inputCost = (estimatedTokens / 1_000_000) * provider.inputPer1M;
            const outputCost = (outputTokens / 1_000_000) * provider.outputPer1M;
            const totalCost = inputCost + outputCost;
            return {
                ...provider,
                inputCost,
                outputCost,
                totalCost
            };
        }).sort((a, b) => a.totalCost - b.totalCost);
    }, [estimatedTokens, outputTokens]);

    const cheapest = costs[0];
    const mostExpensive = costs[costs.length - 1];
    const savings = mostExpensive.totalCost - cheapest.totalCost;
    const savingsPercent = mostExpensive.totalCost > 0
        ? ((savings / mostExpensive.totalCost) * 100).toFixed(0)
        : 0;

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Token Cost Calculator</h1>
                        <p className="text-[var(--foreground-secondary)]">Compare costs across AI providers</p>
                    </div>
                </div>
            </header>

            {/* Input Section */}
            <div className="card p-6 mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    <h2 className="font-semibold text-white">Estimate Your Usage</h2>
                </div>

                {/* Input Method Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: "tokens", label: "Enter Tokens" },
                        { id: "paste", label: "Paste Text" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setInputMethod(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${inputMethod === tab.id
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-white/5 text-[var(--foreground-secondary)] hover:bg-white/10"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {inputMethod === "tokens" ? (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                                Input Tokens (your prompt)
                            </label>
                            <input
                                type="number"
                                value={inputTokens}
                                onChange={(e) => setInputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                className="input w-full text-lg"
                            />
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                ≈ {Math.round(inputTokens * 0.75).toLocaleString()} words
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                                Output Tokens (AI response)
                            </label>
                            <input
                                type="number"
                                value={outputTokens}
                                onChange={(e) => setOutputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                className="input w-full text-lg"
                            />
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                ≈ {Math.round(outputTokens * 0.75).toLocaleString()} words
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                            Paste your prompt to estimate tokens
                        </label>
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Paste your prompt here..."
                            className="input w-full min-h-[120px] resize-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-[var(--foreground-muted)]">
                                {pastedText.length.toLocaleString()} chars ≈ <strong className="text-white">{estimatedTokens.toLocaleString()}</strong> tokens
                            </p>
                            <div>
                                <label className="block text-sm text-[var(--foreground-secondary)] mb-1">
                                    Expected output tokens:
                                </label>
                                <input
                                    type="number"
                                    value={outputTokens}
                                    onChange={(e) => setOutputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="input w-32 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Savings Banner */}
            {savings > 0.0001 && (
                <div className="card p-4 mb-8 border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="w-6 h-6 text-green-400" />
                        <div>
                            <p className="text-green-400 font-medium">
                                Save up to {savingsPercent}% by switching providers
                            </p>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                {cheapest.name} is ${savings.toFixed(4)} cheaper than {mostExpensive.name} for this query
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {costs.map((provider, index) => (
                    <div
                        key={provider.id}
                        className={`card p-5 relative ${provider.border} ${index === 0 ? 'border-2 border-green-500/50' : ''
                            }`}
                    >
                        {index === 0 && (
                            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-green-500 text-black text-xs font-bold">
                                CHEAPEST
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className={`font-semibold ${provider.color}`}>{provider.name}</h3>
                                <p className="text-xs text-[var(--foreground-muted)]">{provider.company}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-lg ${provider.bg} ${provider.color} text-lg font-bold`}>
                                ${provider.totalCost.toFixed(4)}
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--foreground-muted)]">Input:</span>
                                <span className="text-white">${provider.inputCost.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--foreground-muted)]">Output:</span>
                                <span className="text-white">${provider.outputCost.toFixed(4)}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--foreground-muted)]">
                            <div className="flex justify-between">
                                <span>Input/1M:</span>
                                <span>${provider.inputPer1M}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Output/1M:</span>
                                <span>${provider.outputPer1M}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tips */}
            <div className="card p-5 mt-8 border-[var(--accent)]/30 bg-[var(--accent)]/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent)] mb-2">Token Saving Tips</h3>
                        <ul className="text-[var(--foreground-secondary)] text-sm space-y-1">
                            <li>• Use shorter, more specific prompts - every word costs tokens</li>
                            <li>• For simple tasks, use "mini" or "flash" models - 10-20x cheaper</li>
                            <li>• Cache common responses to avoid repeat API calls</li>
                            <li>• Use system prompts efficiently - they count on every request</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
