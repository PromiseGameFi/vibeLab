import Link from "next/link";
import {
    MessageSquare,
    Calendar,
    Archive,
    Users,
    Trophy,
    Bot,
    ArrowRight,
    Zap
} from "lucide-react";

const features = [
    {
        id: "thread-studio",
        name: "Thread Studio",
        description: "AI-powered thread builder with viral hooks and cliffhangers.",
        icon: MessageSquare
    },
    {
        id: "planner",
        name: "Posting Planner",
        description: "Visual calendar with best-time recommendations.",
        icon: Calendar
    },
    {
        id: "vault",
        name: "Evergreen Vault",
        description: "Recycle your best content with AI freshness updates.",
        icon: Archive
    },
    {
        id: "profiles",
        name: "Personality Profiles",
        description: "Switch voice presets for multi-account management.",
        icon: Users
    },
    {
        id: "scorecard",
        name: "Engagement Scorecard",
        description: "Gamified daily goals, streaks, and badges.",
        icon: Trophy
    },
    {
        id: "agent",
        name: "Browser Agent",
        description: "Automated engagement scripts for your browser.",
        icon: Bot
    }
];

export default function VibeMarketPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="badge badge-accent mb-6">
                        <Zap className="w-3 h-3" />
                        X-First SMM Tool
                    </span>

                    <h1 className="hero-title text-white mb-6">
                        Vibe<em>Market</em>
                    </h1>
                    <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-12">
                        The SMM replacement for X. <span className="text-white">No API needed.</span> Build threads, plan posts, and automate engagement.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link href="/vibeMarket/thread-studio" className="btn-primary">
                            Start Creating
                        </Link>
                        <Link href="/" className="btn-secondary">
                            Back to Manual
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="section-title text-white mb-4">Your X Command Center</h2>
                        <p className="text-[var(--foreground-secondary)]">
                            Everything you need to grow on X, without the bloat.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <Link
                                key={feature.id}
                                href={`/vibeMarket/${feature.id}`}
                                className="card card-interactive p-6 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-10 flex items-center justify-center mb-5 group-hover:bg-opacity-20 transition-all">
                                    <feature.icon className="w-6 h-6 text-[var(--accent)]" />
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">
                                    {feature.name}
                                </h3>
                                <p className="text-[var(--foreground-secondary)] text-sm mb-4">
                                    {feature.description}
                                </p>

                                <span className="btn-ghost text-sm">
                                    Learn more <ArrowRight className="w-3 h-3" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-12 text-center">
                        <h2 className="section-title text-white mb-12">Why VibeMarket?</h2>
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <div className="text-4xl font-bold text-[var(--accent)] mb-2">0</div>
                                <p className="text-[var(--foreground-secondary)] text-sm">API Keys Required</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">100%</div>
                                <p className="text-[var(--foreground-secondary)] text-sm">X-Native Focus</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-[var(--accent-secondary)] mb-2">∞</div>
                                <p className="text-[var(--foreground-secondary)] text-sm">Threads & Profiles</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
