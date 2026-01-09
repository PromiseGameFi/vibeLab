"use client";

import { useState } from "react";
import { toolsData } from "@/lib/toolsData";
import ToolCard from "@/components/ToolCard";
import { ArrowRight, Shield, Calculator, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Security Scanner",
    description: "Scan repos for vulnerabilities",
    href: "/scan",
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10",
    badge: "200 Files"
  },
  {
    title: "Token Calculator",
    description: "Compare AI provider costs",
    href: "/vibeMarket/token-calc",
    icon: Calculator,
    color: "text-green-400",
    bg: "bg-green-500/10",
    badge: "Save Money"
  },
  {
    title: "Prompt Optimizer",
    description: "Compress prompts, save tokens",
    href: "/vibeMarket/prompt-optimizer",
    icon: Wand2,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    badge: "-40%"
  },
  {
    title: "AI Skills",
    description: "One-click install for agents",
    href: "/skills",
    icon: Sparkles,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "6 Skills"
  }
];

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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-title text-white mb-6">
            Build better <em>AI workflows,</em> faster
          </h1>
          <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-12">
            VibeLab helps you use AI tools effectively and <span className="text-green-400">cut costs on tokens</span>. Blueprints, optimizers, and security tools in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link href="/scan" className="btn-primary">
              <Shield className="w-4 h-4" />
              Scan Repository
            </Link>
            <Link href="/vibeMarket" className="btn-secondary">
              Explore VibeMarket
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="card card-interactive p-5 text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className={`badge text-[10px] ${action.bg} ${action.color} border-0`}>
                    {action.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-[var(--foreground-muted)]">{action.description}</p>
              </Link>
            ))}
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
