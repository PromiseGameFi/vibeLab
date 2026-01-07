"use client";

import { useState } from "react";
import { toolsData } from "@/lib/toolsData";
import ToolCard from "@/components/ToolCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredTools = toolsData.filter((tool) => {
    const searchLower = search.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.category.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.goals.some(goal => goal.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-title text-white mb-6">
            Build better <em>AI workflows,</em> faster
          </h1>
          <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-12">
            VibeLab is the pro manual for AI tools. Stack blueprints, master prompts, and ship faster with our curated workflows.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link href="#tools" className="btn-primary">
              Start for free
            </Link>
            <Link href="/vibeMarket" className="btn-secondary">
              Explore VibeMarket
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tool Directory */}
      <section id="tools" className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title text-white">Tool Directory</h2>
              <p className="text-[var(--foreground-secondary)] mt-2">
                Master any AI tool with pro-level blueprints
              </p>
            </div>
            <input
              type="text"
              placeholder="Search tools..."
              className="input w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[var(--foreground-secondary)]">No tools found for "{search}"</p>
              <button
                onClick={() => setSearch("")}
                className="btn-ghost mt-4"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
