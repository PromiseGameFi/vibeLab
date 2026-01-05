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
            <div className="flex justify-between items-center mb-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Directory
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest hidden sm:inline">Share Recipe</span>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-accent-primary/20 text-white/40 hover:text-accent-primary transition-all"
                    >
                        <Twitter className="w-4 h-4" />
                    </a>
                    <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-accent-secondary/20 text-white/40 hover:text-accent-secondary transition-all"
                    >
                        <Linkedin className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Header */}
            <header className="mb-16">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold uppercase tracking-widest">
                        {tool.category}
                    </span>
                    {tool.goals.map((goal) => (
                        <span key={goal} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-accent-secondary" />
                            {goal}
                        </span>
                    ))}
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight">
                    {tool.name} <span className="text-white/10">Manual</span>
                </h1>
                <p className="text-white/60 text-xl leading-relaxed max-w-2xl">{tool.description}</p>
            </header>

            <div className="grid gap-12">
                {/* Visual Blueprint (Tool Chains) */}
                <section className="vibe-glass rounded-[2rem] p-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 text-white/5 -mr-8 -mt-8">
                        <Layers className="w-44 h-44 rotate-12" />
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">The Blueprint</h2>
                            <p className="text-white/30 text-sm italic">Standard Operating Procedures</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {tool.workflows.map((workflow, index) => (
                            <div key={index} className="relative group">
                                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 group-hover:border-accent-secondary/30 transition-all flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-accent-secondary uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">
                                            Recipe {index + 1}
                                        </div>
                                        <Share2 className="w-4 h-4 text-white/5 group-hover:text-white/20 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {workflow.split(' -> ').map((step, i, arr) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className={`px-5 py-3 rounded-2xl text-sm font-black tracking-tight transition-all duration-300 ${step.toLowerCase().includes(tool.name.toLowerCase())
                                                        ? "bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                                                        : "bg-white/5 text-white/50 border border-white/10 group-hover:border-white/20"
                                                    }`}>
                                                    {step}
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Annotated Prompts Section */}
                <section className="vibe-glass rounded-[2rem] p-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 text-accent-secondary/5 -mr-8 -mt-8">
                        <Terminal className="w-44 h-44 -rotate-12" />
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-accent-secondary/20 flex items-center justify-center text-accent-secondary border border-accent-secondary/20">
                            <Terminal className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Deep Annotations</h2>
                            <p className="text-white/30 text-sm italic">Reverse engineering pro results</p>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        {tool.prompts.map((prompt, index) => {
                            const fullText = prompt.parts.map(p => p.text).join("");
                            return (
                                <div key={index} className="group relative">
                                    <div className="absolute inset-0 bg-accent-secondary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative p-10 rounded-[2.5rem] bg-black/40 border border-white/5 group-hover:border-accent-secondary/30 transition-all">
                                        <div className="flex justify-between items-start gap-4 mb-8">
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 rounded-lg bg-accent-secondary/10 text-accent-secondary text-[10px] font-black uppercase tracking-widest">
                                                    BLUEPRINT PRO
                                                </div>
                                                <div className="flex items-center gap-1 text-white/20 hover:text-white/50 transition-colors cursor-help group/info relative">
                                                    <Info className="w-3 h-3" />
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                                                        Hover over highlighted terms to see parameter explanations.
                                                    </div>
                                                </div>
                                            </div>
                                            <CopyButton text={fullText} />
                                        </div>

                                        <div className="text-white/90 font-mono text-base leading-relaxed mb-8 block bg-white/[0.03] p-6 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            {prompt.parts.map((part, i) => (
                                                <span
                                                    key={i}
                                                    className={part.annotation ? "text-accent-primary border-b border-accent-primary/20 cursor-help relative group/part" : "text-white/60"}
                                                >
                                                    {part.text}
                                                    {part.annotation && (
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-accent-primary p-3 rounded-lg text-[10px] font-sans font-bold text-white opacity-0 group-hover/part:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                            {part.annotation}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-accent-primary"></div>
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-white/40 text-sm leading-relaxed pl-6 border-l-2 border-accent-secondary font-medium">
                                            <span className="text-white/80 font-black uppercase text-[10px] tracking-widest block mb-2">Strategy</span>
                                            {prompt.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Pro Tips Section */}
                <section className="vibe-glass rounded-[2rem] p-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 text-accent-primary/5 -mr-8 -mt-8">
                        <Lightbulb className="w-44 h-44 rotate-12" />
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 flex items-center justify-center text-accent-primary border border-accent-primary/20">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Expert Intelligence</h2>
                            <p className="text-white/30 text-sm italic">The high-skill ceiling tips</p>
                        </div>
                    </div>

                    <div className="grid gap-4 relative z-10">
                        {tool.tips.map((tip, index) => (
                            <div key={index} className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                                <span className="text-accent-primary font-mono font-black text-lg group-hover:scale-110 transition-transform">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <p className="text-white/70 leading-relaxed group-hover:text-white transition-colors font-medium italic">"{tip}"</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Action Bar */}
                <div className="flex flex-col items-center gap-6 mt-12 py-12 border-t border-white/5">
                    <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">Execute the Blueprint</h3>
                    <a
                        href="#"
                        className="px-12 py-6 rounded-full bg-white text-black font-black text-xl flex items-center gap-3 hover:bg-accent-secondary hover:text-white transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-accent-secondary/40"
                    >
                        Launch Application
                        <ExternalLink className="w-5 h-5 flex-shrink-0" />
                    </a>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-white/10 text-[10px] font-bold uppercase tracking-widest">Stack Compatibility</span>
                        <div className="flex gap-2">
                            {tool.integrations.map(int => (
                                <span key={int} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/20 text-[10px] font-bold">{int}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
