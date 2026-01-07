"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Users,
    Plus,
    Trash2,
    Check,
    Smile,
    Hash,
    MessageSquare
} from "lucide-react";

interface Profile {
    id: string;
    name: string;
    tone: string;
    emojiStyle: "none" | "minimal" | "heavy";
    maxLength: number;
    tabooTopics: string[];
}

const toneOptions = ["Professional", "Casual", "Witty", "Inspirational", "Technical", "Sarcastic"];

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeProfile, setActiveProfile] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfile, setNewProfile] = useState<Partial<Profile>>({
        name: "",
        tone: "Casual",
        emojiStyle: "minimal",
        maxLength: 280,
        tabooTopics: []
    });

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-profiles");
        if (saved) {
            const parsed = JSON.parse(saved);
            setProfiles(parsed);
            if (parsed.length > 0) setActiveProfile(parsed[0].id);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-profiles", JSON.stringify(profiles));
    }, [profiles]);

    const createProfile = () => {
        if (!newProfile.name?.trim()) return;
        const profile: Profile = {
            id: Date.now().toString(),
            name: newProfile.name,
            tone: newProfile.tone || "Casual",
            emojiStyle: newProfile.emojiStyle || "minimal",
            maxLength: newProfile.maxLength || 280,
            tabooTopics: newProfile.tabooTopics || []
        };
        setProfiles([...profiles, profile]);
        setActiveProfile(profile.id);
        setIsCreating(false);
        setNewProfile({ name: "", tone: "Casual", emojiStyle: "minimal", maxLength: 280, tabooTopics: [] });
    };

    const deleteProfile = (id: string) => {
        setProfiles(profiles.filter(p => p.id !== id));
        if (activeProfile === id) {
            setActiveProfile(profiles.length > 1 ? profiles[0].id : null);
        }
    };

    const active = profiles.find(p => p.id === activeProfile);

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
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
                        <Users className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Personality Profiles</h1>
                        <p className="text-[var(--foreground-secondary)] text-sm">Switch voice presets for multi-account management</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile List */}
                <div className="lg:col-span-1">
                    <div className="vibe-card p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">Profiles</h3>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="p-2 rounded-lg bg-[var(--accent-secondary)] text-white hover:opacity-90 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {profiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => setActiveProfile(profile.id)}
                                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${activeProfile === profile.id
                                            ? 'bg-[var(--accent-secondary)] bg-opacity-10 border border-[var(--accent-secondary)] border-opacity-30'
                                            : 'bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-[var(--foreground)]">{profile.name}</p>
                                        <p className="text-xs text-[var(--foreground-secondary)]">{profile.tone}</p>
                                    </div>
                                    {activeProfile === profile.id && (
                                        <Check className="w-4 h-4 text-[var(--accent-secondary)]" />
                                    )}
                                </button>
                            ))}

                            {profiles.length === 0 && !isCreating && (
                                <p className="text-[var(--foreground-secondary)] text-sm text-center py-4">No profiles yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Editor */}
                <div className="lg:col-span-2">
                    {isCreating ? (
                        <div className="vibe-card p-6">
                            <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Create New Profile</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-[var(--foreground-secondary)] mb-2 block">Profile Name</label>
                                    <input
                                        type="text"
                                        value={newProfile.name}
                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                        placeholder="e.g., Personal Brand, Side Project"
                                        className="vibe-input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[var(--foreground-secondary)] mb-2 block">Tone</label>
                                    <div className="flex flex-wrap gap-2">
                                        {toneOptions.map(tone => (
                                            <button
                                                key={tone}
                                                onClick={() => setNewProfile({ ...newProfile, tone })}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${newProfile.tone === tone
                                                        ? 'bg-[var(--accent-primary)] text-white'
                                                        : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                    }`}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-[var(--foreground-secondary)] mb-2 block">Emoji Style</label>
                                    <div className="flex gap-2">
                                        {(["none", "minimal", "heavy"] as const).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setNewProfile({ ...newProfile, emojiStyle: style })}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${newProfile.emojiStyle === style
                                                        ? 'bg-[var(--accent-secondary)] text-white'
                                                        : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                    }`}
                                            >
                                                <Smile className="w-4 h-4" />
                                                {style.charAt(0).toUpperCase() + style.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="vibe-btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createProfile}
                                        disabled={!newProfile.name?.trim()}
                                        className="vibe-btn-primary flex-1 disabled:opacity-50"
                                    >
                                        Create Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : active ? (
                        <div className="vibe-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-[var(--foreground)]">{active.name}</h2>
                                <button
                                    onClick={() => deleteProfile(active.id)}
                                    className="p-2 rounded-lg text-[var(--foreground-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                    <MessageSquare className="w-5 h-5 text-[var(--foreground-secondary)] mb-2" />
                                    <p className="text-sm font-semibold text-[var(--foreground)]">{active.tone}</p>
                                    <p className="text-xs text-[var(--foreground-secondary)]">Tone</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                    <Smile className="w-5 h-5 text-[var(--foreground-secondary)] mb-2" />
                                    <p className="text-sm font-semibold text-[var(--foreground)]">{active.emojiStyle}</p>
                                    <p className="text-xs text-[var(--foreground-secondary)]">Emoji Style</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                    <Hash className="w-5 h-5 text-[var(--foreground-secondary)] mb-2" />
                                    <p className="text-sm font-semibold text-[var(--foreground)]">{active.maxLength}</p>
                                    <p className="text-xs text-[var(--foreground-secondary)]">Max Length</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="vibe-card p-6 text-center text-[var(--foreground-secondary)]">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Create a profile to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
