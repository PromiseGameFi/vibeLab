import Link from "next/link";
import {
    MessageSquare,
    Calendar,
    Archive,
    Users,
    Trophy,
    Bot,
    ArrowRight,
    Zap,
    Rocket,
    TrendingUp,
    TrendingDown,
    Palette,
    Calculator,
    Wand2,
    DollarSign
} from "lucide-react";

const tokenTools = [
    {
        id: "token-calc",
        name: "Token Cost Calculator",
        description: "Compare costs across GPT-4, Claude, Gemini, and more. Find the cheapest option.",
        icon: Calculator,
        color: "#22c55e",
        badge: "Save Money"
    },
    {
        id: "prompt-optimizer",
        name: "Prompt Optimizer",
        description: "Compress verbose prompts. Remove filler words. Save up to 40% on tokens.",
        icon: Wand2,
        color: "#a855f7",
        badge: "Popular"
    }
];

const smmTools = [
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

const strategyTools = [
    {
        id: "gtm",
        name: "GTM Strategy Generator",
        description: "Generate a complete go-to-market strategy for your product launch.",
        icon: Rocket,
        color: "var(--accent)"
    },
    {
        id: "templates",
        name: "Strategy Templates",
        description: "Pre-built marketing playbooks for SaaS, Creator, E-commerce, and more.",
        icon: TrendingUp,
        color: "var(--accent-secondary)"
    },
    {
        id: "builder",
        name: "Custom Builder",
        description: "Create a personalized strategy based on your brand sentiment.",
        icon: Palette,
        color: "#ec4899"
    }
];

export default function VibeMarketPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="badge badge-accent mb-6">
                        <DollarSign className="w-3 h-3" />
                        Save on AI Costs
                    </span>

                    <h1 className="hero-title text-white mb-6">
                        Vibe<em>Market</em>
                    </h1>
                    <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-12">
                        Cut your AI costs by up to <span className="text-green-400 font-semibold">40%</span>. Token calculators, prompt optimizers, and marketing tools in one place.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link href="/vibeMarket/token-calc" className="btn-primary">
                            <Calculator className="w-4 h-4" />
                            Calculate Token Costs
                        </Link>
                        <Link href="/vibeMarket/prompt-optimizer" className="btn-secondary">
                            <Wand2 className="w-4 h-4" />
                            Optimize Prompts
                        </Link>
                    </div>
                </div>
            </section>

            {/* Token Tools - NEW PRIORITY SECTION */}
            <section className="py-16 px-6 bg-gradient-to-b from-green-500/5 to-transparent border-t border-green-500/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge bg-green-500/20 text-green-400 border-green-500/30 mb-4">
                            <TrendingDown className="w-3 h-3" />
                            Save Tokens
                        </span>
                        <h2 className="section-title text-white mb-4">Token Cost Tools</h2>
                        <p className="text-[var(--foreground-secondary)]">
                            Stop overpaying for AI. Optimize prompts and compare provider costs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {tokenTools.map((tool) => (
                            <Link
                                key={tool.id}
                                href={`/vibeMarket/${tool.id}`}
                                className="card card-interactive p-8 group border-2 hover:border-green-500/50"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: `${tool.color}20` }}
                                    >
                                        <tool.icon className="w-7 h-7" style={{ color: tool.color }} />
                                    </div>
                                    <span className="badge text-xs" style={{ backgroundColor: `${tool.color}20`, color: tool.color }}>
                                        {tool.badge}
                                    </span>
                                </div>

                                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                                    {tool.name}
                                </h3>
                                <p className="text-[var(--foreground-secondary)] text-sm mb-4">
                                    {tool.description}
                                </p>

                                <span className="btn-ghost text-green-400">
                                    Try Now <ArrowRight className="w-4 h-4" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Strategy Tools - NEW */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="badge mb-4">New</span>
                        <h2 className="section-title text-white mb-4">Marketing Strategy</h2>
                        <p className="text-[var(--foreground-secondary)]">
                            Generate custom marketing strategies tailored to your product and goals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {strategyTools.map((tool) => (
                            <Link
                                key={tool.id}
                                href={`/vibeMarket/${tool.id}`}
                                className="card card-interactive p-8 group text-center"
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: `${tool.color}20` }}
                                >
                                    <tool.icon className="w-8 h-8" style={{ color: tool.color }} />
                                </div>

                                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[var(--accent)] transition-colors">
                                    {tool.name}
                                </h3>
                                <p className="text-[var(--foreground-secondary)] text-sm mb-6">
                                    {tool.description}
                                </p>

                                <span className="btn-ghost">
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* SMM Tools */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="section-title text-white mb-4">SMM Toolkit</h2>
                        <p className="text-[var(--foreground-secondary)]">
                            Your X command center. No API required.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {smmTools.map((feature) => (
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
                                    Open <ArrowRight className="w-3 h-3" />
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
                                <p className="text-[var(--foreground-secondary)] text-sm">Strategies & Threads</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
