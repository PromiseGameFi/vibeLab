import Link from "next/link";
import { Tool } from "@/lib/toolsData";
import { ArrowRight } from "lucide-react";

export default function ToolCard({ tool }: { tool: Tool }) {
    return (
        <Link
            href={`/${tool.slug}`}
            className="card card-interactive p-6 flex flex-col justify-between h-full group"
        >
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="badge badge-accent">
                        {tool.category}
                    </span>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {tool.name}
                </h3>

                <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed mb-6 line-clamp-2">
                    {tool.description}
                </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--foreground-muted)]">
                    {tool.tips.length} Pro Tips
                </span>
                <span className="btn-ghost text-sm group-hover:gap-3">
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                </span>
            </div>
        </Link>
    );
}
