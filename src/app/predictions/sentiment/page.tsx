"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Newspaper,
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    ExternalLink,
    Sparkles,
    MessageSquare
} from "lucide-react";
import { NewsItem } from "@/lib/predictionTypes";

export default function SentimentPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sentiment, setSentiment] = useState<{
        score: number;
        label: string;
        bullishCount: number;
        bearishCount: number;
        neutralCount: number;
    } | null>(null);
    const [customText, setCustomText] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [customAnalysis, setCustomAnalysis] = useState<{
        sentiment: string;
        score: number;
        confidence: number;
        reasoning: string;
    } | null>(null);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/predictions/sentiment?limit=10');
            const data = await res.json();
            setNews(data.news || []);
            setSentiment(data.sentiment);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const analyzeText = async () => {
        if (!customText.trim()) return;

        setAnalyzing(true);
        try {
            const res = await fetch('/api/predictions/sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: customText })
            });
            const data = await res.json();
            setCustomAnalysis(data.analysis);
        } catch (error) {
            console.error('Analysis failed:', error);
        }
        setAnalyzing(false);
    };

    const formatTime = (date: Date) => {
        const now = Date.now();
        const diff = now - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor(diff / 60000);

        if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${minutes}m ago`;
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'bullish': return <TrendingUp className="w-4 h-4 text-green-400" />;
            case 'bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'bullish': return 'text-green-400 bg-green-500/20';
            case 'bearish': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/predictions" className="btn-ghost">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
                                <Newspaper className="w-5 h-5 text-orange-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">News Sentiment</h1>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">
                            Track market-moving news and sentiment analysis
                        </p>
                    </div>
                </div>

                {/* Overall Sentiment */}
                {sentiment && (
                    <div className="card p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Market Sentiment Overview</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${sentiment.label === 'bullish' ? 'text-green-400' :
                                        sentiment.label === 'bearish' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                    {sentiment.label.toUpperCase()}
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)]">Overall Mood</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">
                                    {sentiment.bullishCount}
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)]">Bullish</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-400">
                                    {sentiment.bearishCount}
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)]">Bearish</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-400">
                                    {sentiment.neutralCount}
                                </div>
                                <p className="text-xs text-[var(--foreground-muted)]">Neutral</p>
                            </div>
                        </div>

                        {/* Sentiment bar */}
                        <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden flex">
                            <div
                                className="h-full bg-green-500"
                                style={{ width: `${(sentiment.bullishCount / news.length) * 100}%` }}
                            />
                            <div
                                className="h-full bg-gray-500"
                                style={{ width: `${(sentiment.neutralCount / news.length) * 100}%` }}
                            />
                            <div
                                className="h-full bg-red-500"
                                style={{ width: `${(sentiment.bearishCount / news.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Custom Analysis */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        AI Sentiment Analyzer
                    </h2>
                    <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                        Paste any news headline, tweet, or text to analyze its market sentiment
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Paste news headline or tweet..."
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && analyzeText()}
                            className="input flex-1"
                        />
                        <button
                            onClick={analyzeText}
                            disabled={analyzing || !customText.trim()}
                            className="btn-primary"
                        >
                            {analyzing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <MessageSquare className="w-4 h-4" />
                            )}
                            Analyze
                        </button>
                    </div>

                    {customAnalysis && (
                        <div className={`mt-4 p-4 rounded-lg ${getSentimentColor(customAnalysis.sentiment)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getSentimentIcon(customAnalysis.sentiment)}
                                    <span className="font-semibold">
                                        {customAnalysis.sentiment.toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm">
                                    Score: {(customAnalysis.score * 100).toFixed(0)}% |
                                    Confidence: {(customAnalysis.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-sm opacity-80">{customAnalysis.reasoning}</p>
                        </div>
                    )}
                </div>

                {/* News Feed */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Latest News</h2>
                    <button
                        onClick={fetchNews}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-[var(--foreground-muted)]">
                            Loading news...
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-12 text-[var(--foreground-muted)]">
                            No news found
                        </div>
                    ) : (
                        news.map(item => (
                            <div
                                key={item.id}
                                className={`card p-4 border-l-4 ${item.sentiment === 'bullish' ? 'border-l-green-500' :
                                        item.sentiment === 'bearish' ? 'border-l-red-500' :
                                            'border-l-gray-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentColor(item.sentiment)}`}>
                                                {item.sentiment.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-[var(--foreground-muted)]">
                                                {item.source} · {formatTime(item.publishedAt)}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-white mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-[var(--foreground-secondary)] mb-2">
                                            {item.summary}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.keywords.map(kw => (
                                                <span
                                                    key={kw}
                                                    className="text-xs px-2 py-1 rounded-full bg-white/5 text-[var(--foreground-muted)]"
                                                >
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-ghost p-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
