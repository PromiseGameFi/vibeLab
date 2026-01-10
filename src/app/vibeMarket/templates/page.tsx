"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, Copy, Check, Download, ChevronDown, ChevronUp,
    Rocket, Users, Megaphone, TrendingUp, DollarSign, Heart
} from "lucide-react";

interface Template {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    description: string;
    bestFor: string[];
    phases: { name: string; duration: string; tactics: string[] }[];
    channels: string[];
    metrics: { name: string; target: string }[];
    budget: string;
    tips: string[];
}

const templates: Template[] = [
    {
        id: "saas",
        name: "SaaS Launch",
        icon: Rocket,
        color: "var(--accent)",
        description: "Product-led growth strategy for software-as-a-service products with freemium or trial models.",
        bestFor: ["B2B SaaS", "Developer Tools", "Productivity Apps", "Analytics Platforms"],
        phases: [
            { name: "Pre-Launch", duration: "Weeks 1-4", tactics: ["Build waitlist with landing page", "Create demo videos", "Seed beta users for testimonials", "Set up product analytics"] },
            { name: "Soft Launch", duration: "Weeks 5-8", tactics: ["Open to waitlist", "Gather feedback aggressively", "Fix onboarding friction", "Create help docs"] },
            { name: "Public Launch", duration: "Weeks 9-12", tactics: ["Product Hunt launch", "Press outreach", "Launch week social blitz", "Paid retargeting"] },
            { name: "Growth", duration: "Ongoing", tactics: ["Content marketing", "SEO optimization", "Referral program", "Feature launches"] }
        ],
        channels: ["Product Hunt", "X/Twitter", "LinkedIn", "Blog/SEO", "Email", "YouTube"],
        metrics: [
            { name: "MRR", target: "$10k in 6 months" },
            { name: "Trial → Paid", target: "5-10%" },
            { name: "CAC", target: "<$50" },
            { name: "Churn", target: "<5% monthly" }
        ],
        budget: "$2k - $10k",
        tips: ["Focus on one ICP first", "Make free tier genuinely useful", "Optimize onboarding flow weekly"]
    },
    {
        id: "creator",
        name: "Creator Economy",
        icon: Heart,
        color: "#ec4899",
        description: "Audience-first strategy for content creators, educators, and personal brands.",
        bestFor: ["Newsletters", "Courses", "Communities", "Coaching"],
        phases: [
            { name: "Foundation", duration: "Months 1-2", tactics: ["Pick one platform (X or YouTube)", "Post daily for 30 days", "Engage 20+ accounts/day", "Find your unique angle"] },
            { name: "Grow Audience", duration: "Months 3-6", tactics: ["Double down on what works", "Collaborate with peers", "Launch email newsletter", "Build community (Discord/Slack)"] },
            { name: "Monetize", duration: "Months 7-12", tactics: ["Launch first paid product", "Start sponsorships", "Create premium tier", "Test pricing"] },
            { name: "Scale", duration: "Year 2+", tactics: ["Hire first team member", "Diversify revenue", "Launch second product", "Build brand partnerships"] }
        ],
        channels: ["X/Twitter", "Newsletter", "YouTube", "Podcast", "Community"],
        metrics: [
            { name: "Followers", target: "10k in 6 months" },
            { name: "Email List", target: "5k subscribers" },
            { name: "Revenue", target: "$5k MRR" },
            { name: "Engagement", target: ">5% rate" }
        ],
        budget: "$0 - $1k (time-intensive)",
        tips: ["Consistency beats perfection", "Teach what you learn", "Build in public"]
    },
    {
        id: "ecommerce",
        name: "E-commerce",
        icon: DollarSign,
        color: "#22c55e",
        description: "Direct-to-consumer brand strategy for physical or digital products.",
        bestFor: ["D2C Brands", "Subscription Boxes", "Digital Products", "Marketplaces"],
        phases: [
            { name: "Validate", duration: "Weeks 1-4", tactics: ["Test ads to landing page", "Pre-sell or crowdfund", "Get 20+ customer interviews", "Validate pricing"] },
            { name: "Launch", duration: "Weeks 5-8", tactics: ["Launch store", "Seed influencer product", "Run launch promotion", "Collect reviews"] },
            { name: "Optimize", duration: "Weeks 9-16", tactics: ["A/B test everything", "Improve conversion rate", "Build email automation", "Reduce CAC"] },
            { name: "Scale", duration: "Ongoing", tactics: ["Scale winning ads", "Launch new products", "Build retention loops", "International expansion"] }
        ],
        channels: ["Instagram", "TikTok", "Facebook Ads", "Email", "Influencers", "SEO"],
        metrics: [
            { name: "Revenue", target: "$50k in 6 months" },
            { name: "ROAS", target: ">3x" },
            { name: "AOV", target: "+20% from baseline" },
            { name: "Repeat Rate", target: ">30%" }
        ],
        budget: "$5k - $50k",
        tips: ["UGC outperforms studio content", "Email is your highest ROI channel", "Focus on repeat purchases"]
    },
    {
        id: "agency",
        name: "Agency Model",
        icon: Users,
        color: "#8b5cf6",
        description: "Client acquisition and retention strategy for service businesses.",
        bestFor: ["Marketing Agencies", "Dev Shops", "Consulting", "Freelancers"],
        phases: [
            { name: "Position", duration: "Weeks 1-4", tactics: ["Define niche (industry + service)", "Create case study portfolio", "Set up referral system", "Optimize LinkedIn"] },
            { name: "Pipeline", duration: "Weeks 5-12", tactics: ["Cold outreach (email/DM)", "Content marketing", "Free workshops/webinars", "Partner with complementary services"] },
            { name: "Convert", duration: "Ongoing", tactics: ["Discovery call framework", "Proposal templates", "Pricing packages", "Upsell existing clients"] },
            { name: "Scale", duration: "Year 1+", tactics: ["Hire specialists", "Productize services", "Create retainer model", "Build brand reputation"] }
        ],
        channels: ["LinkedIn", "Referrals", "Cold Email", "Webinars", "Partnerships"],
        metrics: [
            { name: "MRR", target: "$20k retainer" },
            { name: "Close Rate", target: ">25%" },
            { name: "Client LTV", target: ">$10k" },
            { name: "Referral %", target: ">40% of new clients" }
        ],
        budget: "$1k - $5k",
        tips: ["Niche down aggressively", "Case studies are your best sales tool", "Retainers > project work"]
    },
    {
        id: "devtools",
        name: "Developer Tools",
        icon: Megaphone,
        color: "#f59e0b",
        description: "DevRel-focused strategy for tools targeting developers and technical audiences.",
        bestFor: ["APIs", "CLIs", "Libraries", "Infrastructure"],
        phases: [
            { name: "Build in Public", duration: "Weeks 1-8", tactics: ["Share development journey", "Get early feedback", "Build with developers", "Create GitHub presence"] },
            { name: "Documentation", duration: "Weeks 9-12", tactics: ["Write excellent docs", "Create tutorials", "Build example projects", "Record video walkthroughs"] },
            { name: "Community", duration: "Months 4-6", tactics: ["Launch Discord/Slack", "Speak at meetups", "Sponsor conferences", "Start DevRel program"] },
            { name: "Growth", duration: "Ongoing", tactics: ["Integration partnerships", "Open source contributions", "Technical blog content", "Developer advocates"] }
        ],
        channels: ["GitHub", "X/Twitter", "Discord", "Dev.to", "Hacker News", "Conferences"],
        metrics: [
            { name: "GitHub Stars", target: "1k in 6 months" },
            { name: "Weekly Active", target: "500 developers" },
            { name: "NPS", target: ">50" },
            { name: "Community", target: "1k members" }
        ],
        budget: "$2k - $15k",
        tips: ["Docs are marketing", "Developers hate marketing", "Solve real problems, be authentic"]
    }
];

