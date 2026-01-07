"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Calendar as CalendarIcon, Plus, Clock, Sparkles,
    Trash2, ChevronLeft, ChevronRight, Edit2, X
} from "lucide-react";

interface ScheduledPost {
    id: string;
    content: string;
    date: string;
    time: string;
}

const bestTimes = [
    { time: "08:00", label: "8 AM", score: 85, reason: "Morning scroll" },
    { time: "12:00", label: "12 PM", score: 92, reason: "Lunch break peak" },
    { time: "17:00", label: "5 PM", score: 88, reason: "End of workday" },
    { time: "21:00", label: "9 PM", score: 78, reason: "Evening wind-down" }
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlannerPage() {
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [newPost, setNewPost] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState("12:00");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [editingPost, setEditingPost] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-planner");
        if (saved) setPosts(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-planner", JSON.stringify(posts));
    }, [posts]);

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

    const updatePost = (id: string, content: string) => {
        setPosts(posts.map(p => p.id === id ? { ...p, content } : p));
        setEditingPost(null);
    };

    // Calendar calculations
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getPostsForDate = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return posts.filter(p => p.date === dateStr);
    };

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const sortedPosts = [...posts].sort((a, b) =>
        new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
    );

    return (
        <div className="max-w-6xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-secondary)] bg-opacity-20 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Posting Planner</h1>
                        <p className="text-[var(--foreground-secondary)]">Schedule and visualize your content calendar</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <div className="card p-6">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 rounded-lg bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                </button>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 rounded-lg bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                                >
                                    <ChevronRight className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                </button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {daysOfWeek.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day, i) => {
                                if (!day) return <div key={i} className="aspect-square" />;

                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayPosts = getPostsForDate(day);
                                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                const isSelected = selectedDate === dateStr;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`
                      aspect-square rounded-xl p-2 flex flex-col items-center justify-start gap-1 transition-all text-sm
                      ${isToday ? 'bg-[var(--accent)] text-white' : 'bg-[var(--background-card)] hover:bg-[var(--border)]'}
                      ${isSelected && !isToday ? 'ring-2 ring-[var(--accent-secondary)]' : ''}
                      border ${isSelected ? 'border-[var(--accent-secondary)]' : 'border-[var(--border)]'}
                    `}
                                    >
                                        <span className="font-medium">{day}</span>
                                        {dayPosts.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {dayPosts.slice(0, 3).map((_, idx) => (
                                                    <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />
                                                ))}
                                                {dayPosts.length > 3 && (
                                                    <span className="text-[10px] text-[var(--foreground-muted)]">+{dayPosts.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Queue */}
                    {posts.length > 0 && (
                        <div className="card p-6 mt-6">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                                Scheduled ({posts.length})
                            </h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {sortedPosts.map(post => (
                                    <div key={post.id} className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)] group">
                                        {editingPost === post.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    defaultValue={post.content}
                                                    className="input resize-none min-h-[60px]"
                                                    onBlur={(e) => updatePost(post.id, e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => setEditingPost(null)} className="btn-ghost text-sm">
                                                    <X className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-white mb-2">{post.content}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                                                        <span>{new Date(post.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        <span>{post.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setEditingPost(post.id)}
                                                            className="p-1.5 text-[var(--foreground-muted)] hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => removePost(post.id)}
                                                            className="p-1.5 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Best Times */}
                    <div className="card p-5">
                        <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            Best Posting Times
                        </h3>
                        <div className="space-y-2">
                            {bestTimes.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTime(slot.time)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedTime === slot.time
                                            ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        <div className="text-left">
                                            <span className="text-sm font-medium text-white">{slot.label}</span>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">{slot.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                                            <div className="h-full bg-[var(--accent)]" style={{ width: `${slot.score}%` }}></div>
                                        </div>
                                        <span className="text-xs text-[var(--accent)] font-medium">{slot.score}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="card p-5">
                        <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                            Schedule Post
                        </h3>
                        <p className="text-xs text-[var(--foreground-muted)] mb-3">
                            Selected: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}
                        </p>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What do you want to post?"
                            className="input resize-none min-h-[100px] mb-4"
                        />
                        <button
                            onClick={addPost}
                            disabled={!newPost.trim()}
                            className="btn-primary w-full disabled:opacity-40"
                        >
                            <Plus className="w-4 h-4" />
                            Add to Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
