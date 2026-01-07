"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Trash2
} from "lucide-react";

interface ScheduledPost {
    id: string;
    content: string;
    date: string;
    time: string;
}

const bestTimes = [
    { time: "8:00 AM", score: 85, label: "Morning Scroll" },
    { time: "12:00 PM", score: 92, label: "Lunch Break Peak" },
    { time: "5:00 PM", score: 88, label: "End of Workday" },
    { time: "9:00 PM", score: 78, label: "Evening Wind Down" }
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    return (
        <div className="max-w-6xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)] bg-opacity-10 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Posting Planner</h1>
                        <p className="text-[var(--foreground-secondary)] text-sm">Visual calendar with best-time recommendations</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <div className="vibe-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-[var(--foreground)]">{currentMonth}</h2>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)]">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)]">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {daysOfWeek.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-[var(--foreground-secondary)] uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day, i) => {
                                const dateStr = day ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                                const hasPost = posts.some(p => p.date === dateStr);
                                const isToday = day === today.getDate();

                                return (
                                    <button
                                        key={i}
                                        onClick={() => day && setSelectedDate(dateStr)}
                                        disabled={!day}
                                        className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                      ${!day ? 'opacity-0 pointer-events-none' : ''}
                      ${isToday ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--background-secondary)] hover:bg-[var(--border)] text-[var(--foreground)]'}
                      ${selectedDate === dateStr ? 'ring-2 ring-[var(--accent-secondary)]' : ''}
                    `}
                                    >
                                        {day}
                                        {hasPost && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)] mt-1"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Best Times */}
                    <div className="vibe-card p-5">
                        <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                            Best Times to Post
                        </h3>
                        <div className="space-y-3">
                            {bestTimes.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTime(slot.time.replace(' AM', ':00').replace(' PM', ':00').replace('12:00:00', '12:00'))}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                        <span className="text-sm font-medium text-[var(--foreground)]">{slot.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--accent-primary)]"
                                                style={{ width: `${slot.score}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-[var(--foreground-secondary)]">{slot.score}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="vibe-card p-5">
                        <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-4">
                            Quick Schedule
                        </h3>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What do you want to post?"
                            className="vibe-input w-full resize-none min-h-[100px] mb-4"
                        />
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="vibe-input flex-1"
                            />
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="vibe-input flex-1"
                            />
                        </div>
                        <button
                            onClick={addPost}
                            disabled={!newPost.trim()}
                            className="vibe-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Schedule Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Scheduled Posts */}
            {posts.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Scheduled Queue ({posts.length})</h2>
                    <div className="space-y-4">
                        {posts.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()).map(post => (
                            <div key={post.id} className="vibe-card p-5 flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-[var(--foreground)] mb-2">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-[var(--foreground-secondary)]">
                                        <span>{new Date(post.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        <span>{post.time}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removePost(post.id)}
                                    className="p-2 rounded-lg text-[var(--foreground-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
