import { notFound } from "next/navigation";
import { toolsData } from "@/lib/toolsData";
import {
    ArrowLeft,
    Lightbulb,
    Terminal,
    Layers,
    ChevronRight,
    ExternalLink,
    CheckCircle2,
    Twitter,
    Linkedin,
    Share2,
    Info
} from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tool = toolsData.find((t) => t.slug === slug);

    if (!tool) {
        notFound();
    }

    const shareUrl = `https://vibelab.ai/${tool.slug}`;
    const shareText = `Check out the pro-blueprint for ${tool.name} on VibeLab! #AI #VibeLab`;

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Back Button & Share */}
            <div className="flex justify-between items-center mb-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Directory
                </Link>
                <div className="flex items-center gap-3">
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all"
                    >
                        <Twitter className="w-4 h-4" />
                    </a>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--accent-secondary)] hover:border-[var(--accent-secondary)] transition-all"
                    >
                        <Linkedin className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Header */}
            <header className="mb-12">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="vibe-badge-primary">
                        {tool.category}
                    </span>
                    {tool.goals.map((goal) => (
                        <span key={goal} className="vibe-badge flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-[var(--accent-secondary)]" />
                            {goal}
                        </span>
                    ))}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-[var(--foreground)]">
                    {tool.name} <span className="text-[var(--foreground-secondary)]">Manual</span>
                </h1>
                <p className="text-[var(--foreground-secondary)] text-lg leading-relaxed max-w-2xl">{tool.description}</p>
            </header>

            <div className="grid gap-8">
                {/* Visual Blueprint (Tool Chains) */}
                <section className="vibe-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center text-[var(--foreground-secondary)] border border-[var(--border)]">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">The Blueprint</h2>
                            <p className="text-sm text-[var(--foreground-secondary)]">Standard Operating Procedures</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {tool.workflows.map((workflow, index) => (
                            <div key={index} className="p-6 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] group hover:border-[var(--accent-secondary)] transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-semibold text-[var(--accent-secondary)] uppercase tracking-wider">
                                        Recipe {index + 1}
                                    </span>
                                    <Share2 className="w-4 h-4 text-[var(--foreground-secondary)] opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {workflow.split(' -> ').map((step, i, arr) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${step.toLowerCase().includes(tool.name.toLowerCase())
                                                ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white"
                                                : "bg-[var(--card-bg)] text-[var(--foreground-secondary)] border border-[var(--border)]"
                                                }`}>
                                                {step}
                                            </div>
                                            {i < arr.length - 1 && (
                                                <ChevronRight className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Annotated Prompts Section */}
                <section className="vibe-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-secondary)] bg-opacity-10 flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-[var(--accent-secondary)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Deep Annotations</h2>
                            <p className="text-sm text-[var(--foreground-secondary)]">Reverse engineering pro results</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {tool.prompts.map((prompt, index) => {
                            const fullText = prompt.parts.map(p => p.text).join("");
                            return (
                                <div key={index} className="p-6 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] group hover:border-[var(--accent-secondary)] transition-all">
                                    <div className="flex justify-between items-start gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="vibe-badge-primary text-xs">
                                                BLUEPRINT PRO
                                            </span>
                                            <div className="flex items-center gap-1 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors cursor-help group/info relative">
                                                <Info className="w-3 h-3" />
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-xs opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                                    Hover over highlighted terms to see parameter explanations.
                                                </div>
                                            </div>
                                        </div>
                                        <CopyButton text={fullText} />
                                    </div>

                                    <div className="text-[var(--foreground)] font-mono text-sm leading-relaxed mb-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
                                        {prompt.parts.map((part, i) => (
                                            <span
                                                key={i}
                                                className={part.annotation ? "text-[var(--accent-primary)] border-b border-[var(--accent-primary)] border-opacity-30 cursor-help relative group/part" : "text-[var(--foreground-secondary)]"}
                                            >
                                                {part.text}
                                                {part.annotation && (
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[var(--accent-primary)] p-2 rounded-lg text-xs font-sans font-medium text-white opacity-0 group-hover/part:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                                        {part.annotation}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pl-4 border-l-2 border-[var(--accent-secondary)]">
                                        <p className="text-xs font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider mb-1">Strategy</p>
                                        <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">{prompt.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Pro Tips Section */}
                <section className="vibe-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)]">Expert Intelligence</h2>
                            <p className="text-sm text-[var(--foreground-secondary)]">The high-skill ceiling tips</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {tool.tips.map((tip, index) => (
                            <div key={index} className="flex gap-4 p-5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors group">
                                <span className="text-[var(--accent-primary)] font-mono font-bold text-lg">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <p className="text-[var(--foreground-secondary)] leading-relaxed group-hover:text-[var(--foreground)] transition-colors">
                                    "{tip}"
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Action Bar */}
                <div className="flex flex-col items-center gap-6 mt-8 pt-8 border-t border-[var(--border)]">
                    <p className="text-[var(--foreground-secondary)] text-sm font-medium">Execute the Blueprint</p>
                    <a
                        href="#"
                        className="vibe-btn-primary px-10 py-4 text-lg flex items-center gap-3"
                    >
                        Launch Application
                        <ExternalLink className="w-5 h-5" />
                    </a>
                    <div className="flex items-center gap-4">
                        <span className="text-[var(--foreground-secondary)] text-xs font-medium">Stack Compatibility</span>
                        <div className="flex gap-2">
                            {tool.integrations.map(int => (
                                <span key={int} className="vibe-badge text-xs">{int}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
