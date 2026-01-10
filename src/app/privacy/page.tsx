import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Globe, Brain, Chrome } from "lucide-react";

export const metadata = {
    title: "Privacy Policy | VibeLab",
    description: "How VibeLab handles your data and protects your privacy.",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            <div className="mb-8">
                <Link href="/" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </div>

            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                        <p className="text-[var(--foreground-secondary)]">Last updated: January 2026</p>
                    </div>
                </div>
            </header>

            <div className="prose prose-invert max-w-none space-y-8">
                {/* Introduction */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Introduction
                    </h2>
                    <p className="text-[var(--foreground-secondary)]">
                        VibeLab (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data.
                        This privacy policy explains how we collect, use, and safeguard your information when you use our platform,
                        including the Security Scanner, AI Memory, Browser Extension, Skills, and VibeMarket tools.
                    </p>
                </section>

                {/* Data We Collect */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Database className="w-5 h-5 text-green-400" />
                        Data We Collect
                    </h2>
                    <div className="space-y-4 text-[var(--foreground-secondary)]">
                        <div>
                            <h3 className="font-medium text-white mb-2">Account Data (GitHub OAuth)</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>GitHub username and email</li>
                                <li>Profile picture URL</li>
                                <li>Repository access (only repos you authorize)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2">Security Scanner Data</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Repository names scanned (stored locally)</li>
                                <li>Scan history and results (stored locally in your browser)</li>
                                <li>AI fix suggestions are generated server-side but not stored</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                AI Memory Data
                            </h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Memory titles, content, and tags (stored locally in IndexedDB)</li>
                                <li>Memory embeddings for semantic search (stored locally)</li>
                                <li>Chat history with memories (stored locally)</li>
                                <li>Imported URLs and file content (stored locally)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Chrome className="w-4 h-4 text-blue-400" />
                                Browser Extension Data
                            </h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Captured conversations from AI sites (stored in chrome.storage.local)</li>
                                <li>Auto-save settings and preferences (stored locally)</li>
                                <li>No data is sent to external servers without your action</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2">Skills & VibeMarket Data</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Skills you create and export (stored locally)</li>
                                <li>Marketing prompts and generated content (not stored on servers)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2">What We DON&apos;T Collect</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Your source code (scans happen client-side)</li>
                                <li>Your AI conversations (processed locally)</li>
                                <li>Payment information (we don&apos;t charge)</li>
                                <li>Personal files or documents</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* How We Use Data */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Eye className="w-5 h-5 text-purple-400" />
                        How We Use Your Data
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li>Authenticate you via GitHub OAuth</li>
                        <li>Access your repositories for security scanning (with your permission)</li>
                        <li>Generate AI responses using Groq/Gemini APIs (prompts not stored)</li>
                        <li>Create semantic embeddings for memory search</li>
                        <li>Display your profile information in the UI</li>
                        <li>Improve our services and fix bugs</li>
                    </ul>
                </section>

                {/* Third Party Services */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Third-Party Services</h2>
                    <div className="space-y-4 text-[var(--foreground-secondary)]">
                        <p>We use the following third-party services:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                                <h3 className="font-medium text-white">GitHub OAuth</h3>
                                <p className="text-sm">Authentication and repository access</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                                <h3 className="font-medium text-white">OSV API</h3>
                                <p className="text-sm">Open source vulnerability data</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                                <h3 className="font-medium text-white">Google Gemini</h3>
                                <p className="text-sm">Embeddings for semantic search</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                                <h3 className="font-medium text-white">Groq</h3>
                                <p className="text-sm">AI chat and fix suggestions</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                                <h3 className="font-medium text-white">Vercel</h3>
                                <p className="text-sm">Hosting and analytics</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Storage */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-orange-400" />
                        Data Storage & Security
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li>Session data is stored securely using encrypted cookies</li>
                        <li>AI Memories are stored in your browser&apos;s IndexedDB (not on our servers)</li>
                        <li>Extension data is stored in chrome.storage.local</li>
                        <li>Scan history is stored in your browser&apos;s localStorage</li>
                        <li>We use HTTPS for all communications</li>
                        <li>GitHub tokens are never stored permanently</li>
                        <li>API keys (Groq, Gemini) are stored only in your .env.local file</li>
                    </ul>
                </section>

                {/* Your Rights */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li><strong>Access:</strong> All your data is stored locally - view it anytime</li>
                        <li><strong>Deletion:</strong> Clear browser storage to remove all local data</li>
                        <li><strong>Revoke Access:</strong> Revoke GitHub permissions via GitHub settings</li>
                        <li><strong>Extension:</strong> Remove extension to delete all captured memories</li>
                        <li><strong>Export:</strong> Export your memories as JSON from the dashboard</li>
                    </ul>
                </section>

                {/* GDPR */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">GDPR Compliance (EU Users)</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        If you are in the European Union, you have additional rights under GDPR including the right to access,
                        rectify, port, and erase your personal data. Since most data is stored locally in your browser,
                        you have full control. We process minimal data based on your consent (GitHub OAuth authorization).
                    </p>
                </section>

                {/* Contact */}
                <section className="card p-6 border-[var(--accent)]/30">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-[var(--accent)]" />
                        Contact Us
                    </h2>
                    <p className="text-[var(--foreground-secondary)]">
                        For privacy-related questions or requests, contact us at{" "}
                        <a href="mailto:privacy@vibelab.ai" className="text-[var(--accent)] hover:underline">
                            privacy@vibelab.ai
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
