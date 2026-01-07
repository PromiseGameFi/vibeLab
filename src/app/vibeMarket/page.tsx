import Link from "next/link";
import {
    MessageSquare,
    Calendar,
    Archive,
    Users,
    Trophy,
    Bot,
    Zap,
    ArrowRight,
    Sparkles
} from "lucide-react";

const features = [
    {
        id: "thread-studio",
        name: "Thread Studio",
        description: "AI-powered thread builder with viral hooks and cliffhangers.",
        icon: MessageSquare,
        color: "primary"
    },
    {
        id: "planner",
        name: "Posting Planner",
        description: "Visual calendar with best-time recommendations.",
        icon: Calendar,
        color: "secondary"
    },
    {
        id: "vault",
        name: "Evergreen Vault",
        description: "Recycle your best content with AI freshness updates.",
        icon: Archive,
        color: "primary"
    },
    {
        id: "profiles",
        name: "Personality Profiles",
        description: "Switch voice presets for multi-account management.",
        icon: Users,
        color: "secondary"
    },
    {
        id: "scorecard",
        name: "Engagement Scorecard",
        description: "Gamified daily goals, streaks, and badges.",
        icon: Trophy,
        color: "primary"
    },
    {
        id: "agent",
        name: "Browser Agent",
        description: "Automated engagement scripts for your browser.",
        icon: Bot,
        color: "secondary"
    }
];

export default function VibeMarketPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 pb-24">
            {/* Hero Section */}
            <section className="pt-16 pb-20 text-center relative">
                <div className="vibe-hero absolute inset-0 -z-10 opacity-60"></div>

                <div className="vibe-badge-primary mb-6 mx-auto">
                    <Zap className="w-3 h-3 mr-1" />
                    X-FIRST SMM TOOL
                </div>

                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-[var(--foreground)]">
                    Vibe<span className="text-gradient">Market</span>
                </h1>
                <p className="text-[var(--foreground-secondary)] text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    The SMM replacement for X. <span className="font-semibold text-[var(--foreground)]">No API needed.</span> Build threads, plan posts, and automate engagement.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="/vibeMarket/thread-studio"
                        className="vibe-btn-primary flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Start Creating
                    </Link>
                    <Link
                        href="/"
                        className="vibe-btn-secondary flex items-center gap-2"
                    >
                        Back to Manual
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Your X Command Center</h2>
                    <p className="text-[var(--foreground-secondary)]">Everything you need to grow on X, without the bloat.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature) => (
                        <Link
                            key={feature.id}
                            href={`/vibeMarket/${feature.id}`}
                            className="group vibe-card p-6"
                        >
                            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-5
                ${feature.color === 'primary'
                                    ? 'bg-[var(--accent-primary)] bg-opacity-10'
                                    : 'bg-[var(--accent-secondary)] bg-opacity-10'
                                }
              `}>
                                <feature.icon className={`w-6 h-6 ${feature.color === 'primary'
                                        ? 'text-[var(--accent-primary)]'
                                        : 'text-[var(--accent-secondary)]'
                                    }`} />
                            </div>

                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                {feature.name}
                            </h3>
                            <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Value Proposition */}
            <section className="vibe-card p-10 text-center">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-8">Why VibeMarket?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="text-4xl font-black text-[var(--accent-primary)] mb-2">0</div>
                        <p className="text-[var(--foreground-secondary)] text-sm">API Keys Required</p>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-[var(--accent-secondary)] mb-2">100%</div>
                        <p className="text-[var(--foreground-secondary)] text-sm">X-Native Focus</p>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-[var(--foreground)] mb-2">∞</div>
                        <p className="text-[var(--foreground-secondary)] text-sm">Threads & Profiles</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
