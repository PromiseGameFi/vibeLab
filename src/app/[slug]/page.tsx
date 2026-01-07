import { notFound } from "next/navigation";
import { toolsData } from "@/lib/toolsData";
import {
    ArrowLeft,
    Lightbulb,
    Terminal,
    Layers,
    ChevronRight,
    ExternalLink,
    Twitter,
    Linkedin,
    ArrowRight
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
    const shareText = `Check out the pro-blueprint for ${tool.name} on VibeLab!`;

    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <Link
                    href="/"
                    className="btn-ghost text-[var(--foreground-secondary)]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-2">
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-[var(--background-card)] transition-colors text-[var(--foreground-secondary)] hover:text-white"
                    >
                        <Twitter className="w-4 h-4" />
                    </a>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-[var(--background-card)] transition-colors text-[var(--foreground-secondary)] hover:text-white"
                    >
                        <Linkedin className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Title */}
            <header className="mb-16">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="badge badge-accent">{tool.category}</span>
                    {tool.goals.map((goal) => (
                        <span key={goal} className="badge">{goal}</span>
                    ))}
                </div>
                <h1 className="hero-title text-white mb-4">
                    {tool.name}
                </h1>
                <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl">
                    {tool.description}
                </p>
            </header>

            {/* Blueprint Section */}
            <section className="card p-8 mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-[var(--background-card)] border border-[var(--border)] flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">The Blueprint</h2>
                        <p className="text-sm text-[var(--foreground-secondary)]">Standard workflows</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {tool.workflows.map((workflow, index) => (
                        <div key={index} className="p-5 rounded-2xl bg-[var(--background-card)] border border-[var(--border)] group hover:border-[var(--accent)] transition-all">
                            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider mb-3 block">
                                Recipe {index + 1}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                {workflow.split(' -> ').map((step, i, arr) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${step.toLowerCase().includes(tool.name.toLowerCase())
                                                ? "bg-[var(--accent)] text-white"
                                                : "bg-[var(--background-card)] text-[var(--foreground-secondary)] border border-[var(--border)]"
                                            }`}>
                                            {step}
                                        </span>
                                        {i < arr.length - 1 && (
                                            <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pro Prompts Section */}
            <section className="card p-8 mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Pro Prompts</h2>
                        <p className="text-sm text-[var(--foreground-secondary)]">Annotated templates</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {tool.prompts.map((prompt, index) => {
                        const fullText = prompt.parts.map(p => p.text).join("");
                        return (
                            <div key={index} className="p-6 rounded-2xl bg-[var(--background-card)] border border-[var(--border)]">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="badge badge-accent">Blueprint Pro</span>
                                    <CopyButton text={fullText} />
                                </div>

                                <div className="font-mono text-sm text-[var(--foreground-secondary)] p-4 rounded-xl bg-black/50 mb-4 leading-relaxed">
                                    {prompt.parts.map((part, i) => (
                                        <span
                                            key={i}
                                            className={part.annotation ? "text-[var(--accent)] border-b border-[var(--accent)] border-opacity-30" : ""}
                                        >
                                            {part.text}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-sm text-[var(--foreground-secondary)] pl-4 border-l-2 border-[var(--accent)]">
                                    {prompt.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Tips Section */}
            <section className="card p-8 mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)] bg-opacity-20 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Pro Tips</h2>
                        <p className="text-sm text-[var(--foreground-secondary)]">Expert techniques</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {tool.tips.map((tip, index) => (
                        <div key={index} className="flex gap-4 p-4 rounded-xl hover:bg-[var(--background-card)] transition-colors">
                            <span className="text-[var(--accent)] font-mono font-bold">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="text-[var(--foreground-secondary)]">{tip}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <div className="text-center py-12">
                <a href="#" className="btn-primary text-lg px-8 py-4">
                    Launch {tool.name}
                    <ExternalLink className="w-5 h-5" />
                </a>
                <div className="flex items-center justify-center gap-2 mt-6">
                    <span className="text-sm text-[var(--foreground-muted)]">Works with:</span>
                    {tool.integrations.map(int => (
                        <span key={int} className="badge">{int}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
