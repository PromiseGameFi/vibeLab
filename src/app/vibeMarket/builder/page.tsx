"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, Copy, Check, Download, Sparkles, Palette,
    Target, Megaphone, DollarSign, Calendar
} from "lucide-react";

interface BuilderConfig {
    sentiment: string;
    goals: string[];
    channels: string[];
    budget: string;
    timeline: string;
}

const sentimentOptions = [
    { id: "professional", name: "Professional", desc: "Clean, authoritative, data-driven", example: "Our solution reduces churn by 47% in 30 days." },
    { id: "casual", name: "Casual", desc: "Friendly, conversational, relatable", example: "We get it. Marketing is hard. Let's fix that together." },
    { id: "bold", name: "Bold", desc: "Confident, provocative, memorable", example: "Forget everything you know about GTM." },
    { id: "minimal", name: "Minimal", desc: "Simple, focused, no fluff", example: "Build. Launch. Grow." },
    { id: "technical", name: "Technical", desc: "Precise, detailed, educational", example: "Our API handles 10k req/s at p99 <50ms." },
    { id: "friendly", name: "Friendly", desc: "Warm, supportive, encouraging", example: "You've got this! Let's build together." }
];

const goalOptions = [
    { id: "awareness", name: "Awareness", desc: "Brand recognition, reach" },
    { id: "leads", name: "Leads", desc: "Email signups, trials" },
    { id: "sales", name: "Sales", desc: "Conversions, revenue" },
    { id: "retention", name: "Retention", desc: "Churn reduction, NPS" },
    { id: "community", name: "Community", desc: "Engagement, members" }
];

const channelOptions = [
    { id: "x", name: "X / Twitter" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "youtube", name: "YouTube" },
    { id: "tiktok", name: "TikTok" },
    { id: "newsletter", name: "Newsletter" },
    { id: "blog", name: "Blog / SEO" },
    { id: "paid-social", name: "Paid Social" },
    { id: "paid-search", name: "Paid Search" },
    { id: "partnerships", name: "Partnerships" },
    { id: "community", name: "Community (Discord/Slack)" }
];

const budgetOptions = [
    { id: "bootstrap", name: "Bootstrap", range: "$0 - $1k/mo", desc: "Organic growth, sweat equity" },
    { id: "funded", name: "Funded", range: "$1k - $10k/mo", desc: "Mix of organic + paid" },
    { id: "enterprise", name: "Enterprise", range: "$10k+/mo", desc: "Full-funnel campaigns" }
];

const timelineOptions = [
    { id: "sprint", name: "Sprint", duration: "2 weeks", desc: "Quick launch, test fast" },
    { id: "quarter", name: "Quarter", duration: "3 months", desc: "Balanced approach" },
    { id: "annual", name: "Annual", duration: "12 months", desc: "Comprehensive strategy" }
];

