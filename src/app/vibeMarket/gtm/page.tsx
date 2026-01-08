"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, Rocket, Target, Users, Megaphone, Calendar, TrendingUp,
    Copy, Check, Download, Sparkles, ChevronRight, Loader2, Wand2
} from "lucide-react";

interface GTMStrategy {
    positioning: string;
    icp: string;
    channels: string[];
    contentPlan: string[];
    timeline: { phase: string; weeks: string; actions: string[] }[];
    metrics: { name: string; target: string }[];
}

const channelOptions = [
    { id: "x", name: "X (Twitter)", icon: "𝕏" },
    { id: "linkedin", name: "LinkedIn", icon: "in" },
    { id: "youtube", name: "YouTube", icon: "▶" },
    { id: "newsletter", name: "Newsletter", icon: "📧" },
    { id: "blog", name: "Blog/SEO", icon: "📝" },
    { id: "paid", name: "Paid Ads", icon: "💰" },
    { id: "community", name: "Community", icon: "👥" },
    { id: "partnerships", name: "Partnerships", icon: "🤝" }
];

const industryOptions = [
    "SaaS / Software",
    "Developer Tools",
    "E-commerce",
    "Creator Economy",
    "Agency / Services",
    "Consumer App",
    "B2B Enterprise",
    "Open Source"
];

