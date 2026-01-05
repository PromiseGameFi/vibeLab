import Link from "next/link";
import { Tool } from "@/lib/toolsData";
import { ArrowRight, Zap } from "lucide-react";

export default function ToolCard({ tool }: { tool: Tool }) {
    return (
        <Link
            href={`/${tool.slug}`}
            className="group relative vibe-glass rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] hover:vibe-glow border border-white/5 hover:border-accent-primary/50 flex flex-col justify-between h-full bg-gradient-to-br from-white/[0.03] to-transparent"
        >
            <div className="absolute top-4 right-4 text-white/10 group-hover:text-accent-primary/30 transition-colors">
                <Zap className="w-8 h-8" />
            </div>

            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 rounded-md bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-wider border border-accent-primary/20">
                        {tool.category}
                    </span>
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-gradient transition-all duration-300">
                    {tool.name}
                </h3>

                <p className="text-white/50 text-sm leading-relaxed mb-6 line-clamp-2">
                    {tool.description}
                </p>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-medium text-white/40 flex items-center gap-1">
                    {tool.tips.length} Pro Tips
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-primary transition-colors duration-300">
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white" />
                </div>
            </div>
        </Link>
    );
}
