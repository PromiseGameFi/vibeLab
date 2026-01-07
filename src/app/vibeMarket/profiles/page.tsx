"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Users, Plus, Trash2, Check, Smile, Hash, MessageSquare,
    Copy, Sparkles, ChevronRight
} from "lucide-react";

interface Profile {
    id: string;
    name: string;
    tone: string;
    emojiStyle: "none" | "minimal" | "heavy";
    examples: string[];
}

const toneOptions = [
    { value: "Professional", description: "Clean, authoritative, data-driven" },
    { value: "Casual", description: "Friendly, conversational, relatable" },
    { value: "Witty", description: "Sharp, clever, punchy one-liners" },
    { value: "Inspirational", description: "Uplifting, motivational, story-driven" },
    { value: "Technical", description: "Precise, detailed, educational" },
    { value: "Sarcastic", description: "Dry humor, ironic observations" }
];

const emojiStyleDescriptions = {
    none: "No emojis. Text only.",
    minimal: "1-2 strategic emojis per post.",
    heavy: "Emojis throughout for energy."
};

const exampleOutputs: Record<string, Record<string, string>> = {
    Professional: {
        none: "Key insight from q4 analysis: companies that shipped weekly outperformed by 3.2x. Speed compounds.",
        minimal: "Key insight from Q4 analysis: companies that shipped weekly outperformed by 3.2x. Speed compounds. 📈",
        heavy: "📊 Key insight from Q4 analysis: companies that shipped weekly outperformed by 3.2x 🚀 Speed compounds ✨"
    },
    Casual: {
        none: "honestly been shipping so much lately that I forgot what weekends feel like. no regrets though.",
        minimal: "honestly been shipping so much lately that I forgot what weekends feel like 😅 no regrets though",
        heavy: "honestly been shipping so much lately 🔥 that I forgot what weekends feel like 😅💀 no regrets though 🙌"
    },
    Witty: {
        none: "My code works. I have no idea why. Classic Tuesday.",
        minimal: "My code works. I have no idea why. Classic Tuesday. 🤷‍♂️",
        heavy: "My code works 🤯 I have no idea why 💀 Classic Tuesday 😂🔥"
    },
    Inspirational: {
        none: "Every expert was once a beginner. Start before you're ready.",
        minimal: "Every expert was once a beginner. Start before you're ready. ✨",
        heavy: "✨ Every expert was once a beginner 🌱 Start before you're ready 🚀💪"
    },
    Technical: {
        none: "TIL: React 19 compiler eliminates 80% of useMemo calls. Performance wins without the boilerplate.",
        minimal: "TIL: React 19 compiler eliminates 80% of useMemo calls. Performance wins without the boilerplate. 🧵",
        heavy: "⚡ TIL: React 19 compiler eliminates 80% of useMemo calls 🔥 Performance wins without the boilerplate 💻✨"
    },
    Sarcastic: {
        none: "\"Just use AI\" they said. \"It'll be easy\" they said. Three prompt iterations later, I am become bug, destroyer of prod.",
        minimal: "\"Just use AI\" they said. \"It'll be easy\" they said. Three prompt iterations later... 💀",
        heavy: "\"Just use AI\" they said 🤖 \"It'll be easy\" they said 🙃 Three prompt iterations later 💀😭🔥"
    }
};

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeProfile, setActiveProfile] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [newProfile, setNewProfile] = useState<Partial<Profile>>({
        name: "",
        tone: "Casual",
        emojiStyle: "minimal"
    });

    useEffect(() => {
        const saved = localStorage.getItem("vibemarket-profiles-v2");
        if (saved) {
            const parsed = JSON.parse(saved);
            setProfiles(parsed);
            if (parsed.length > 0) setActiveProfile(parsed[0].id);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("vibemarket-profiles-v2", JSON.stringify(profiles));
    }, [profiles]);

    const generateSystemPrompt = (profile: Profile) => {
        const emojiInstruction = {
            none: "Do not use any emojis.",
            minimal: "Use 1-2 emojis strategically per post, typically at the end.",
            heavy: "Use emojis liberally throughout to add energy and visual interest."
        };

        return `You are writing social media content for X (Twitter).

VOICE PROFILE: "${profile.name}"
TONE: ${profile.tone}
EMOJI STYLE: ${emojiInstruction[profile.emojiStyle]}

WRITING GUIDELINES:
- Match the ${profile.tone.toLowerCase()} tone consistently
- Keep tweets under 280 characters
- ${profile.tone === "Professional" ? "Use data and insights to back up claims" : ""}
- ${profile.tone === "Casual" ? "Write like you're texting a friend" : ""}
- ${profile.tone === "Witty" ? "Lead with a surprising take or clever observation" : ""}
- ${profile.tone === "Inspirational" ? "Use storytelling and universal truths" : ""}
- ${profile.tone === "Technical" ? "Be precise and educational, share concrete learnings" : ""}
- ${profile.tone === "Sarcastic" ? "Use irony and dry humor, don't be mean-spirited" : ""}

EXAMPLE OUTPUT:
"${exampleOutputs[profile.tone]?.[profile.emojiStyle] || ""}"`;
    };

    const createProfile = () => {
        if (!newProfile.name?.trim()) return;
        const profile: Profile = {
            id: Date.now().toString(),
            name: newProfile.name,
            tone: newProfile.tone || "Casual",
            emojiStyle: newProfile.emojiStyle || "minimal",
            examples: []
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

    const copyPrompt = (profile: Profile) => {
        navigator.clipboard.writeText(generateSystemPrompt(profile));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const active = profiles.find(p => p.id === activeProfile);

    return (
        <div className="max-w-5xl mx-auto px-6 pb-24">
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
                        <Users className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Personality Profiles</h1>
                        <p className="text-[var(--foreground-secondary)]">Create AI-ready voice presets for your content</p>
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
                                        <p className="text-xs text-[var(--foreground-muted)]">{profile.tone} · {profile.emojiStyle}</p>
                                    </div>
                                    {activeProfile === profile.id ? (
                                        <Check className="w-4 h-4 text-[var(--accent-secondary)]" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
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
                                    <label className="text-sm text-[var(--foreground-muted)] mb-2 block">Profile Name</label>
                                    <input
                                        type="text"
                                        value={newProfile.name}
                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                        placeholder="Personal Brand, Side Project..."
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-[var(--foreground-muted)] mb-3 block">Tone</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {toneOptions.map(tone => (
                                            <button
                                                key={tone.value}
                                                onClick={() => setNewProfile({ ...newProfile, tone: tone.value })}
                                                className={`p-3 rounded-xl text-left transition-all ${newProfile.tone === tone.value
                                                        ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                                                        : 'bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                                    }`}
                                            >
                                                <p className="text-sm font-semibold text-white">{tone.value}</p>
                                                <p className="text-xs text-[var(--foreground-muted)]">{tone.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-[var(--foreground-muted)] mb-3 block">Emoji Style</label>
                                    <div className="flex gap-2">
                                        {(["none", "minimal", "heavy"] as const).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setNewProfile({ ...newProfile, emojiStyle: style })}
                                                className={`flex-1 p-3 rounded-xl text-center transition-all ${newProfile.emojiStyle === style
                                                        ? 'bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/30'
                                                        : 'bg-[var(--background-card)] border border-[var(--border)]'
                                                    }`}
                                            >
                                                <Smile className={`w-5 h-5 mx-auto mb-1 ${newProfile.emojiStyle === style ? 'text-[var(--accent-secondary)]' : 'text-[var(--foreground-muted)]'}`} />
                                                <p className="text-xs font-medium text-white capitalize">{style}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button onClick={() => setIsCreating(false)} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createProfile}
                                        disabled={!newProfile.name?.trim()}
                                        className="btn-primary flex-1 disabled:opacity-40"
                                    >
                                        Create Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : active ? (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-white">{active.name}</h2>
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
                                        <p className="text-sm font-semibold text-white capitalize">{active.emojiStyle}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">Emoji Style</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                        <Hash className="w-5 h-5 text-[var(--foreground-muted)] mb-2" />
                                        <p className="text-sm font-semibold text-white">280</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">Max Length</p>
                                    </div>
                                </div>
                            </div>

                            {/* Example Output */}
                            <div className="card p-6">
                                <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                    Example Output
                                </h3>
                                <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                    <p className="text-white">
                                        {exampleOutputs[active.tone]?.[active.emojiStyle] || "No example available"}
                                    </p>
                                </div>
                            </div>

                            {/* System Prompt */}
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider">
                                        AI System Prompt
                                    </h3>
                                    <button
                                        onClick={() => copyPrompt(active)}
                                        className="btn-primary text-sm"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? "Copied!" : "Copy Prompt"}
                                    </button>
                                </div>
                                <pre className="p-4 rounded-xl bg-black/50 border border-[var(--border)] text-xs text-[var(--foreground-secondary)] font-mono whitespace-pre-wrap overflow-x-auto">
                                    {generateSystemPrompt(active)}
                                </pre>
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
