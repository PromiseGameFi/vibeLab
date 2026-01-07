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
        color: "accent-primary",
        status: "coming"
    },
    {
        id: "planner",
        name: "Posting Planner",
        description: "Visual calendar with best-time recommendations.",
        icon: Calendar,
        color: "accent-secondary",
        status: "coming"
    },
    {
        id: "vault",
        name: "Evergreen Vault",
        description: "Recycle your best content with AI freshness updates.",
        icon: Archive,
        color: "accent-primary",
        status: "coming"
    },
    {
        id: "profiles",
        name: "Personality Profiles",
        description: "Switch voice presets for multi-account management.",
        icon: Users,
        color: "accent-secondary",
        status: "coming"
    },
    {
        id: "scorecard",
        name: "Engagement Scorecard",
        description: "Gamified daily goals, streaks, and badges.",
        icon: Trophy,
        color: "accent-primary",
        status: "coming"
    },
    {
        id: "agent",
        name: "Browser Agent",
        description: "Automated engagement scripts for your browser.",
        icon: Bot,
        color: "accent-secondary",
        status: "coming"
    }
];

export default function VibeMarketPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 pb-24">
            {/* Hero Section */}
            <section className="pt-20 pb-24 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-secondary/5 blur-[150px] rounded-full -z-10"></div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-xs font-bold mb-8">
                    <Zap className="w-3 h-3" />
                    X-FIRST SMM TOOL
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                    VIBE<span className="text-gradient">MARKET</span>
                </h1>
                <p className="text-white/40 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
                    The SMM replacement for X. <span className="text-white/80">No API needed.</span> Build threads, plan posts, and automate engagement—all in one place.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="/vibeMarket/thread-studio"
                        className="px-8 py-4 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:bg-accent-secondary hover:text-white transition-all duration-300 shadow-[0_10px_40px_rgba(255,255,255,0.1)]"
                    >
                        <Sparkles className="w-4 h-4" />
                        Start Creating
                    </Link>
                    <Link
                        href="/"
                        className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Back to Manual
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="mb-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black mb-4">Your X Command Center</h2>
                    <p className="text-white/40 max-w-xl mx-auto">Everything you need to grow on X, without the bloat of traditional SMM tools.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <Link
                            key={feature.id}
                            href={`/vibeMarket/${feature.id}`}
                            className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-accent-secondary/30 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                            <div className={`w-12 h-12 rounded-2xl bg-${feature.color}/20 flex items-center justify-center text-${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-black mb-2 group-hover:text-accent-secondary transition-colors">{feature.name}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>

                            {feature.status === "coming" && (
                                <div className="absolute top-6 right-6 px-2 py-1 rounded-md bg-white/5 text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                    Soon
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Value Proposition */}
            <section className="vibe-glass rounded-[3rem] p-12 border border-white/5 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <h2 className="text-4xl font-black mb-6 relative z-10">Why VibeMarket?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-6">
                        <div className="text-4xl font-black text-accent-primary mb-2">0</div>
                        <p className="text-white/40 text-sm">API Keys Required</p>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-black text-accent-secondary mb-2">100%</div>
                        <p className="text-white/40 text-sm">X-Native Focus</p>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-black text-white mb-2">∞</div>
                        <p className="text-white/40 text-sm">Threads & Profiles</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