export default function TemplatesPage() {
    const [expandedId, setExpandedId] = useState<string | null>("saas");
    const [copied, setCopied] = useState<string | null>(null);

    const exportTemplate = (template: Template): string => {
        let output = `# ${template.name} Marketing Strategy\n\n`;
        output += `${template.description}\n\n`;
        output += `## Best For\n${template.bestFor.map(b => `- ${b}`).join("\n")}\n\n`;
        output += `## Budget: ${template.budget}\n\n`;
        output += `## Phases\n`;
        template.phases.forEach(p => {
            output += `### ${p.name} (${p.duration})\n${p.tactics.map(t => `- ${t}`).join("\n")}\n\n`;
        });
        output += `## Channels\n${template.channels.map(c => `- ${c}`).join("\n")}\n\n`;
        output += `## Metrics\n| Metric | Target |\n|---|---|\n`;
        template.metrics.forEach(m => {
            output += `| ${m.name} | ${m.target} |\n`;
        });
        output += `\n## Tips\n${template.tips.map(t => `- ${t}`).join("\n")}`;
        return output;
    };

    const copyTemplate = (template: Template) => {
        navigator.clipboard.writeText(exportTemplate(template));
        setCopied(template.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadTemplate = (template: Template) => {
        const content = exportTemplate(template);
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.id}-strategy-template.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-secondary)] to-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Strategy Templates</h1>
                        <p className="text-[var(--foreground-secondary)]">Pre-built marketing playbooks for every business model</p>
                    </div>
                </div>
            </header>

            {/* Templates */}
            <div className="space-y-4">
                {templates.map(template => {
                    const Icon = template.icon;
                    const isExpanded = expandedId === template.id;

                    return (
                        <div key={template.id} className="card overflow-hidden">
                            {/* Header */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : template.id)}
                                className="w-full p-6 flex items-center justify-between hover:bg-[var(--background-elevated)] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${template.color}20` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: template.color }} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-white">{template.name}</h3>
                                        <p className="text-sm text-[var(--foreground-secondary)]">{template.description}</p>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-[var(--foreground-muted)]" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6 space-y-6 border-t border-[var(--border)]">
                                    {/* Best For */}
                                    <div className="pt-6">
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Best For</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {template.bestFor.map((item, i) => (
                                                <span key={i} className="badge">{item}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div>
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-2">Recommended Budget</h4>
                                        <p className="text-lg font-semibold" style={{ color: template.color }}>{template.budget}</p>
                                    </div>

                                    {/* Phases */}
                                    <div>
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Phases</h4>
                                        <div className="space-y-3">
                                            {template.phases.map((phase, i) => (
                                                <div key={i} className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-semibold text-white">{phase.name}</h5>
                                                        <span className="text-xs text-[var(--foreground-muted)]">{phase.duration}</span>
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {phase.tactics.map((tactic, j) => (
                                                            <li key={j} className="text-sm text-[var(--foreground-secondary)]">• {tactic}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Channels */}
                                    <div>
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Channels</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {template.channels.map((channel, i) => (
                                                <span key={i} className="badge badge-accent">{channel}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div>
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Target Metrics</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {template.metrics.map((metric, i) => (
                                                <div key={i} className="p-3 rounded-xl bg-[var(--background-card)] border border-[var(--border)] text-center">
                                                    <p className="font-bold" style={{ color: template.color }}>{metric.target}</p>
                                                    <p className="text-xs text-[var(--foreground-muted)]">{metric.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div>
                                        <h4 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Pro Tips</h4>
                                        <ul className="space-y-2">
                                            {template.tips.map((tip, i) => (
                                                <li key={i} className="text-[var(--foreground-secondary)] flex items-start gap-2">
                                                    <span className="text-[var(--accent)]">•</span> {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => copyTemplate(template)} className="btn-secondary flex-1">
                                            {copied === template.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copied === template.id ? "Copied!" : "Copy"}
                                        </button>
                                        <button onClick={() => downloadTemplate(template)} className="btn-primary flex-1">
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