export default function BuilderPage() {
    const [config, setConfig] = useState<BuilderConfig>({
        sentiment: "",
        goals: [],
        channels: [],
        budget: "",
        timeline: ""
    });
    const [generated, setGenerated] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const toggleGoal = (id: string) => {
        setConfig(prev => ({
            ...prev,
            goals: prev.goals.includes(id)
                ? prev.goals.filter(g => g !== id)
                : [...prev.goals, id]
        }));
    };

    const toggleChannel = (id: string) => {
        setConfig(prev => ({
            ...prev,
            channels: prev.channels.includes(id)
                ? prev.channels.filter(c => c !== id)
                : [...prev.channels, id]
        }));
    };

    const isComplete = config.sentiment && config.goals.length > 0 && config.channels.length > 0 && config.budget && config.timeline;

    const generateStrategy = () => {
        const sentiment = sentimentOptions.find(s => s.id === config.sentiment);
        const goals = config.goals.map(g => goalOptions.find(go => go.id === g)?.name).join(", ");
        const channels = config.channels.map(c => channelOptions.find(ch => ch.id === c)?.name).join(", ");
        const budgetInfo = budgetOptions.find(b => b.id === config.budget);
        const timelineInfo = timelineOptions.find(t => t.id === config.timeline);

        const strategy = `# Custom Marketing Strategy

## Brand Voice: ${sentiment?.name}
> ${sentiment?.desc}

**Example tone:** "${sentiment?.example}"

---

## Goals
${config.goals.map(g => {
            const goal = goalOptions.find(go => go.id === g);
            return `- **${goal?.name}**: ${goal?.desc}`;
        }).join("\n")}

---

## Channel Strategy

### Primary Channels
${config.channels.slice(0, 3).map(c => {
            const channel = channelOptions.find(ch => ch.id === c);
            return `- **${channel?.name}**: Main focus, daily activity`;
        }).join("\n")}

### Secondary Channels
${config.channels.slice(3).map(c => {
            const channel = channelOptions.find(ch => ch.id === c);
            return `- **${channel?.name}**: Supporting role, weekly activity`;
        }).join("\n") || "- None selected"}

---

## Budget: ${budgetInfo?.name} (${budgetInfo?.range})
${budgetInfo?.desc}

### Budget Allocation
${config.budget === "bootstrap" ? `- Content creation: 100% (time investment)
- Paid ads: $0
- Tools: Free tiers only` : config.budget === "funded" ? `- Content creation: 40%
- Paid ads: 40%
- Tools & software: 15%
- Contractors: 5%` : `- Content creation: 25%
- Paid ads: 50%
- Tools & software: 10%
- Team/Agency: 15%`}

---

## Timeline: ${timelineInfo?.name} (${timelineInfo?.duration})

${config.timeline === "sprint" ? `### Week 1: Prepare
- Finalize messaging and positioning
- Create launch content batch
- Set up tracking and analytics

### Week 2: Launch
- Execute launch campaign
- Monitor and respond in real-time
- Collect and share early wins` : config.timeline === "quarter" ? `### Month 1: Foundation
- Define brand voice guidelines
- Set up all channels
- Create content calendar
- Build initial content backlog

### Month 2: Execute
- Launch main campaign
- Test messaging variations
- Start paid experiments
- Engage with community

### Month 3: Optimize
- Analyze what's working
- Double down on winners
- Cut underperforming channels
- Plan next quarter` : `### Q1: Foundation (Months 1-3)
- Brand identity and guidelines
- Channel setup and optimization
- Team/contractor onboarding
- Content strategy development

### Q2: Launch (Months 4-6)
- Main campaign launch
- Press and influencer outreach
- Paid acquisition start
- Community building

### Q3: Growth (Months 7-9)
- Scale winning channels
- Expand content types
- Increase paid budget
- Partnership development

### Q4: Optimize (Months 10-12)
- Full funnel analysis
- Retention focus
- Annual review
- Next year planning`}

---

## Content Pillars

Based on your ${sentiment?.name.toLowerCase()} tone and ${goals.toLowerCase()} goals:

1. **Educational**: How-to guides and tutorials
2. **Thought Leadership**: Industry insights and opinions
3. **Social Proof**: Testimonials, case studies, wins
4. **Behind-the-Scenes**: Building in public, team culture
5. **Engagement**: Questions, polls, community interaction

---

## Success Metrics

| Goal | Primary Metric | Target |
|---|---|---|
${config.goals.map(g => {
            const goal = goalOptions.find(go => go.id === g);
            let metric = "", target = "";
            switch (g) {
                case "awareness": metric = "Impressions/Reach"; target = config.budget === "bootstrap" ? "50k/mo" : config.budget === "funded" ? "250k/mo" : "1M/mo"; break;
                case "leads": metric = "Signups/Leads"; target = config.budget === "bootstrap" ? "200/mo" : config.budget === "funded" ? "1k/mo" : "5k/mo"; break;
                case "sales": metric = "Conversions/Revenue"; target = config.budget === "bootstrap" ? "$5k MRR" : config.budget === "funded" ? "$25k MRR" : "$100k MRR"; break;
                case "retention": metric = "Churn Rate"; target = "<5%/mo"; break;
                case "community": metric = "Active Members"; target = config.budget === "bootstrap" ? "500" : config.budget === "funded" ? "2k" : "10k"; break;
            }
            return `| ${goal?.name} | ${metric} | ${target} |`;
        }).join("\n")}

---

## Next Steps

1. [ ] Finalize brand voice guidelines
2. [ ] Set up analytics tracking
3. [ ] Create content calendar for first ${config.timeline === "sprint" ? "2 weeks" : config.timeline === "quarter" ? "month" : "quarter"}
4. [ ] Build content backlog (10-20 posts)
5. [ ] Launch first campaign

---

*Generated by VibeLab Marketing Skills*`;

        setGenerated(strategy);
    };

    const copyStrategy = () => {
        if (generated) {
            navigator.clipboard.writeText(generated);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadStrategy = () => {
        if (generated) {
            const blob = new Blob([generated], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "custom-marketing-strategy.md";
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between py-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Custom Marketing Builder</h1>
                        <p className="text-[var(--foreground-secondary)]">Create a personalized strategy based on your brand sentiment</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Builder Form */}
                <div className="space-y-6">
                    {/* Sentiment */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="w-5 h-5 text-pink-500" />
                            <h2 className="font-semibold text-white">Brand Sentiment</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {sentimentOptions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setConfig(prev => ({ ...prev, sentiment: s.id }))}
                                    className={`p-4 rounded-xl text-left transition-all ${config.sentiment === s.id
                                            ? 'bg-pink-500/10 border-2 border-pink-500'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <p className="font-semibold text-white text-sm">{s.name}</p>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-[var(--accent)]" />
                            <h2 className="font-semibold text-white">Goals (select multiple)</h2>
                        </div>
                        <div className="space-y-2">
                            {goalOptions.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => toggleGoal(g.id)}
                                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${config.goals.includes(g.id)
                                            ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)]'
                                            : 'bg-[var(--background-card)] border border-[var(--border)]'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="font-semibold text-white text-sm">{g.name}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">{g.desc}</p>
                                    </div>
                                    {config.goals.includes(g.id) && <Check className="w-5 h-5 text-[var(--accent)]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Channels */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Megaphone className="w-5 h-5 text-orange-500" />
                            <h2 className="font-semibold text-white">Channels (select multiple)</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {channelOptions.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleChannel(c.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${config.channels.includes(c.id)
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <h2 className="font-semibold text-white">Budget</h2>
                        </div>
                        <div className="space-y-2">
                            {budgetOptions.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setConfig(prev => ({ ...prev, budget: b.id }))}
                                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${config.budget === b.id
                                            ? 'bg-green-500/10 border-2 border-green-500'
                                            : 'bg-[var(--background-card)] border border-[var(--border)]'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="font-semibold text-white text-sm">{b.name}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">{b.desc}</p>
                                    </div>
                                    <span className="text-sm text-green-500 font-medium">{b.range}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-[var(--accent-secondary)]" />
                            <h2 className="font-semibold text-white">Timeline</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {timelineOptions.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setConfig(prev => ({ ...prev, timeline: t.id }))}
                                    className={`p-4 rounded-xl text-center transition-all ${config.timeline === t.id
                                            ? 'bg-[var(--accent-secondary)]/10 border-2 border-[var(--accent-secondary)]'
                                            : 'bg-[var(--background-card)] border border-[var(--border)]'
                                        }`}
                                >
                                    <p className="font-semibold text-white text-sm">{t.name}</p>
                                    <p className="text-xs text-[var(--accent-secondary)]">{t.duration}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateStrategy}
                        disabled={!isComplete}
                        className="btn-primary w-full disabled:opacity-40"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Custom Strategy
                    </button>
                </div>

                {/* Preview */}
                <div className="lg:sticky lg:top-24 h-fit">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-white">Your Strategy</h2>
                            {generated && (
                                <div className="flex gap-2">
                                    <button onClick={copyStrategy} className="btn-ghost text-sm p-2">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button onClick={downloadStrategy} className="btn-ghost text-sm p-2">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {generated ? (
                            <pre className="p-4 rounded-xl bg-black/50 border border-[var(--border)] text-xs text-[var(--foreground-secondary)] font-mono overflow-x-auto max-h-[600px] whitespace-pre-wrap">
                                {generated}
                            </pre>
                        ) : (
                            <div className="p-8 rounded-xl bg-[var(--background-card)] border border-[var(--border)] text-center">
                                <Sparkles className="w-10 h-10 mx-auto mb-4 text-[var(--foreground-muted)]" />
                                <p className="text-[var(--foreground-muted)]">
                                    Configure your options to generate a custom marketing strategy
                                </p>
                                <div className="mt-4 text-xs text-[var(--foreground-muted)]">
                                    {!config.sentiment && "• Select a brand sentiment"}
                                    {config.sentiment && config.goals.length === 0 && "• Choose your goals"}
                                    {config.goals.length > 0 && config.channels.length === 0 && "• Pick your channels"}
                                    {config.channels.length > 0 && !config.budget && "• Set your budget"}
                                    {config.budget && !config.timeline && "• Choose a timeline"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
