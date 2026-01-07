"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Trophy,
    Flame,
    Target,
    CheckCircle2,
    Circle,
    Plus,
    Sparkles
} from "lucide-react";

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
        const allDailyComplete = goals.filter(g => g.type === "daily").every(g => g.current >= g.target);
        if (allDailyComplete) {
            setStreak(streak + 1);
        }
        setGoals(goals.map(g => g.type === "daily" ? { ...g, current: 0 } : g));
    };

    const totalProgress = goals.reduce((sum, g) => sum + g.current, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const progressPercent = Math.round((totalProgress / totalTarget) * 100);

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
                    onClick={resetDaily}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
                >
                    Reset Daily Goals
                </button>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Engagement Scorecard</h1>
                        <p className="text-white/40 text-sm">Gamified daily goals and streaks</p>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-12">
                <div className="vibe-glass rounded-3xl p-6 border border-white/5 text-center">
                    <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-4xl font-black text-orange-500">{streak}</div>
                    <p className="text-white/40 text-sm">Day Streak</p>
                </div>
                <div className="vibe-glass rounded-3xl p-6 border border-white/5 text-center">
                    <Target className="w-8 h-8 text-accent-secondary mx-auto mb-2" />
                    <div className="text-4xl font-black">{progressPercent}%</div>
                    <p className="text-white/40 text-sm">Today's Progress</p>
                </div>
                <div className="vibe-glass rounded-3xl p-6 border border-white/5 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-4xl font-black text-green-500">{goals.filter(g => g.current >= g.target).length}</div>
                    <p className="text-white/40 text-sm">Goals Complete</p>
                </div>
            </div>

            {/* Goals */}
            <section>
                <h2 className="text-xl font-bold mb-6">Today's Goals</h2>
                <div className="space-y-4">
                    {goals.map(goal => {
                        const isComplete = goal.current >= goal.target;
                        return (
                            <div
                                key={goal.id}
                                className={`p-6 rounded-2xl border transition-all ${isComplete
                                        ? 'bg-green-500/5 border-green-500/20'
                                        : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {isComplete ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-white/20" />
                                        )}
                                        <div>
                                            <p className={`font-bold ${isComplete ? 'text-green-500' : 'text-white'}`}>
                                                {goal.label}
                                            </p>
                                            <p className="text-xs text-white/40 uppercase">{goal.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => decrementGoal(goal.id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                -
                                            </button>
                                            <span className="text-xl font-bold w-16 text-center">
                                                {goal.current}/{goal.target}
                                            </span>
                                            <button
                                                onClick={() => incrementGoal(goal.id)}
                                                className="w-8 h-8 rounded-lg bg-accent-secondary/20 text-accent-secondary hover:bg-accent-secondary hover:text-white transition-all flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-accent-secondary'}`}
                                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Motivation */}
            {progressPercent >= 100 && (
                <section className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-white/10 text-center">
                    <Sparkles className="w-12 h-12 text-accent-secondary mx-auto mb-4" />
                    <h2 className="text-2xl font-black mb-2">🎉 All Goals Complete!</h2>
                    <p className="text-white/60">You're on fire! Keep the streak going.</p>
                </section>
            )}
        </div>
    );
}
