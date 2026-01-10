"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Bell,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertTriangle,
    X
} from "lucide-react";
import { MarketAlert, AlertType, ALERT_TYPE_CONFIG } from "@/lib/predictionTypes";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<MarketAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAlert, setNewAlert] = useState({
        marketId: '',
        marketTitle: '',
        type: 'price_above' as AlertType,
        targetValue: 0.7,
    });

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/predictions/alerts');
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const createAlert = async () => {
        if (!newAlert.marketTitle.trim()) return;

        try {
            const res = await fetch('/api/predictions/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId: newAlert.marketId || `custom-${Date.now()}`,
                    marketTitle: newAlert.marketTitle,
                    type: newAlert.type,
                    targetValue: newAlert.targetValue,
                    platform: 'polymarket',
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewAlert({
                    marketId: '',
                    marketTitle: '',
                    type: 'price_above',
                    targetValue: 0.7,
                });
                fetchAlerts();
            }
        } catch (error) {
            console.error('Failed to create alert:', error);
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            const res = await fetch(`/api/predictions/alerts?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchAlerts();
            }
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    const activeAlerts = alerts.filter(a => !a.isTriggered);
    const triggeredAlerts = alerts.filter(a => a.isTriggered);

    return (
        <div className="min-h-screen py-24 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/predictions" className="btn-ghost">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">Market Alerts</h1>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">
                            Get notified when markets hit your targets
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Create Alert
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{activeAlerts.length}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Active Alerts</p>
                        </div>
                    </div>
                    <div className="card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{triggeredAlerts.length}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Triggered</p>
                        </div>
                    </div>
                </div>

                {/* Active Alerts */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Active Alerts
                    </h2>

                    {loading ? (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">
                            Loading alerts...
                        </div>
                    ) : activeAlerts.length === 0 ? (
                        <div className="card p-8 text-center">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
                            <p className="text-[var(--foreground-muted)]">
                                No active alerts. Create one to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeAlerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className="card p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">
                                            {ALERT_TYPE_CONFIG[alert.type].icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                {alert.marketTitle}
                                            </p>
                                            <p className="text-sm text-[var(--foreground-secondary)]">
                                                {ALERT_TYPE_CONFIG[alert.type].name}: {(alert.targetValue * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm text-[var(--foreground-muted)]">
                                                Current: {(alert.currentValue * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteAlert(alert.id)}
                                            className="btn-ghost p-2 text-red-400 hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Triggered Alerts */}
                {triggeredAlerts.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            Triggered Alerts
                        </h2>
                        <div className="space-y-3">
                            {triggeredAlerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className="card p-4 flex items-center justify-between border-l-4 border-l-green-500 bg-green-500/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">
                                            {ALERT_TYPE_CONFIG[alert.type].icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                {alert.marketTitle}
                                            </p>
                                            <p className="text-sm text-green-400">
                                                Triggered at {(alert.currentValue * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAlert(alert.id)}
                                        className="btn-ghost p-2 text-[var(--foreground-muted)] hover:bg-white/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Create Alert Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                        <div className="card max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-yellow-400" />
                                    Create Alert
                                </h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-[var(--foreground-muted)] hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                                        Market Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Will Bitcoin reach $100k?"
                                        value={newAlert.marketTitle}
                                        onChange={(e) => setNewAlert({ ...newAlert, marketTitle: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                                        Alert Type
                                    </label>
                                    <select
                                        value={newAlert.type}
                                        onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as AlertType })}
                                        className="input w-full"
                                    >
                                        {Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => (
                                            <option key={type} value={type}>
                                                {config.icon} {config.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                        {ALERT_TYPE_CONFIG[newAlert.type].description}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm text-[var(--foreground-secondary)] mb-2">
                                        Target Value: {(newAlert.targetValue * 100).toFixed(0)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={newAlert.targetValue}
                                        onChange={(e) => setNewAlert({ ...newAlert, targetValue: parseFloat(e.target.value) })}
                                        className="w-full accent-[var(--accent)]"
                                    />
                                    <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
                                        <span>0%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createAlert}
                                    disabled={!newAlert.marketTitle.trim()}
                                    className="btn-primary flex-1"
                                >
                                    <Bell className="w-4 h-4" />
                                    Create Alert
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
