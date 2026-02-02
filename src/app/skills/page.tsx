"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowRight, Download, Search, Layout, Server, Container,
    TestTube, Brain, Sparkles, Filter, Plus, Copy, Check
} from "lucide-react";
import { skillsData, skillCategories, agentFormats, Skill, exportToCursor, exportToClaudeCode, exportToAntigravity } from "@/lib/skillsData";

const iconMap: Record<string, React.ElementType> = {
    Layout, Server, Container, TestTube, Brain, Sparkles
};

export default function SkillsPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [exportFormat, setExportFormat] = useState<string>("cursor");
    const [copied, setCopied] = useState(false);

    const filteredSkills = skillsData.filter(skill => {
        const matchesSearch = search === "" ||
            skill.name.toLowerCase().includes(search.toLowerCase()) ||
            skill.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === null || skill.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const getExportContent = (skill: Skill, format: string): string => {
        switch (format) {
            case "cursor": return exportToCursor(skill);
            case "claude-code": return exportToClaudeCode(skill);
            case "antigravity": return exportToAntigravity(skill);
            default: return exportToCursor(skill);
        }
    };

    const copyExport = () => {
        if (!selectedSkill) return;
        navigator.clipboard.writeText(getExportContent(selectedSkill, exportFormat));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadExport = () => {
        if (!selectedSkill) return;
        const content = getExportContent(selectedSkill, exportFormat);
        const format = agentFormats.find(f => f.id === exportFormat);
        const filename = format?.file.replace("/", "-") || "skill.md";
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="badge badge-accent mb-6">
                        <Sparkles className="w-3 h-3" />
                        One-Click Install
                    </div>
                    <h1 className="hero-title text-white mb-6">
                        AI Coding <em>Skills</em>
                    </h1>
                    <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-8">
                        Pre-built coding rules that <span className="text-white">save you tokens</span> by teaching AI your preferences upfront. Export to Cursor, Claude Code, Windsurf, and more.
                    </p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[var(--accent)]">{skillsData.length}</p>
                            <p className="text-sm text-[var(--foreground-muted)]">Skills</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{agentFormats.length}</p>
                            <p className="text-sm text-[var(--foreground-muted)]">Agents</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-400">~30%</p>
                            <p className="text-sm text-[var(--foreground-muted)]">Token Savings</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search skills... (e.g. 'React', 'TypeScript', 'API')"
                            className="input pl-12 w-full text-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="px-6 pb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`badge whitespace-nowrap cursor-pointer ${activeCategory === null ? 'badge-accent' : ''
                                }`}
                        >
                            All Skills
                        </button>
                        {skillCategories.map(cat => {
                            const Icon = iconMap[cat.icon] || Sparkles;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                                    className={`badge whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeCategory === cat.id ? 'badge-accent' : ''
                                        }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Skills Grid */}
            <section className="px-6 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <p className="text-[var(--foreground-secondary)]">
                            {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} found
                        </p>
                        <Link href="/skills/create" className="btn-primary w-full sm:w-auto text-center justify-center">
                            <Plus className="w-4 h-4" />
                            Create Skill
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSkills.map(skill => (
                            <div
                                key={skill.id}
                                className="card card-interactive p-6 cursor-pointer"
                                onClick={() => setSelectedSkill(skill)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="badge text-xs">
                                        {skillCategories.find(c => c.id === skill.category)?.name}
                                    </span>
                                    <span className="text-xs text-[var(--foreground-muted)]">
                                        {skill.downloads.toLocaleString()} downloads
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2">{skill.name}</h3>
                                <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-2">
                                    {skill.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        {skill.agents.slice(0, 3).map(agent => (
                                            <span key={agent} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-muted)]">
                                                {agent}
                                            </span>
                                        ))}
                                        {skill.agents.length > 3 && (
                                            <span className="text-[10px] text-[var(--foreground-muted)]">+{skill.agents.length - 3}</span>
                                        )}
                                    </div>
                                    <span className="btn-ghost text-sm">
                                        View <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredSkills.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-[var(--foreground-muted)]">No skills found for "{search}"</p>
                            <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="btn-ghost mt-4">
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Skill Detail Modal */}
            {selectedSkill && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <span className="badge mb-3">
                                    {skillCategories.find(c => c.id === selectedSkill.category)?.name}
                                </span>
                                <h2 className="text-2xl font-semibold text-white">{selectedSkill.name}</h2>
                                <p className="text-[var(--foreground-secondary)] mt-2">{selectedSkill.description}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSkill(null)}
                                className="p-2 text-[var(--foreground-muted)] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Export Section */}
                        <div className="card p-5 mb-6 bg-[var(--background-elevated)]">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Export to</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {agentFormats.filter(f => selectedSkill.agents.includes(f.id as any)).map(format => (
                                    <button
                                        key={format.id}
                                        onClick={() => setExportFormat(format.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${exportFormat === format.id
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)]'
                                            }`}
                                    >
                                        {format.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={copyExport} className="btn-secondary flex-1">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <button onClick={downloadExport} className="btn-primary flex-1">
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mb-6">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Instructions</h3>
                            <ul className="space-y-2">
                                {selectedSkill.instructions.map((inst, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                                        <span className="text-[var(--accent)] font-mono text-sm">{i + 1}.</span>
                                        {inst}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Rules */}
                        <div className="mb-6">
                            <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Rules</h3>
                            <ul className="space-y-2">
                                {selectedSkill.rules.map((rule, i) => (
                                    <li key={i} className="text-[var(--foreground-secondary)] text-sm p-3 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Examples */}
                        {selectedSkill.examples.length > 0 && (
                            <div>
                                <h3 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Examples</h3>
                                {selectedSkill.examples.map((ex, i) => (
                                    <pre key={i} className="p-4 rounded-xl bg-black/50 border border-[var(--border)] text-xs text-[var(--foreground-secondary)] font-mono overflow-x-auto mb-3 whitespace-pre-wrap">
                                        {ex}
                                    </pre>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
