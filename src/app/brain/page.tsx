"use client";

import { useState } from "react";
import { ArrowRight, Brain, Download, Loader2, CheckCircle, FileText, Sparkles, FolderTree } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function BrainPage() {
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedFiles, setGeneratedFiles] = useState<Record<string, string> | null>(null);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        if (!projectName.trim() || !description.trim()) return;

        setIsGenerating(true);
        setError("");
        setGeneratedFiles(null);

        try {
            const response = await fetch("/api/generate/brain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectName, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate brain");
            }

            setGeneratedFiles(data.files);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedFiles) return;

        const zip = new JSZip();

        // Add files to zip
        Object.entries(generatedFiles).forEach(([path, content]) => {
            // RENAME .agent to agent (no dot) to avoid hidden file issues on Mac/Linux
            if (path.startsWith(".agent/")) {
                zip.file(path.replace(".agent/", "agent/"), content);
            } else {
                zip.file(path, content);
            }
        });

        // Add installation instructions
        zip.file("README-INSTALL.md", `# Installation Instructions

1. Extract all files to your project root.
2. **IMPORTANT**: Rename the \`agent\` folder to \`.agent\` (add a dot).
   - Mac/Linux systems hide folders starting with a dot by default.
   - We renamed it to \`agent\` in this zip so you can see it.
3. Open the project in your editor (VS Code, Cursor, etc.).
`);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${projectName.replace(/\s+/g, '-').toLowerCase()}-vibelab-brain.zip`);
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="badge badge-accent mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        <Brain className="w-3 h-3" />
                        Project Scaffolder
                    </div>
                    <h1 className="hero-title text-white mb-6">
                        Project <em>Brain</em> Generator
                    </h1>
                    <p className="text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-8">
                        Describe your idea, and VibeLab will generate the complete documentation stack (PRD, Progress, Structure, Context) for you to download.
                    </p>
                </div>
            </section>

            {/* Generator Form */}
            <section className="px-6 pb-24">
                <div className="max-w-2xl mx-auto">
                    {!generatedFiles ? (
                        <div className="card p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g., Crypto Dashboard, AI Video Editor"
                                    className="input w-full"
                                    disabled={isGenerating}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    What do you want to build?
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your project in detail. Mention key features, tech stack preferences, and user goals..."
                                    className="input w-full h-40 resize-none py-3"
                                    disabled={isGenerating}
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={!projectName || !description || isGenerating}
                                className={`btn-primary w-full flex items-center justify-center gap-2 ${isGenerating ? "opacity-75 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Brain...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Brain
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="card p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Brain Generated!</h2>
                            <p className="text-[var(--foreground-secondary)] mb-8">
                                Your project documentation is ready. Download the zip file and extract it to your new project root.
                            </p>

                            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 text-left mb-8 max-h-60 overflow-y-auto">
                                <h3 className="text-xs uppercase text-[var(--foreground-muted)] tracking-wider mb-2 sticky top-0 bg-[var(--background-card)] pb-2">
                                    Files Created
                                </h3>
                                <ul className="space-y-2">
                                    {Object.keys(generatedFiles).map((file) => (
                                        <li key={file} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                                            <FileText className="w-4 h-4 text-[var(--accent)]" />
                                            {file}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setGeneratedFiles(null)}
                                    className="btn-secondary flex-1 justify-center"
                                >
                                    Create Another
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary flex-1 justify-center"
                                >
                                    <Download className="w-4 h-4" />
                                    Download .zip
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
