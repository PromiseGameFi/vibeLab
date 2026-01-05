"use client";

import { useState } from "react";
import { toolsData, resolveIntent, SpawnerStack } from "@/lib/toolsData";
import ToolCard from "@/components/ToolCard";
import SpawnerTerminal from "@/components/SpawnerTerminal";
import BlueprintCanvas from "@/components/BlueprintCanvas";

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
      // Fallback: If no intent found, just perform a regular search
      setSearch(intent);
    }
  };

  const suggestions = ["Consistent Character", "Full-stack Apps", "Viral Ads", "3D Printing", "Game Assets"];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24">
      {/* Hero Section: The Spawner */}
      <section className="pt-20 pb-24 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 blur-[120px] rounded-full -z-10"></div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
          THE AI <span className="text-gradient">MANUAL</span>
        </h1>
        <p className="text-white/40 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium">
          Stop prompting. Start <span className="text-white/80">stacking</span>. Orchestrate your AI tools with the Spawner.
        </p>

        {/* Spawner Terminal */}
        <div className="mb-12">
          <SpawnerTerminal onSpawn={handleSpawn} />
        </div>

        {/* Manual Search Fallback */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="text-xs font-bold text-white/20 uppercase tracking-widest mr-2 py-2">Quick Blueprints:</span>
            {suggestions.map((goal) => (
              <button
                key={goal}
                onClick={() => setSearch(goal)}
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-accent-primary/50 hover:bg-accent-primary/10 transition-all font-mono"
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Content */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-12 py-6 border-y border-white/5">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Main Directory</h2>
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-1">Manual Tool Exploration</p>
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search raw directory..."
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-accent-primary transition-all w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-white/20 text-xl">No manual entries found for "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-accent-primary font-bold hover:underline"
            >
              Clear Directory Search
            </button>
          </div>
        )}
      </div>

      {/* Spawn Result: Blueprint Canvas */}
      {activeStack && (
        <BlueprintCanvas
          stack={activeStack}
          onClose={() => setActiveStack(null)}
        />
      )}
    </div>
  );
}
