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
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Personality Profiles</h1>
                        <p className="text-white/40 text-sm">Switch voice presets for multi-account management</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile List */}
                <div className="lg:col-span-1">
                    <div className="vibe-glass rounded-3xl p-6 border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Profiles</h3>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="p-2 rounded-lg bg-accent-secondary/20 text-accent-secondary hover:bg-accent-secondary hover:text-white transition-all"
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
                                            ? 'bg-accent-secondary/20 border border-accent-secondary/30'
                                            : 'bg-white/[0.02] border border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <div>
                                        <p className="font-bold">{profile.name}</p>
                                        <p className="text-xs text-white/40">{profile.tone}</p>
                                    </div>
                                    {activeProfile === profile.id && (
                                        <Check className="w-4 h-4 text-accent-secondary" />
                                    )}
                                </button>
                            ))}

                            {profiles.length === 0 && !isCreating && (
                                <p className="text-white/20 text-sm text-center py-4">No profiles yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Editor */}
                <div className="lg:col-span-2">
                    {isCreating ? (
                        <div className="vibe-glass rounded-3xl p-8 border border-white/5">
                            <h2 className="text-xl font-bold mb-6">Create New Profile</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-white/40 mb-2 block">Profile Name</label>
                                    <input
                                        type="text"
                                        value={newProfile.name}
                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                        placeholder="e.g., Personal Brand, Side Project, Anonymous"
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-accent-secondary/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-white/40 mb-2 block">Tone</label>
                                    <div className="flex flex-wrap gap-2">
                                        {toneOptions.map(tone => (
                                            <button
                                                key={tone}
                                                onClick={() => setNewProfile({ ...newProfile, tone })}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${newProfile.tone === tone
                                                        ? 'bg-accent-primary text-white'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-white/40 mb-2 block">Emoji Style</label>
                                    <div className="flex gap-2">
                                        {(["none", "minimal", "heavy"] as const).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setNewProfile({ ...newProfile, emojiStyle: style })}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${newProfile.emojiStyle === style
                                                        ? 'bg-accent-secondary text-white'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
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
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createProfile}
                                        disabled={!newProfile.name?.trim()}
                                        className="flex-1 py-3 rounded-xl bg-accent-secondary text-white font-bold hover:bg-accent-secondary/80 transition-all disabled:opacity-50"
                                    >
                                        Create Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : active ? (
                        <div className="vibe-glass rounded-3xl p-8 border border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold">{active.name}</h2>
                                <button
                                    onClick={() => deleteProfile(active.id)}
                                    className="p-2 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <MessageSquare className="w-5 h-5 text-white/20 mb-2" />
                                    <p className="text-sm font-bold">{active.tone}</p>
                                    <p className="text-xs text-white/40">Tone</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <Smile className="w-5 h-5 text-white/20 mb-2" />
                                    <p className="text-sm font-bold">{active.emojiStyle}</p>
                                    <p className="text-xs text-white/40">Emoji Style</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <Hash className="w-5 h-5 text-white/20 mb-2" />
                                    <p className="text-sm font-bold">{active.maxLength}</p>
                                    <p className="text-xs text-white/40">Max Length</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="vibe-glass rounded-3xl p-8 border border-white/5 text-center text-white/20">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Create a profile to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
