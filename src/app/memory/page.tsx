"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Brain,
    Plus,
    Search,
    Copy,
    Check,
    Trash2,
    Edit3,
    X,
    Sliders,
    Tag,
    Clock,
    Zap,
    Filter,
    Download,
    MessageSquare,
    Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { memoryStore, estimateTokens } from "@/lib/memoryStore";
import {
    Memory,
    MemorySource,
    MemoryTier,
    SOURCE_CONFIG,
    TIER_CONFIG,
    DEFAULT_TAGS,
    MemoryExportResult
} from "@/lib/memoryTypes";

export default function MemoryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [copied, setCopied] = useState(false);

    // Export options
    const [tokenBudget, setTokenBudget] = useState(2000);
    const [useSummary, setUseSummary] = useState(true);
    const [exportResult, setExportResult] = useState<MemoryExportResult | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formTags, setFormTags] = useState<string[]>([]);
    const [formSource, setFormSource] = useState<MemorySource>("manual");

    // Import state
    const [importUrl, setImportUrl] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState("");

    // Load memories
    const loadMemories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await memoryStore.getAll();
            setMemories(data);
        } catch (error) {
            console.error("Failed to load memories:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadMemories();
    }, [loadMemories]);

    // Filter memories
    const filteredMemories = memories.filter(m => {
        const matchesSearch = !search ||
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.content.toLowerCase().includes(search.toLowerCase());

        const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => m.tags.includes(tag));

        return matchesSearch && matchesTags;
    });

    // Stats
    const totalTokens = memories.reduce((sum, m) => sum + m.tokenCount, 0);
    const allTags = [...new Set(memories.flatMap(m => m.tags))];

    // Add memory
    const handleAdd = async () => {
        if (!formTitle.trim() || !formContent.trim()) return;

        await memoryStore.add({
            title: formTitle,
            content: formContent,
            tags: formTags,
            source: formSource
        });

        resetForm();
        setShowAddModal(false);
        loadMemories();
    };

    // Update memory
    const handleUpdate = async () => {
        if (!editingMemory) return;

        await memoryStore.update(editingMemory.id, {
            title: formTitle,
            content: formContent,
            tags: formTags,
            source: formSource
        });

        resetForm();
        setEditingMemory(null);
        loadMemories();
    };

    // Delete memory
    const handleDelete = async (id: string) => {
        await memoryStore.delete(id);
        loadMemories();
    };

    // Edit memory
    const startEdit = (memory: Memory) => {
        setFormTitle(memory.title);
        setFormContent(memory.content);
        setFormTags(memory.tags);
        setFormSource(memory.source);
        setEditingMemory(memory);
    };

    // Reset form
    const resetForm = () => {
        setFormTitle("");
        setFormContent("");
        setFormTags([]);
        setFormSource("manual");
    };

    // Toggle memory selection
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedMemories);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMemories(newSelected);
    };

    // Export context
    const handleExport = async () => {
        const result = await memoryStore.export({
            maxTokens: tokenBudget,
            includeFullContent: !useSummary,
            sortBy: 'relevance'
        });
        setExportResult(result);
    };

    // Copy to clipboard
    const copyContext = async () => {
        if (!exportResult) return;
        await navigator.clipboard.writeText(exportResult.formattedContext);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">AI Memory</h1>
                        </div>
                        <p className="text-[var(--foreground-secondary)]">
                            {memories.length} memories · {totalTokens.toLocaleString()} total tokens
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/memory/chat"
                            className="btn-secondary"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </Link>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="btn-secondary"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Import
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Memory
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            placeholder="Search memories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
                        {allTags.slice(0, 5).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags(
                                    selectedTags.includes(tag)
                                        ? selectedTags.filter(t => t !== tag)
                                        : [...selectedTags, tag]
                                )}
                                className={`badge text-xs transition-all ${selectedTags.includes(tag)
                                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Memory Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-[var(--foreground-secondary)]">Loading memories...</p>
                    </div>
                ) : filteredMemories.length === 0 ? (
                    <div className="text-center py-20">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
                        <h3 className="text-lg font-medium text-white mb-2">No memories yet</h3>
                        <p className="text-[var(--foreground-secondary)] mb-4">
                            Start adding memories to build your AI context library
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary">
                            <Plus className="w-4 h-4" />
                            Add Your First Memory
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMemories.map(memory => (
                            <div
                                key={memory.id}
                                className={`card p-5 group transition-all ${selectedMemories.has(memory.id)
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                                    : ''
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{SOURCE_CONFIG[memory.source].icon}</span>
                                        <span className={`text-xs ${TIER_CONFIG[memory.tier].color}`}>
                                            {TIER_CONFIG[memory.tier].label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(memory)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--foreground-muted)]"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(memory.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-white mb-2 line-clamp-1">
                                    {memory.title}
                                </h3>

                                {/* Summary */}
                                <p className="text-sm text-[var(--foreground-secondary)] line-clamp-3 mb-3">
                                    {memory.summary || memory.content}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {memory.tags.slice(0, 3).map(tag => (
                                        <span
                                            key={tag}
                                            className="badge text-[10px] bg-white/5"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            {memory.tokenCount}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(memory.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedMemories.has(memory.id)}
                                        onChange={() => toggleSelect(memory.id)}
                                        className="w-4 h-4 rounded accent-[var(--accent)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {(showAddModal || editingMemory) && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="card p-6 w-full max-w-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">
                                    {editingMemory ? 'Edit Memory' : 'Add Memory'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingMemory(null);
                                        resetForm();
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        className="input w-full"
                                        placeholder="e.g., Project Requirements"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Content
                                        <span className="text-[var(--foreground-muted)] ml-2">
                                            (~{estimateTokens(formContent)} tokens)
                                        </span>
                                    </label>
                                    <textarea
                                        value={formContent}
                                        onChange={(e) => setFormContent(e.target.value)}
                                        className="input w-full h-40 resize-none"
                                        placeholder="Paste conversation, notes, or context..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Source</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(SOURCE_CONFIG) as MemorySource[]).map(source => (
                                            <button
                                                key={source}
                                                type="button"
                                                onClick={() => setFormSource(source)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${formSource === source
                                                    ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-black scale-105'
                                                    : 'bg-white/10 text-[var(--foreground-secondary)] hover:bg-white/20'
                                                    }`}
                                            >
                                                {SOURCE_CONFIG[source].icon} {SOURCE_CONFIG[source].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEFAULT_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setFormTags(
                                                    formTags.includes(tag)
                                                        ? formTags.filter(t => t !== tag)
                                                        : [...formTags, tag]
                                                )}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${formTags.includes(tag)
                                                    ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-black'
                                                    : 'bg-white/10 text-[var(--foreground-secondary)] hover:bg-white/20'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingMemory(null);
                                        resetForm();
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingMemory ? handleUpdate : handleAdd}
                                    className="btn-primary"
                                    disabled={!formTitle.trim() || !formContent.trim()}
                                >
                                    {editingMemory ? 'Update' : 'Add Memory'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Export Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="card p-6 w-full max-w-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">Export Context</h2>
                                <button
                                    onClick={() => {
                                        setShowExportModal(false);
                                        setExportResult(null);
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Token Budget Slider */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-white flex items-center gap-2">
                                        <Sliders className="w-4 h-4" />
                                        Token Budget
                                    </label>
                                    <span className="text-sm text-[var(--accent)]">
                                        {tokenBudget.toLocaleString()} tokens
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={500}
                                    max={8000}
                                    step={100}
                                    value={tokenBudget}
                                    onChange={(e) => setTokenBudget(Number(e.target.value))}
                                    className="w-full accent-[var(--accent)]"
                                />
                                <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
                                    <span>500</span>
                                    <span>8,000</span>
                                </div>
                            </div>

                            {/* Use Summary Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-6">
                                <div>
                                    <p className="text-sm text-white">Use Summaries</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        Compress content for more memories
                                    </p>
                                </div>
                                <button
                                    onClick={() => setUseSummary(!useSummary)}
                                    className={`w-10 h-6 rounded-full transition-colors ${useSummary ? 'bg-[var(--accent)]' : 'bg-white/20'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${useSummary ? 'translate-x-4' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            <button onClick={handleExport} className="btn-primary w-full mb-4">
                                Generate Context
                            </button>

                            {/* Export Result */}
                            {exportResult && (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                        <p className="text-sm text-green-400">
                                            ✓ {exportResult.memoriesIncluded} memories · {exportResult.totalTokens.toLocaleString()} tokens
                                        </p>
                                        {exportResult.memoriesExcluded > 0 && (
                                            <p className="text-xs text-[var(--foreground-muted)]">
                                                {exportResult.memoriesExcluded} memories excluded (over budget)
                                            </p>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <pre className="p-4 rounded-lg bg-black/40 text-xs text-[var(--foreground-secondary)] max-h-48 overflow-auto">
                                            {exportResult.formattedContext.slice(0, 500)}
                                            {exportResult.formattedContext.length > 500 && '...'}
                                        </pre>
                                        <button
                                            onClick={copyContext}
                                            className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="card p-6 w-full max-w-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">Import Content</h2>
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportUrl("");
                                        setImportError("");
                                        setFormTitle("");
                                        setFormContent("");
                                    }}
                                    className="p-2 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* URL Import */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-white mb-2">
                                    Import from URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={importUrl}
                                        onChange={(e) => setImportUrl(e.target.value)}
                                        placeholder="https://example.com/article"
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!importUrl) return;
                                            setImportLoading(true);
                                            setImportError("");
                                            try {
                                                const res = await fetch("/api/memory/import", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ url: importUrl }),
                                                });
                                                const data = await res.json();
                                                if (data.error) {
                                                    setImportError(data.error);
                                                } else {
                                                    setFormTitle(data.title);
                                                    setFormContent(data.content);
                                                    setFormSource("other");
                                                }
                                            } catch {
                                                setImportError("Failed to fetch URL");
                                            }
                                            setImportLoading(false);
                                        }}
                                        disabled={!importUrl || importLoading}
                                        className="btn-primary"
                                    >
                                        {importLoading ? "Fetching..." : "Fetch"}
                                    </button>
                                </div>
                                {importError && (
                                    <p className="text-sm text-red-400 mt-2">{importError}</p>
                                )}
                            </div>

                            {/* File Upload */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-white mb-2">
                                    Or upload a file
                                </label>
                                <input
                                    type="file"
                                    accept=".txt,.md,.json"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const text = await file.text();
                                        setFormTitle(file.name.replace(/\.[^/.]+$/, ""));
                                        setFormContent(text);
                                        setFormSource("other");
                                    }}
                                    className="input w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer"
                                />
                            </div>

                            {/* Preview */}
                            {formContent && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Preview
                                        <span className="text-[var(--foreground-muted)] ml-2">
                                            (~{estimateTokens(formContent)} tokens)
                                        </span>
                                    </label>
                                    <div className="p-3 rounded-lg bg-black/40 max-h-40 overflow-auto">
                                        <p className="text-sm font-medium text-white mb-1">{formTitle}</p>
                                        <p className="text-xs text-[var(--foreground-secondary)]">
                                            {formContent.slice(0, 300)}
                                            {formContent.length > 300 && "..."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportUrl("");
                                        setImportError("");
                                        setFormTitle("");
                                        setFormContent("");
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!formTitle || !formContent) return;
                                        await memoryStore.add({
                                            title: formTitle,
                                            content: formContent,
                                            tags: formTags,
                                            source: formSource,
                                            sourceUrl: importUrl || undefined,
                                        });
                                        setShowImportModal(false);
                                        setImportUrl("");
                                        setFormTitle("");
                                        setFormContent("");
                                        loadMemories();
                                    }}
                                    disabled={!formTitle || !formContent}
                                    className="btn-primary"
                                >
                                    Save Memory
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
