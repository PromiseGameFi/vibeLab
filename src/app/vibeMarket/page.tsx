import Link from "next/link";
import {
    ArrowRight,
    Rocket,
    TrendingUp,
    Palette
} from "lucide-react";

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
                        <Rocket className="w-3 h-3" />
                        Marketing Tools
                    </span>

                    <h1 className="hero-title text-white mb-6">
                        Vibe<em>Market</em>
                    </h1>
                    <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-12">
                        Marketing strategy generators, SMM tools, and content templates for your next launch.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/vibeMarket/gtm" className="btn-primary w-full sm:w-auto">
                            <Rocket className="w-4 h-4" />
                            Generate GTM Strategy
                        </Link>
                        <Link href="/vibeMarket/templates" className="btn-secondary w-full sm:w-auto">
                            <TrendingUp className="w-4 h-4" />
                            Strategy Templates
                        </Link>
                    </div>
                </div>
            </section>

            {/* Token Tools section removed */}

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

            {/* SMM Tools section removed */}

            {/* Stats */}
            <section className="py-24 px-6 border-t border-[var(--border)]">
                <div className="max-w-4xl mx-auto">
                    <div className="card p-12 text-center">
                        <h2 className="section-title text-white mb-12">Why VibeMarket?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
