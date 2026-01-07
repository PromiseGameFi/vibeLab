"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Plus, Clock, Sparkles, Trash2 } from "lucide-react";

interface ScheduledPost {
    id: string;
    content: string;
    date: string;
    time: string;
}

const bestTimes = [
    { time: "8:00 AM", score: 85 },
    { time: "12:00 PM", score: 92 },
    { time: "5:00 PM", score: 88 },
    { time: "9:00 PM", score: 78 }
];

export default function PlannerPage() {
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [newPost, setNewPost] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState("12:00");

    const addPost = () => {
        if (!newPost.trim()) return;
        setPosts([...posts, {
            id: Date.now().toString(),
            content: newPost,
            date: selectedDate,
            time: selectedTime
        }]);
        setNewPost("");
    };

    const removePost = (id: string) => {
        setPosts(posts.filter(p => p.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-secondary)] bg-opacity-20 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Posting Planner</h1>
                        <p className="text-[var(--foreground-secondary)]">Visual calendar with best-time recommendations</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scheduler */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Add */}
                    <div className="card p-6">
                        <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Quick Schedule</h3>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What do you want to post?"
                            className="input resize-none min-h-[100px] mb-4"
                        />
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="input flex-1"
                            />
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="input flex-1"
                            />
                        </div>
                        <button
                            onClick={addPost}
                            disabled={!newPost.trim()}
                            className="btn-primary w-full disabled:opacity-40"
                        >
                            <Plus className="w-4 h-4" />
                            Schedule Post
                        </button>
                    </div>

                    {/* Queue */}
                    {posts.length > 0 && (
                        <div className="card p-6">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                                Queue ({posts.length})
                            </h3>
                            <div className="space-y-3">
                                {posts.map(post => (
                                    <div key={post.id} className="flex items-start justify-between p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                        <div className="flex-1">
                                            <p className="text-white mb-2">{post.content}</p>
                                            <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                                                <span>{new Date(post.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                <span>{post.time}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removePost(post.id)}
                                            className="p-2 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Best Times */}
                    <div className="card p-6">
                        <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            Best Times
                        </h3>
                        <div className="space-y-3">
                            {bestTimes.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTime(slot.time.replace(' AM', ':00').replace(' PM', ':00'))}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        <span className="text-sm text-white">{slot.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                                            <div className="h-full bg-[var(--accent)]" style={{ width: `${slot.score}%` }}></div>
                                        </div>
                                        <span className="text-xs text-[var(--foreground-muted)]">{slot.score}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
