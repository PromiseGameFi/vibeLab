"use client";

import { useState, useEffect, useCallback } from "react";
import {
    TrendingUp,
    Search,
    Filter,
    Zap,
    Brain,
    ExternalLink,
    RefreshCw,
    ChevronDown,
    Target,
    BarChart3,
    Sparkles,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import {
    Market,
    MarketCategory,
    Platform,
    ArbitrageOpportunity,
    AIAnalysis,
    PLATFORM_CONFIG,
    CATEGORY_CONFIG
} from "@/lib/predictionTypes";

export default function PredictionsPage() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "all">("all");
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
    const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);
    const [showArbitrage, setShowArbitrage] = useState(false);
    const [analyzingMarket, setAnalyzingMarket] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    // Fetch markets from both platforms
    const fetchMarkets = useCallback(async () => {
        setLoading(true);
        try {
            const [polyRes, kalshiRes] = await Promise.all([
                fetch(`/api/predictions/polymarket?limit=30&category=${selectedCategory}`),
                fetch(`/api/predictions/kalshi?limit=30&category=${selectedCategory}`)
            ]);

            const polyData = await polyRes.json();
            const kalshiData = await kalshiRes.json();

            const allMarkets = [
                ...(polyData.markets || []),
                ...(kalshiData.markets || [])
            ];

            // Sort by volume
            allMarkets.sort((a, b) => b.volume - a.volume);
            setMarkets(allMarkets);

            // Check for arbitrage
            const arbRes = await fetch('/api/predictions/arbitrage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markets: allMarkets })
            });
            const arbData = await arbRes.json();
            setArbitrageOpps(arbData.opportunities || []);

        } catch (error) {
            console.error("Failed to fetch markets:", error);
        }
        setLoading(false);
    }, [selectedCategory]);

    useEffect(() => {
        fetchMarkets();
    }, [fetchMarkets]);

    // Filter markets
    const filteredMarkets = markets.filter(m => {
        const matchesSearch = !search ||
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.description?.toLowerCase().includes(search.toLowerCase());
        const matchesPlatform = selectedPlatform === "all" || m.platform === selectedPlatform;
        const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
        return matchesSearch && matchesPlatform && matchesCategory;
    });

    // AI Analysis
    const analyzeMarket = async (market: Market) => {
        setAnalyzingMarket(market.id);
        try {
            const response = await fetch('/api/predictions/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId: market.id,
                    title: market.title,
                    description: market.description,
                    currentPrice: market.outcomes[0]?.price || 0.5,
                    endDate: market.endDate
                })
            });
            const data = await response.json();
            if (data.analysis) {
                setAiAnalysis(data.analysis);
                setShowAnalysisModal(true);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        }
        setAnalyzingMarket(null);
    };

    // Format volume
    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
        return `$${vol.toFixed(0)}`;
    };

    // Get probability color
    const getProbColor = (prob: number) => {
        if (prob >= 0.7) return "text-green-400";
        if (prob >= 0.4) return "text-yellow-400";
        return "text-red-400";
    };

    const categories: (MarketCategory | "all")[] = ["all", "politics", "crypto", "economics", "sports", "entertainment", "science"];
    const platforms: (Platform | "all")[] = ["all", "polymarket", "kalshi"];

    return (
        <div className="min-h-screen py-24 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-blue-500/30 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">Prediction Markets</h1>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">
                            {markets.length} markets · {arbitrageOpps.length} arbitrage opportunities
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {arbitrageOpps.length > 0 && (
                            <button
                                onClick={() => setShowArbitrage(!showArbitrage)}
                                className={`btn-secondary ${showArbitrage ? 'ring-2 ring-yellow-500' : ''}`}
                            >
                                <Zap className="w-4 h-4 text-yellow-400" />
                                {arbitrageOpps.length} Arb
                            </button>
                        )}
                        <button
                            onClick={fetchMarkets}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Feature Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Link
                        href="/predictions/whales"
                        className="card p-4 hover:border-[var(--accent)]/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-xl">🐋</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Smart Money</h3>
                                <p className="text-xs text-[var(--foreground-secondary)]">Track whale wallets</p>
                            </div>
                        </div>
                    </Link>
                    <Link
                        href="/predictions/sentiment"
                        className="card p-4 hover:border-[var(--accent)]/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-xl">📰</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">News Sentiment</h3>
                                <p className="text-xs text-[var(--foreground-secondary)]">Market-moving news</p>
                            </div>
                        </div>
                    </Link>
                    <Link
                        href="/predictions/alerts"
                        className="card p-4 hover:border-[var(--accent)]/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-xl">🔔</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Market Alerts</h3>
                                <p className="text-xs text-[var(--foreground-secondary)]">Price notifications</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Arbitrage Alert */}
                {showArbitrage && arbitrageOpps.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <h3 className="font-semibold text-yellow-400">Arbitrage Opportunities</h3>
                        </div>
                        <div className="space-y-2">
                            {arbitrageOpps.map(opp => (
                                <div key={opp.marketId} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                                    <div>
                                        <p className="text-sm text-white">{opp.title.slice(0, 60)}...</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">
                                            {PLATFORM_CONFIG[opp.platform].icon} YES: {(opp.yesPrice * 100).toFixed(1)}% | NO: {(opp.noPrice * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-bold">+{(opp.profitMargin * 100).toFixed(1)}%</p>
                                        <a
                                            href={opp.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[var(--accent)]"
                                        >
                                            Trade →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            placeholder="Search markets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as MarketCategory | "all")}
                            className="input py-2"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === "all" ? "All Categories" : CATEGORY_CONFIG[cat].icon + " " + CATEGORY_CONFIG[cat].name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {platforms.map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPlatform(p)}
                                className={`px-3 py-2 rounded-lg text-sm transition-all ${selectedPlatform === p
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-white/5 text-[var(--foreground-secondary)] hover:bg-white/10'
                                    }`}
                            >
                                {p === "all" ? "All" : PLATFORM_CONFIG[p].icon + " " + PLATFORM_CONFIG[p].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Markets Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--foreground-muted)]">Loading markets...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMarkets.map(market => (
                            <div
                                key={market.id}
                                className="card p-4 hover:border-[var(--accent)]/50 transition-all group"
                            >
                                {/* Platform badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${PLATFORM_CONFIG[market.platform].color}`}>
                                        {PLATFORM_CONFIG[market.platform].icon} {PLATFORM_CONFIG[market.platform].name}
                                    </span>
                                    <span className="text-xs text-[var(--foreground-muted)]">
                                        {CATEGORY_CONFIG[market.category].icon}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-white mb-3 line-clamp-2 min-h-[48px]">
                                    {market.title}
                                </h3>

                                {/* Outcomes */}
                                <div className="space-y-2 mb-4">
                                    {market.outcomes.slice(0, 2).map(outcome => (
                                        <div key={outcome.id} className="flex items-center justify-between">
                                            <span className="text-sm text-[var(--foreground-secondary)]">
                                                {outcome.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                        style={{ width: `${outcome.price * 100}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-mono ${getProbColor(outcome.price)}`}>
                                                    {(outcome.price * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-4">
                                    <span className="flex items-center gap-1">
                                        <BarChart3 className="w-3 h-3" />
                                        {formatVolume(market.volume)}
                                    </span>
                                    <span>
                                        Ends {new Date(market.endDate).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => analyzeMarket(market)}
                                        disabled={analyzingMarket === market.id}
                                        className="flex-1 btn-secondary text-xs py-2"
                                    >
                                        {analyzingMarket === market.id ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Brain className="w-3 h-3" />
                                        )}
                                        AI Analyze
                                    </button>
                                    <a
                                        href={market.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary text-xs py-2 px-3"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Trade
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* AI Analysis Modal */}
                {showAnalysisModal && aiAnalysis && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                        <div className="card max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    AI Analysis
                                </h3>
                                <button
                                    onClick={() => setShowAnalysisModal(false)}
                                    className="text-[var(--foreground-muted)] hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                                {aiAnalysis.title}
                            </p>

                            {/* Probability comparison */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <p className="text-xs text-blue-400 mb-1">Market</p>
                                    <p className="text-xl font-bold text-blue-400">
                                        {(aiAnalysis.marketProbability * 100).toFixed(0)}%
                                    </p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                    <p className="text-xs text-purple-400 mb-1">AI Estimate</p>
                                    <p className="text-xl font-bold text-purple-400">
                                        {(aiAnalysis.aiProbability * 100).toFixed(0)}%
                                    </p>
                                </div>
                                <div className={`text-center p-3 rounded-lg ${aiAnalysis.edge > 0.05 ? 'bg-green-500/10 border-green-500/30' :
                                    aiAnalysis.edge < -0.05 ? 'bg-red-500/10 border-red-500/30' :
                                        'bg-gray-500/10 border-gray-500/30'
                                    } border`}>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-1">Edge</p>
                                    <p className={`text-xl font-bold ${aiAnalysis.edge > 0.05 ? 'text-green-400' :
                                        aiAnalysis.edge < -0.05 ? 'text-red-400' :
                                            'text-gray-400'
                                        }`}>
                                        {aiAnalysis.edge > 0 ? '+' : ''}{(aiAnalysis.edge * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className={`p-3 rounded-lg mb-4 ${aiAnalysis.edge > 0.1 ? 'bg-green-500/20 border border-green-500/30' :
                                aiAnalysis.edge < -0.1 ? 'bg-red-500/20 border border-red-500/30' :
                                    'bg-gray-500/20 border border-gray-500/30'
                                }`}>
                                <p className="text-sm font-semibold">
                                    {aiAnalysis.edge > 0.1 ? '🟢 BUY YES - Market undervalues this outcome' :
                                        aiAnalysis.edge < -0.1 ? '🔴 BUY NO - Market overvalues this outcome' :
                                            '⚪ HOLD - No significant edge detected'}
                                </p>
                            </div>

                            {/* Confidence */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs text-[var(--foreground-muted)]">Confidence:</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${aiAnalysis.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                                    aiAnalysis.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {aiAnalysis.confidence.toUpperCase()}
                                </span>
                            </div>

                            {/* Reasoning */}
                            <div className="text-sm text-[var(--foreground-secondary)] whitespace-pre-wrap">
                                {aiAnalysis.reasoning}
                            </div>

                            {/* Key factors */}
                            {aiAnalysis.sources.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Key Factors:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aiAnalysis.sources.map((s, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
