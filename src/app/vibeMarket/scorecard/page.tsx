"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, Target, CheckCircle2, Circle, Sparkles } from "lucide-react";

interface Goal {
    id: string;
    label: string;
    target: number;
    current: number;
    type: "daily" | "weekly";
}

const defaultGoals: Goal[] = [
    { id: "1", label: "Tweets Posted", target: 3, current: 0, type: "daily" },
    { id: "2", label: "Replies Sent", target: 10, current: 0, type: "daily" },
    { id: "3", label: "Meaningful Convos", target: 5, current: 0, type: "daily" },
    { id: "4", label: "Threads Published", target: 2, current: 0, type: "weekly" }
];

export default function ScorecardPage() {
    const [goals, setGoals] = useState<Goal[]>(defaultGoals);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-scorecard");
        if (saved) {
            const parsed = JSON.parse(saved);
            setGoals(parsed.goals || defaultGoals);
            setStreak(parsed.streak || 0);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-scorecard", JSON.stringify({ goals, streak }));
    }, [goals, streak]);

    const incrementGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, current: Math.min(g.current + 1, g.target) } : g));
    };

    const decrementGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, current: Math.max(g.current - 1, 0) } : g));
    };

    const resetDaily = () => {
        const allComplete = goals.filter(g => g.type === "daily").every(g => g.current >= g.target);
        if (allComplete) setStreak(streak + 1);
        setGoals(goals.map(g => g.type === "daily" ? { ...g, current: 0 } : g));
    };

    const totalProgress = goals.reduce((sum, g) => sum + g.current, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const progressPercent = Math.round((totalProgress / totalTarget) * 100);

    return (
        <div className="max-w-3xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <button onClick={resetDaily} className="btn-secondary text-sm">
                    Reset Daily
                </button>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Engagement Scorecard</h1>
                        <p className="text-[var(--foreground-secondary)]">Gamified daily goals</p>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="card p-6 text-center">
                    <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-orange-500">{streak}</div>
                    <p className="text-[var(--foreground-secondary)] text-sm">Streak</p>
                </div>
                <div className="card p-6 text-center">
                    <Target className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white">{progressPercent}%</div>
                    <p className="text-[var(--foreground-secondary)] text-sm">Progress</p>
                </div>
                <div className="card p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-green-500">
                        {goals.filter(g => g.current >= g.target).length}
                    </div>
                    <p className="text-[var(--foreground-secondary)] text-sm">Complete</p>
                </div>
            </div>

            {/* Goals */}
            <section className="space-y-4">
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
            {progressPercent >= 100 && (
                <div className="card p-8 mt-10 text-center bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-white" />
                    <h2 className="text-2xl font-bold text-white mb-2">🎉 All Goals Complete!</h2>
                    <p className="text-white/80">Keep the streak going!</p>
                </div>
            )}
        </div>
    );
}
