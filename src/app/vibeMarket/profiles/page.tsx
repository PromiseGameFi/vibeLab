"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Trash2, Check, Smile, Hash, MessageSquare } from "lucide-react";

interface Profile {
    id: string;
    name: string;
    tone: string;
    emojiStyle: "none" | "minimal" | "heavy";
}

const toneOptions = ["Professional", "Casual", "Witty", "Inspirational", "Technical", "Sarcastic"];

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeProfile, setActiveProfile] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newProfile, setNewProfile] = useState<Partial<Profile>>({
        name: "",
        tone: "Casual",
        emojiStyle: "minimal"
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
            emojiStyle: newProfile.emojiStyle || "minimal"
        };
        setProfiles([...profiles, profile]);
        setActiveProfile(profile.id);
        setIsCreating(false);
        setNewProfile({ name: "", tone: "Casual", emojiStyle: "minimal" });
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
                        <Users className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Personality Profiles</h1>
                        <p className="text-[var(--foreground-secondary)]">Voice presets for multi-account</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile List */}
                <div className="lg:col-span-1">
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider">Profiles</h3>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="p-2 rounded-full bg-[var(--accent-secondary)] text-white hover:opacity-90 transition-all"
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
                                            ? 'bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-white">{profile.name}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">{profile.tone}</p>
                                    </div>
                                    {activeProfile === profile.id && (
                                        <Check className="w-4 h-4 text-[var(--accent-secondary)]" />
                                    )}
                                </button>
                            ))}

                            {profiles.length === 0 && !isCreating && (
                                <p className="text-[var(--foreground-muted)] text-sm text-center py-4">No profiles yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2">
                    {isCreating ? (
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-white mb-6">Create Profile</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm text-[var(--foreground-muted)] mb-2 block">Name</label>
                                    <input
                                        type="text"
                                        value={newProfile.name}
                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                        placeholder="Personal Brand, Side Project..."
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-[var(--foreground-muted)] mb-2 block">Tone</label>
                                    <div className="flex flex-wrap gap-2">
                                        {toneOptions.map(tone => (
                                            <button
                                                key={tone}
                                                onClick={() => setNewProfile({ ...newProfile, tone })}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${newProfile.tone === tone
                                                        ? 'bg-[var(--accent)] text-white'
                                                        : 'bg-[var(--background-card)] text-[var(--foreground-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                                    }`}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-[var(--foreground-muted)] mb-2 block">Emoji Style</label>
                                    <div className="flex gap-2">
                                        {(["none", "minimal", "heavy"] as const).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setNewProfile({ ...newProfile, emojiStyle: style })}
                                                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${newProfile.emojiStyle === style
                                                        ? 'bg-[var(--accent-secondary)] text-white'
                                                        : 'bg-[var(--background-card)] text-[var(--foreground-secondary)] border border-[var(--border)]'
                                                    }`}
                                            >
                                                <Smile className="w-4 h-4" />
                                                {style.charAt(0).toUpperCase() + style.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setIsCreating(false)} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createProfile}
                                        disabled={!newProfile.name?.trim()}
                                        className="btn-primary flex-1 disabled:opacity-40"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : active ? (
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">{active.name}</h2>
                                <button
                                    onClick={() => deleteProfile(active.id)}
                                    className="p-2 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                    <MessageSquare className="w-5 h-5 text-[var(--foreground-muted)] mb-2" />
                                    <p className="text-sm font-semibold text-white">{active.tone}</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Tone</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                    <Smile className="w-5 h-5 text-[var(--foreground-muted)] mb-2" />
                                    <p className="text-sm font-semibold text-white">{active.emojiStyle}</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Emoji</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                    <Hash className="w-5 h-5 text-[var(--foreground-muted)] mb-2" />
                                    <p className="text-sm font-semibold text-white">280</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">Max Length</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-12 text-center text-[var(--foreground-muted)]">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Create a profile to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
