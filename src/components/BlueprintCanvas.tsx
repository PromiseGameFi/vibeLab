"use client";

import React from "react";
import { SpawnerStack, toolsData } from "@/lib/toolsData";
import { ChevronRight, ExternalLink, Zap, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface BlueprintCanvasProps {
    stack: SpawnerStack;
    onClose: () => void;
}

export default function BlueprintCanvas({ stack, onClose }: BlueprintCanvasProps) {
    const tools = stack.toolSlugs.map(slug => toolsData.find(t => t.slug === slug)).filter(Boolean);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-4xl card p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{stack.name}</h2>
                            <p className="text-sm text-[var(--foreground-secondary)]">Generated Blueprint</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--background-card)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--foreground-secondary)]" />
                    </button>
                </div>

                {/* Tool Flow */}
                <div className="p-8 overflow-x-auto">
                    <div className="flex items-center justify-center gap-6 min-w-max">
                        {tools.map((tool, index) => (
                            <React.Fragment key={tool?.slug}>
                                <div className="card p-6 w-48 group hover:border-[var(--accent)] transition-all">
                                    <span className="badge mb-3">Step {index + 1}</span>
                                    <h3 className="font-semibold text-white mb-1 group-hover:text-[var(--accent)] transition-colors">
                                        {tool?.name}
                                    </h3>
                                    <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2">
                                        {tool?.description}
                                    </p>
                                </div>

                                {index < tools.length - 1 && (
                                    <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
                    <p className="text-sm text-[var(--foreground-secondary)] max-w-md">
                        {stack.description}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const content = `# ${stack.name}\n\n${stack.description}\n\n## Stack\n${tools.map((t, i) => `${i + 1}. **${t?.name}**`).join('\n')}`;
                                navigator.clipboard.writeText(content);
                            }}
                            className="btn-secondary"
                        >
                            Copy
                        </button>
                        <Link href={`/${tools[0]?.slug}`} className="btn-primary">
                            Start Building
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
