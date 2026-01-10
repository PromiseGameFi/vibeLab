"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    ExternalLink,
    Users,
    Trophy,
    DollarSign,
    Activity
} from "lucide-react";
import { WhaleActivity, WhaleWallet, PLATFORM_CONFIG } from "@/lib/predictionTypes";

export default function WhalesPage() {
    const [view, setView] = useState<'activity' | 'wallets'>('activity');
    const [activities, setActivities] = useState<WhaleActivity[]>([]);
    const [wallets, setWallets] = useState<WhaleWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalVolume: number;
        buyVolume: number;
        sellVolume: number;
        buyRatio: number;
    } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'activity') {
                const res = await fetch('/api/predictions/whales?view=activity&limit=20');
                const data = await res.json();
                setActivities(data.activities || []);
                setStats(data.stats);
            } else {
                const res = await fetch('/api/predictions/whales?view=wallets');
                const data = await res.json();
                setWallets(data.wallets || []);
            }
        } catch (error) {
            console.error('Failed to fetch whale data:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [view]);

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                                <span className="text-2xl">🐋</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white">Smart Money Tracker</h1>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">
                            Track whale wallets and large trades on prediction markets
                        </p>
                    </div>
                </div>

                {/* Stats */}
                {stats && view === 'activity' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-2 text-[var(--foreground-muted)] mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs">Total Volume</span>
                            </div>
                            <p className="text-xl font-bold text-white">{formatAmount(stats.totalVolume)}</p>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs">Buy Volume</span>
                            </div>
                            <p className="text-xl font-bold text-green-400">{formatAmount(stats.buyVolume)}</p>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-2 text-red-400 mb-1">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-xs">Sell Volume</span>
                            </div>
                            <p className="text-xl font-bold text-red-400">{formatAmount(stats.sellVolume)}</p>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-2 text-[var(--foreground-muted)] mb-1">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs">Buy/Sell Ratio</span>
                            </div>
                            <p className={`text-xl font-bold ${stats.buyRatio > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                {(stats.buyRatio * 100).toFixed(0)}% Buy
                            </p>
                        </div>
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('activity')}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${view === 'activity'
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-white/5 text-[var(--foreground-secondary)] hover:bg-white/10'
                                }`}
                        >
                            <Activity className="w-4 h-4 inline mr-2" />
                            Live Activity
                        </button>
                        <button
                            onClick={() => setView('wallets')}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${view === 'wallets'
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-white/5 text-[var(--foreground-secondary)] hover:bg-white/10'
                                }`}
                        >
                            <Trophy className="w-4 h-4 inline mr-2" />
                            Top Traders
                        </button>
                    </div>
                    <button
                        onClick={fetchData}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Activity View */}
                {view === 'activity' && (
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-12 text-[var(--foreground-muted)]">
                                Loading whale activity...
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-12 text-[var(--foreground-muted)]">
                                No whale activity found
                            </div>
                        ) : (
                            activities.map(activity => (
                                <div
                                    key={activity.id}
                                    className={`card p-4 border-l-4 ${activity.action === 'buy'
                                            ? 'border-l-green-500'
                                            : 'border-l-red-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action === 'buy'
                                                    ? 'bg-green-500/20'
                                                    : 'bg-red-500/20'
                                                }`}>
                                                {activity.action === 'buy' ? (
                                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">
                                                        {activity.walletLabel || activity.wallet}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activity.action === 'buy'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {activity.action.toUpperCase()} {activity.outcome.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--foreground-secondary)]">
                                                    {activity.marketTitle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${activity.action === 'buy' ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {formatAmount(activity.amount)}
                                            </p>
                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                @ {(activity.price * 100).toFixed(0)}% · {formatTime(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Wallets View */}
                {view === 'wallets' && (
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-12 text-[var(--foreground-muted)]">
                                Loading top traders...
                            </div>
                        ) : wallets.length === 0 ? (
                            <div className="text-center py-12 text-[var(--foreground-muted)]">
                                No traders found
                            </div>
                        ) : (
                            wallets.map((wallet, index) => (
                                <div
                                    key={wallet.address}
                                    className="card p-4 hover:border-[var(--accent)]/50 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                                <span className="font-bold text-white">#{index + 1}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">
                                                        {wallet.label || wallet.address}
                                                    </span>
                                                    {wallet.followersCount && wallet.followersCount > 0 && (
                                                        <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {wallet.followersCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[var(--foreground-secondary)]">
                                                    Volume: {formatAmount(wallet.totalVolume)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-400">
                                                +{formatAmount(wallet.pnl)}
                                            </p>
                                            <p className="text-sm text-[var(--foreground-muted)]">
                                                {(wallet.winRate * 100).toFixed(0)}% win rate
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
