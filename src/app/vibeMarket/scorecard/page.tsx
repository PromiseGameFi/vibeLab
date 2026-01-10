"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Trophy, Flame, Target, CheckCircle2, Circle,
    Sparkles, Award, Zap, Calendar, TrendingUp
} from "lucide-react";

interface Goal {
    id: string;
    label: string;
    target: number;
    current: number;
    type: "daily" | "weekly";
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: "flame" | "trophy" | "zap" | "award";
    requirement: number;
    unlocked: boolean;
}

const defaultGoals: Goal[] = [
    { id: "1", label: "Tweets Posted", target: 3, current: 0, type: "daily" },
    { id: "2", label: "Replies Sent", target: 10, current: 0, type: "daily" },
    { id: "3", label: "Meaningful Convos", target: 5, current: 0, type: "daily" },
    { id: "4", label: "Threads Published", target: 2, current: 0, type: "weekly" }
];

const badgeDefinitions: Omit<Badge, "unlocked">[] = [
    { id: "streak-3", name: "Getting Started", description: "3-day streak", icon: "flame", requirement: 3 },
    { id: "streak-7", name: "On Fire", description: "7-day streak", icon: "flame", requirement: 7 },
    { id: "streak-14", name: "Unstoppable", description: "14-day streak", icon: "zap", requirement: 14 },
    { id: "streak-30", name: "Legend", description: "30-day streak", icon: "trophy", requirement: 30 },
    { id: "streak-100", name: "Centurion", description: "100-day streak", icon: "award", requirement: 100 }
];

const IconMap = {
    flame: Flame,
    trophy: Trophy,
    zap: Zap,
    award: Award
};

export default function ScorecardPage() {
    const [goals, setGoals] = useState<Goal[]>(defaultGoals);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalDaysCompleted, setTotalDaysCompleted] = useState(0);
    const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-scorecard-v2");
        if (saved) {
            const parsed = JSON.parse(saved);
            setGoals(parsed.goals || defaultGoals);
            setStreak(parsed.streak || 0);
            setBestStreak(parsed.bestStreak || 0);
            setTotalDaysCompleted(parsed.totalDaysCompleted || 0);
            setLastCompletedDate(parsed.lastCompletedDate || null);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-scorecard-v2", JSON.stringify({
            goals, streak, bestStreak, totalDaysCompleted, lastCompletedDate
        }));
    }, [goals, streak, bestStreak, totalDaysCompleted, lastCompletedDate]);

    const incrementGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, current: Math.min(g.current + 1, g.target) } : g));
    };

    const decrementGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, current: Math.max(g.current - 1, 0) } : g));
    };

    const completeDay = () => {
        const today = new Date().toDateString();
        const allDailyComplete = goals.filter(g => g.type === "daily").every(g => g.current >= g.target);

        if (allDailyComplete && lastCompletedDate !== today) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            setBestStreak(Math.max(bestStreak, newStreak));
            setTotalDaysCompleted(totalDaysCompleted + 1);
            setLastCompletedDate(today);
        }

        // Reset daily goals
        setGoals(goals.map(g => g.type === "daily" ? { ...g, current: 0 } : g));
    };

    const badges: Badge[] = badgeDefinitions.map(b => ({
        ...b,
        unlocked: bestStreak >= b.requirement
    }));

    const totalProgress = goals.reduce((sum, g) => sum + g.current, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const progressPercent = Math.round((totalProgress / totalTarget) * 100);
    const allDailyComplete = goals.filter(g => g.type === "daily").every(g => g.current >= g.target);

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <button
                    onClick={completeDay}
                    disabled={!allDailyComplete}
                    className="btn-primary disabled:opacity-40"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Day
                </button>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Engagement Scorecard</h1>
                        <p className="text-[var(--foreground-secondary)]">Track your daily X activity</p>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-10">
                <div className="card p-5 text-center">
                    <Flame className="w-7 h-7 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-500">{streak}</div>
                    <p className="text-[var(--foreground-muted)] text-xs">Current Streak</p>
                </div>
                <div className="card p-5 text-center">
                    <Target className="w-7 h-7 text-[var(--accent)] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{progressPercent}%</div>
                    <p className="text-[var(--foreground-muted)] text-xs">Today</p>
                </div>
                <div className="card p-5 text-center">
                    <TrendingUp className="w-7 h-7 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-500">{bestStreak}</div>
                    <p className="text-[var(--foreground-muted)] text-xs">Best Streak</p>
                </div>
                <div className="card p-5 text-center">
                    <Calendar className="w-7 h-7 text-[var(--accent-secondary)] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[var(--accent-secondary)]">{totalDaysCompleted}</div>
                    <p className="text-[var(--foreground-muted)] text-xs">Total Days</p>
                </div>
            </div>

            {/* Badges Section */}
            <section className="mb-10">
                <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Badges
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {badges.map(badge => {
                        const Icon = IconMap[badge.icon];
                        return (
                            <div
                                key={badge.id}
                                className={`flex-shrink-0 w-24 p-4 rounded-xl text-center transition-all ${badge.unlocked
                                    ? 'bg-gradient-to-b from-[var(--accent)]/20 to-transparent border border-[var(--accent)]/30'
                                    : 'bg-[var(--background-card)] border border-[var(--border)] opacity-40'
                                    }`}
                            >
                                <Icon className={`w-8 h-8 mx-auto mb-2 ${badge.unlocked ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`} />
                                <p className={`text-xs font-semibold ${badge.unlocked ? 'text-white' : 'text-[var(--foreground-muted)]'}`}>
                                    {badge.name}
                                </p>
                                <p className="text-[10px] text-[var(--foreground-muted)]">{badge.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Goals */}
            <section className="space-y-4">
                <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Today's Goals</h2>
                {goals.map(goal => {
                    const isComplete = goal.current >= goal.target;
                    return (
                        <div key={goal.id} className={`card p-5 ${isComplete ? 'border-green-500/50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {isComplete ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-[var(--foreground-muted)]" />
                                    )}
                                    <div>
                                        <p className={`font-semibold ${isComplete ? 'text-green-400' : 'text-white'}`}>
                                            {goal.label}
                                        </p>
                                        <p className="text-xs text-[var(--foreground-muted)] uppercase">{goal.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => decrementGoal(goal.id)}
                                        className="w-8 h-8 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] flex items-center justify-center font-semibold hover:border-[var(--border-hover)]"
                                    >
                                        -
                                    </button>
                                    <span className="text-lg font-bold text-white w-16 text-center">
                                        {goal.current}/{goal.target}
                                    </span>
                                    <button
                                        onClick={() => incrementGoal(goal.id)}
                                        className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 h-2 rounded-full bg-[var(--background-card)] overflow-hidden">
                                <div
                                    className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-[var(--accent)]'}`}
                                    style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Celebration */}
            {allDailyComplete && (
                <div className="card p-8 mt-10 text-center bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-white" />
                    <h2 className="text-2xl font-bold text-white mb-2">Daily Goals Complete!</h2>
                    <p className="text-white/80 mb-4">Click "Complete Day" to log your streak.</p>
                </div>
            )}
        </div>
    );
}
