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

    // Generate calendar days for current month
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
            <div className="flex items-center justify-between mb-12">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-secondary/20 flex items-center justify-center text-accent-secondary">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Posting Planner</h1>
                        <p className="text-white/40 text-sm">Visual calendar with best-time recommendations</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <div className="vibe-glass rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold">{currentMonth}</h2>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {daysOfWeek.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-white/30 uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
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
                      ${isToday ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'bg-white/[0.02] hover:bg-white/5'}
                      ${selectedDate === dateStr ? 'ring-2 ring-accent-secondary' : ''}
                    `}
                                    >
                                        {day}
                                        {hasPost && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary mt-1"></div>
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
                    <div className="vibe-glass rounded-3xl p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent-primary" />
                            Best Times to Post
                        </h3>
                        <div className="space-y-3">
                            {bestTimes.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTime(slot.time.replace(' AM', ':00').replace(' PM', ':00').replace('12:00:00', '12:00'))}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-white/20 group-hover:text-accent-secondary transition-colors" />
                                        <span className="text-sm font-medium">{slot.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full bg-accent-secondary"
                                                style={{ width: `${slot.score}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-white/40">{slot.score}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="vibe-glass rounded-3xl p-6 border border-white/5">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
                            Quick Schedule
                        </h3>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What do you want to post?"
                            className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm text-white placeholder:text-white/20 resize-none min-h-[100px] outline-none focus:border-accent-secondary/30 transition-colors mb-4"
                        />
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none"
                            />
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none"
                            />
                        </div>
                        <button
                            onClick={addPost}
                            disabled={!newPost.trim()}
                            className="w-full py-3 rounded-xl bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary font-bold text-sm hover:bg-accent-secondary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Schedule Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Scheduled Posts */}
            {posts.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold mb-6">Scheduled Queue ({posts.length})</h2>
                    <div className="space-y-4">
                        {posts.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()).map(post => (
                            <div key={post.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-white/80 mb-2">{post.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                        <span>{new Date(post.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        <span>{post.time}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removePost(post.id)}
                                    className="p-2 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
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
