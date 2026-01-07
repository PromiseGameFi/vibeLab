"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, Plus, Trash2, Download, Copy, Check, Sparkles,
    Layout, Server, Container, TestTube, Brain
} from "lucide-react";
import { skillCategories, agentFormats, exportToCursor, exportToClaudeCode, exportToAntigravity, Skill } from "@/lib/skillsData";

export default function CreateSkillPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("frontend");
    const [agents, setAgents] = useState<string[]>(["cursor", "claude-code"]);
    const [instructions, setInstructions] = useState<string[]>([""]);
    const [rules, setRules] = useState<string[]>([""]);
    const [examples, setExamples] = useState<string[]>([""]);
    const [exportFormat, setExportFormat] = useState("cursor");
    const [copied, setCopied] = useState(false);

    const toggleAgent = (agent: string) => {
        setAgents(prev =>
            prev.includes(agent)
                ? prev.filter(a => a !== agent)
                : [...prev, agent]
        );
    };

    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, ""]);
    };

    const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
        setter(prev => prev.map((item, i) => i === index ? value : item));
    };

    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const buildSkill = (): Skill => ({
        id: Date.now().toString(),
        name: name || "Untitled Skill",
        slug: name.toLowerCase().replace(/\s+/g, "-") || "untitled",
        description: description || "No description provided",
        category: category as any,
        agents: agents as any[],
        author: "You",
        downloads: 0,
        instructions: instructions.filter(i => i.trim()),
        examples: examples.filter(e => e.trim()),
        rules: rules.filter(r => r.trim()),
        createdAt: new Date().toISOString().split("T")[0]
    });

    const getExportContent = (): string => {
        const skill = buildSkill();
        switch (exportFormat) {
            case "cursor": return exportToCursor(skill);
            case "claude-code": return exportToClaudeCode(skill);
            case "antigravity": return exportToAntigravity(skill);
            default: return exportToCursor(skill);
        }
    };

    const copyExport = () => {
        navigator.clipboard.writeText(getExportContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadExport = () => {
        const content = getExportContent();
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

    const isValid = name.trim() && instructions.some(i => i.trim());

    return (
        <div className="max-w-6xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between py-12">
                <Link href="/skills" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Skills
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] bg-opacity-20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Create Skill</h1>
                        <p className="text-[var(--foreground-secondary)]">Build a universal skill for AI coding agents</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor */}
                <div className="space-y-6">
                    {/* Basics */}
                    <div className="card p-6">
                        <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Basics</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Skill Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Next.js App Router"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Best practices for Next.js development..."
                                    className="input resize-none min-h-[80px]"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {skillCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === cat.id
                                                    ? 'bg-[var(--accent)] text-white'
                                                    : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-[var(--foreground-secondary)] mb-2 block">Target Agents</label>
                                <div className="flex flex-wrap gap-2">
                                    {agentFormats.map(format => (
                                        <button
                                            key={format.id}
                                            onClick={() => toggleAgent(format.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${agents.includes(format.id)
                                                    ? 'bg-[var(--accent-secondary)] text-white'
                                                    : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                                                }`}
                                        >
                                            {format.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider">Instructions *</h2>
                            <button onClick={() => addItem(setInstructions)} className="btn-ghost text-sm">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <div className="space-y-3">
                            {instructions.map((inst, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inst}
                                        onChange={(e) => updateItem(setInstructions, i, e.target.value)}
                                        placeholder="Use TypeScript with strict mode..."
                                        className="input flex-1"
                                    />
                                    {instructions.length > 1 && (
                                        <button
                                            onClick={() => removeItem(setInstructions, i)}
                                            className="p-2 text-[var(--foreground-muted)] hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider">Rules</h2>
                            <button onClick={() => addItem(setRules)} className="btn-ghost text-sm">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <div className="space-y-3">
                            {rules.map((rule, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={rule}
                                        onChange={(e) => updateItem(setRules, i, e.target.value)}
                                        placeholder="NEVER use any type..."
                                        className="input flex-1"
                                    />
                                    {rules.length > 1 && (
                                        <button
                                            onClick={() => removeItem(setRules, i)}
                                            className="p-2 text-[var(--foreground-muted)] hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Examples */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider">Code Examples</h2>
                            <button onClick={() => addItem(setExamples)} className="btn-ghost text-sm">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <div className="space-y-3">
                            {examples.map((ex, i) => (
                                <div key={i} className="flex gap-2">
                                    <textarea
                                        value={ex}
                                        onChange={(e) => updateItem(setExamples, i, e.target.value)}
                                        placeholder="// Example code..."
                                        className="input flex-1 resize-none min-h-[100px] font-mono text-sm"
                                    />
                                    {examples.length > 1 && (
                                        <button
                                            onClick={() => removeItem(setExamples, i)}
                                            className="p-2 text-[var(--foreground-muted)] hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview & Export */}
                <div className="lg:sticky lg:top-24 h-fit space-y-6">
                    <div className="card p-6">
                        <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Export Format</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {agentFormats.filter(f => agents.includes(f.id)).map(format => (
                                <button
                                    key={format.id}
                                    onClick={() => setExportFormat(format.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${exportFormat === format.id
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                                        }`}
                                >
                                    {format.name}
                                </button>
                            ))}
                        </div>

                        {agents.length === 0 && (
                            <p className="text-sm text-[var(--foreground-muted)] mb-4">Select at least one target agent</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={copyExport}
                                disabled={!isValid}
                                className="btn-secondary flex-1 disabled:opacity-40"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                            <button
                                onClick={downloadExport}
                                disabled={!isValid}
                                className="btn-primary flex-1 disabled:opacity-40"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="card p-6">
                        <h2 className="text-sm text-[var(--foreground-muted)] uppercase tracking-wider mb-4">Preview</h2>
                        <pre className="p-4 rounded-xl bg-black/50 border border-[var(--border)] text-xs text-[var(--foreground-secondary)] font-mono overflow-x-auto max-h-[400px] whitespace-pre-wrap">
                            {getExportContent()}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