export default function GTMPage() {
    const [step, setStep] = useState(1);
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [industry, setIndustry] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [budget, setBudget] = useState<"bootstrap" | "funded" | "enterprise">("bootstrap");
    const [timeline, setTimeline] = useState<"sprint" | "quarter" | "year">("quarter");
    const [strategy, setStrategy] = useState<GTMStrategy | null>(null);
    const [copied, setCopied] = useState(false);

    // AI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const toggleChannel = (id: string) => {
        setSelectedChannels(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const generateWithAI = async () => {
        setIsGenerating(true);
        setAiError(null);

        const channelNames = selectedChannels.map(id =>
            channelOptions.find(c => c.id === id)?.name || id
        );

        try {
            const response = await fetch("/api/generate/gtm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    productDescription,
                    industry,
                    targetAudience,
                    channels: channelNames,
                    budget,
                    timeline
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to generate strategy");
            }

            setStrategy(result.data);
            setStep(4);
        } catch (error) {
            console.error("AI generation error:", error);
            setAiError(error instanceof Error ? error.message : "Failed to generate strategy");
            // Fallback to basic generation
            generateBasicStrategy();
        } finally {
            setIsGenerating(false);
        }
    };

    const generateBasicStrategy = () => {
        const channelNames = selectedChannels.map(id =>
            channelOptions.find(c => c.id === id)?.name || id
        );

        const generatedStrategy: GTMStrategy = {
            positioning: `${productName} is the ${industry.toLowerCase()} solution for ${targetAudience} who need ${productDescription.toLowerCase()}. Unlike alternatives, we focus on delivering immediate value with a ${budget === "bootstrap" ? "lean, organic" : budget === "funded" ? "balanced" : "full-scale"} approach.`,

            icp: `**Primary:** ${targetAudience}\n**Pain Points:** Struggling with outdated solutions, need for efficiency\n**Goals:** Save time, increase output, reduce costs\n**Triggers:** New project, team scale-up, budget refresh`,

            channels: channelNames,

            contentPlan: [
                `Launch announcement thread on ${channelNames[0] || "X"}`,
                `Problem-agitation post: "Why ${industry} is broken"`,
                `Solution reveal: "Introducing ${productName}"`,
                `Social proof: Early user testimonials`,
                `Educational content: How-to guides and tutorials`,
                `Comparison content: "${productName} vs alternatives"`,
                `Behind-the-scenes: Building in public updates`
            ],

            timeline: timeline === "sprint" ? [
                { phase: "Week 1: Soft Launch", weeks: "1", actions: ["Announce to network", "Collect early feedback", "Fix critical bugs"] },
                { phase: "Week 2: Public Launch", weeks: "2", actions: ["Launch thread/post", "Reach out to influencers", "Run promotion"] }
            ] : timeline === "quarter" ? [
                { phase: "Month 1: Foundation", weeks: "1-4", actions: ["Set up channels", "Create content backlog", "Build email list"] },
                { phase: "Month 2: Launch", weeks: "5-8", actions: ["Public announcement", "Press outreach", "Paid experiments"] },
                { phase: "Month 3: Growth", weeks: "9-12", actions: ["Optimize based on data", "Scale winning channels", "Community building"] }
            ] : [
                { phase: "Q1: Foundation", weeks: "1-12", actions: ["Brand identity", "Content strategy", "Channel setup"] },
                { phase: "Q2: Launch", weeks: "13-24", actions: ["Product launch", "PR campaign", "Paid acquisition"] },
                { phase: "Q3: Scale", weeks: "25-36", actions: ["Double down on winners", "Expand channels", "Hire"] },
                { phase: "Q4: Optimize", weeks: "37-52", actions: ["Retention focus", "Referral program", "Annual planning"] }
            ],

            metrics: [
                { name: "Website Visitors", target: budget === "bootstrap" ? "5k/mo" : budget === "funded" ? "25k/mo" : "100k/mo" },
                { name: "Signups/Leads", target: budget === "bootstrap" ? "500" : budget === "funded" ? "2,500" : "10,000" },
                { name: "Conversion Rate", target: "3-5%" },
                { name: "MRR", target: budget === "bootstrap" ? "$5k" : budget === "funded" ? "$25k" : "$100k" },
                { name: "CAC", target: budget === "bootstrap" ? "<$20" : budget === "funded" ? "<$50" : "<$100" },
                { name: "NPS", target: ">50" }
            ]
        };

        setStrategy(generatedStrategy);
        setStep(4);
    };

    const exportStrategy = () => {
        if (!strategy) return;

        let output = `# Go-To-Market Strategy: ${productName}\n\n`;
        output += `## Positioning\n${strategy.positioning}\n\n`;
        output += `## Ideal Customer Profile\n${strategy.icp}\n\n`;
        output += `## Channels\n${strategy.channels.map(c => `- ${c}`).join("\n")}\n\n`;
        output += `## Content Plan\n${strategy.contentPlan.map(c => `- ${c}`).join("\n")}\n\n`;
        output += `## Timeline\n`;
        strategy.timeline.forEach(t => {
            output += `### ${t.phase}\n${t.actions.map(a => `- ${a}`).join("\n")}\n\n`;
        });
        output += `## Success Metrics\n`;
        output += `| Metric | Target |\n|---|---|\n`;
        strategy.metrics.forEach(m => {
            output += `| ${m.name} | ${m.target} |\n`;
        });

        return output;
    };

    const copyStrategy = () => {
        const content = exportStrategy();
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadStrategy = () => {
        const content = exportStrategy();
        if (content) {
            const blob = new Blob([content], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${productName.toLowerCase().replace(/\s+/g, "-")}-gtm-strategy.md`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between py-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                    Step {step} of 4
                </div>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold text-white">Go-To-Market Strategy</h1>
                            <span className="badge badge-accent text-xs">AI Powered</span>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">Generate a custom launch strategy for your product</p>
                    </div>
                </div>
            </header>

            {/* Step 1: Product Info */}
            {step === 1 && (
                <div className="card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Tell us about your product</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Product Name *</label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., VibeLab"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">What does it do? *</label>
                            <textarea
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="e.g., Helps developers master AI tools and export coding skills..."
                                className="input resize-none min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-[var(--foreground-secondary)] mb-3 block">Industry</label>
                            <div className="flex flex-wrap gap-2">
                                {industryOptions.map(ind => (
                                    <button
                                        key={ind}
                                        onClick={() => setIndustry(ind)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${industry === ind
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                                            }`}
                                    >
                                        {ind}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Target Audience *</label>
                            <input
                                type="text"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                placeholder="e.g., Indie developers, startup founders, AI enthusiasts"
                                className="input"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!productName || !productDescription || !targetAudience}
                        className="btn-primary w-full mt-8 disabled:opacity-40"
                    >
                        Next: Choose Channels
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 2: Channels */}
            {step === 2 && (
                <div className="card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Select your marketing channels</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {channelOptions.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => toggleChannel(channel.id)}
                                className={`p-4 rounded-xl text-center transition-all ${selectedChannels.includes(channel.id)
                                    ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                                    : 'bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                    }`}
                            >
                                <div className="text-2xl mb-2">{channel.icon}</div>
                                <p className="text-sm font-medium text-white">{channel.name}</p>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={selectedChannels.length === 0}
                            className="btn-primary flex-1 disabled:opacity-40"
                        >
                            Next: Budget & Timeline
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Budget & Timeline */}
            {step === 3 && (
                <div className="card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Set your budget and timeline</h2>

                    <div className="space-y-8">
                        <div>
                            <label className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 block">Budget Range</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "bootstrap", label: "Bootstrap", range: "$0 - $1k", desc: "Organic, sweat equity" },
                                    { id: "funded", label: "Funded", range: "$1k - $10k", desc: "Mix of organic + paid" },
                                    { id: "enterprise", label: "Enterprise", range: "$10k+", desc: "Full-funnel campaigns" }
                                ].map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setBudget(b.id as any)}
                                        className={`p-4 rounded-xl text-left transition-all ${budget === b.id
                                            ? 'bg-[var(--accent-secondary)]/10 border-2 border-[var(--accent-secondary)]'
                                            : 'bg-[var(--background-card)] border border-[var(--border)]'
                                            }`}
                                    >
                                        <p className="font-semibold text-white">{b.label}</p>
                                        <p className="text-sm text-[var(--accent-secondary)]">{b.range}</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">{b.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4 block">Timeline</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "sprint", label: "Sprint", range: "2 weeks", desc: "Quick launch" },
                                    { id: "quarter", label: "Quarter", range: "3 months", desc: "Balanced approach" },
                                    { id: "year", label: "Annual", range: "12 months", desc: "Full strategy" }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTimeline(t.id as any)}
                                        className={`p-4 rounded-xl text-left transition-all ${timeline === t.id
                                            ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                                            : 'bg-[var(--background-card)] border border-[var(--border)]'
                                            }`}
                                    >
                                        <p className="font-semibold text-white">{t.label}</p>
                                        <p className="text-sm text-[var(--accent)]">{t.range}</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {aiError && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {aiError}
                        </div>
                    )}

                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                            Back
                        </button>
                        <button
                            onClick={generateWithAI}
                            disabled={isGenerating}
                            className="btn-primary flex-1 disabled:opacity-40"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Generate with AI
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && strategy && (
                <div className="space-y-6">
                    {/* Export Actions */}
                    <div className="card p-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-white">Your GTM Strategy</h3>
                            <p className="text-sm text-[var(--foreground-muted)]">For {productName}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={copyStrategy} className="btn-secondary">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                            <button onClick={downloadStrategy} className="btn-primary">
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Positioning */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-[var(--accent)]" />
                            <h3 className="font-semibold text-white">Positioning</h3>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">{strategy.positioning}</p>
                    </div>

                    {/* ICP */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-[var(--accent-secondary)]" />
                            <h3 className="font-semibold text-white">Ideal Customer Profile</h3>
                        </div>
                        <div className="text-[var(--foreground-secondary)] whitespace-pre-wrap">{strategy.icp}</div>
                    </div>

                    {/* Channels */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Megaphone className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-white">Marketing Channels</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {strategy.channels.map((channel, i) => (
                                <span key={i} className="badge">{channel}</span>
                            ))}
                        </div>
                    </div>

                    {/* Content Plan */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold text-white">Content Plan</h3>
                        </div>
                        <ul className="space-y-2">
                            {strategy.contentPlan.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                                    <span className="text-[var(--accent)] font-mono">{i + 1}.</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Timeline */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Rocket className="w-5 h-5 text-[var(--accent)]" />
                            <h3 className="font-semibold text-white">Launch Timeline</h3>
                        </div>
                        <div className="space-y-4">
                            {strategy.timeline.map((phase, i) => (
                                <div key={i} className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-white">{phase.phase}</h4>
                                        <span className="badge text-xs">Weeks {phase.weeks}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {phase.actions.map((action, j) => (
                                            <li key={j} className="text-sm text-[var(--foreground-secondary)]">• {action}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold text-white">Success Metrics</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {strategy.metrics.map((metric, i) => (
                                <div key={i} className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)] text-center">
                                    <p className="text-xl font-bold text-[var(--accent)]">{metric.target}</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">{metric.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Start Over */}
                    <button onClick={() => { setStep(1); setStrategy(null); }} className="btn-secondary w-full">
                        Generate Another Strategy
                    </button>
                </div>
            )}
        </div>
    );
}
