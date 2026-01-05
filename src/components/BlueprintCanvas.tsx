"use client";

import React from "react";
import { SpawnerStack, toolsData } from "@/lib/toolsData";
import { ChevronRight, ExternalLink, Zap, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

interface BlueprintCanvasProps {
    stack: SpawnerStack;
    onClose: () => void;
}

export default function BlueprintCanvas({ stack, onClose }: BlueprintCanvasProps) {
    const tools = stack.toolSlugs.map(slug => toolsData.find(t => t.slug === slug)).filter(Boolean);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-5xl vibe-glass rounded-[3rem] border border-white/10 overflow-hidden relative shadow-[0_0_100px_rgba(139,92,246,0.1)]">
                {/* Background Patterns */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                {/* Header */}
                <div className="relative z-10 p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-secondary/20 flex items-center justify-center text-accent-secondary animate-pulse">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter text-gradient">{stack.name}</h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Optimized Blueprint Generated</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-bold hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                    >
                        Reset Spawner
                    </button>
                </div>

                {/* Canvas Body */}
                <div className="relative z-10 p-12 overflow-x-auto">
                    <div className="flex items-center justify-center gap-12 min-w-max pb-8">
                        {tools.map((tool, index) => (
                            <React.Fragment key={tool?.slug}>
                                {/* Tool Node */}
                                <div className="group relative">
                                    <div className="absolute -inset-4 bg-accent-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative w-64 p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 group-hover:border-accent-primary/50 transition-all duration-500 hover:scale-105">
                                        <div className="mb-6 flex justify-between items-start">
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Step 0{index + 1}</span>
                                            <Layers className="w-4 h-4 text-accent-primary/40" />
                                        </div>
                                        <h3 className="text-xl font-black mb-3 text-white group-hover:text-accent-primary transition-colors">{tool?.name}</h3>
                                        <p className="text-white/40 text-xs leading-relaxed mb-6 line-clamp-2">{tool?.description}</p>

                                        <Link
                                            href={`/${tool?.slug}`}
                                            className="inline-flex items-center gap-2 text-xs font-bold text-accent-primary hover:text-white transition-colors group/link"
                                        >
                                            View Manual
                                            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Connection Line */}
                                {index < tools.length - 1 && (
                                    <div className="relative flex flex-col items-center gap-4">
                                        <div className="w-24 h-[2px] bg-gradient-to-r from-accent-primary/40 to-accent-secondary/40 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/40 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-white/10 animate-pulse" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Stack Summary Footer */}
                    <div className="mt-8 p-8 rounded-3xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] mb-2">Architect's Summary</h4>
                            <p className="text-white/60 text-sm leading-relaxed max-w-2xl">{stack.description}</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    const content = `# VibeLab Blueprint: ${stack.name}\n\n## Goal\n${stack.description}\n\n## Tool Stack\n${tools.map((t, i) => `${i + 1}. **${t?.name}**: ${t?.description}`).join('\n')}\n\n---\n*Generated by VibeLab v2.0*`;
                                    const blob = new Blob([content], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${stack.id}-blueprint.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
                            >
                                Export .md
                            </button>
                            <button className="px-8 py-4 rounded-2xl bg-accent-secondary/20 border border-accent-secondary/40 text-accent-secondary font-bold text-sm hover:bg-accent-secondary hover:text-white transition-all flex items-center gap-2 group">
                                Launch Stack
                                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
}
