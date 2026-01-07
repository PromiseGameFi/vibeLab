"use client";

import { useState } from "react";
import { toolsData, resolveIntent, SpawnerStack } from "@/lib/toolsData";
import ToolCard from "@/components/ToolCard";
import SpawnerTerminal from "@/components/SpawnerTerminal";
import BlueprintCanvas from "@/components/BlueprintCanvas";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeStack, setActiveStack] = useState<SpawnerStack | null>(null);

  const filteredTools = toolsData.filter((tool) => {
    const searchLower = search.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.category.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower) ||
      tool.goals.some(goal => goal.toLowerCase().includes(searchLower))
    );
  });

  const handleSpawn = (intent: string) => {
    const stack = resolveIntent(intent);
    if (stack) {
      setActiveStack(stack);
    } else {
      setSearch(intent);
    }
  };

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
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link href="#tools" className="btn-primary">
              Start for free
            </Link>
            <Link href="/vibeMarket" className="btn-secondary">
              Explore VibeMarket
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Spawner */}
          <SpawnerTerminal onSpawn={handleSpawn} />
        </div>
      </section>

      {/* Features - Sticky Scroll Style */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="section-title text-white mb-6">
                Create, collaborate, <em>and ship</em>
              </h2>

              <div className="space-y-8">
                {[
                  {
                    title: "AI Blueprints",
                    desc: "Step-by-step workflows for every creative need. From 3D assets to viral videos."
                  },
                  {
                    title: "Pro Prompts",
                    desc: "Annotated prompt libraries that explain the 'why' behind every parameter."
                  },
                  {
                    title: "Tool Stacks",
                    desc: "Pre-built combinations of AI tools that work together seamlessly."
                  }
                ].map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[var(--foreground-secondary)]">{item.desc}</p>
                    <span className="btn-ghost mt-2 text-sm">
                      Learn more <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">V</span>
                </div>
                <p className="text-[var(--foreground-secondary)] text-sm">Interactive preview</p>
              </div>
            </div>
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

      {/* Blueprint Canvas */}
      {activeStack && (
        <BlueprintCanvas
          stack={activeStack}
          onClose={() => setActiveStack(null)}
        />
      )}
    </div>
  );
}
