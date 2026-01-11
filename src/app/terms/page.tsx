import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Shield, Scale, Users, Brain, Chrome, Zap, RefreshCw } from "lucide-react";

export const metadata = {
    title: "Terms of Service | VibeLab",
    description: "Terms and conditions for using VibeLab platform.",
};

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            <div className="mb-8">
                <Link href="/" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </div>

            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
                        <p className="text-[var(--foreground-secondary)]">Last updated: January 2026</p>
                    </div>
                </div>
            </header>

            <div className="prose prose-invert max-w-none space-y-8">
                {/* Acceptance */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        By accessing or using VibeLab (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use the Service.
                    </p>
                </section>

                {/* Description */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
                    <p className="text-[var(--foreground-secondary)] mb-4">VibeLab provides:</p>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-red-400" />
                                Security Scanner
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Vulnerability scanning for GitHub repositories with AI-powered fix suggestions
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                AI Memory
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Persistent memory system with semantic search, chat, and URL import
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Chrome className="w-4 h-4 text-blue-400" />
                                Browser Extension
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Auto-capture from ChatGPT, Claude, Gemini, Perplexity, Copilot, and Twitter
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                MCP Server
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Memory access for Cursor, Claude Desktop, and other MCP clients
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-cyan-400" />
                                VibeLab Loop
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Autonomous AI development loop CLI and VS Code extension for Cursor, Antigravity, and VS Code
                            </p>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                            <li>Universal AI Skills for coding agents</li>
                            <li>VibeMarket marketing strategy tools</li>
                            <li>AI tool blueprints and workflow guides</li>
                        </ul>
                    </div>
                </section>

                {/* User Responsibilities */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-400" />
                        3. User Responsibilities
                    </h2>
                    <p className="text-[var(--foreground-secondary)] mb-4">You agree to:</p>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li>Only scan repositories you own or have permission to scan</li>
                        <li>Only capture conversations you have permission to save</li>
                        <li>Not use the Service for any illegal or unauthorized purpose</li>
                        <li>Not attempt to bypass security measures</li>
                        <li>Not abuse API rate limits or overload our systems</li>
                        <li>Comply with third-party terms (GitHub, ChatGPT, Claude, etc.)</li>
                        <li>Keep your API keys secure</li>
                    </ul>
                </section>

                {/* Free Service */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">4. Free Service</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        VibeLab is currently provided free of charge. We reserve the right to introduce paid features
                        in the future, but core functionality will remain free. We will provide notice of any changes.
                    </p>
                </section>

                {/* Intellectual Property */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-green-400" />
                        5. Intellectual Property
                    </h2>
                    <div className="space-y-4 text-[var(--foreground-secondary)]">
                        <p>
                            <strong className="text-white">Your Content:</strong> You retain all rights to your code, repositories,
                            memories, and any content you create using our tools.
                        </p>
                        <p>
                            <strong className="text-white">Your Memories:</strong> All memories you save are yours. We don&apos;t claim
                            any ownership over captured conversations or imported content.
                        </p>
                        <p>
                            <strong className="text-white">Our Content:</strong> VibeLab&apos;s interface, designs, patterns, and
                            documentation are owned by us and protected by copyright.
                        </p>
                        <p>
                            <strong className="text-white">Skills & Exports:</strong> Skills you create and export are yours to use
                            freely in any project.
                        </p>
                    </div>
                </section>

                {/* Disclaimers */}
                <section className="card p-6 border-orange-500/30">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        6. Disclaimers
                    </h2>
                    <div className="space-y-4 text-[var(--foreground-secondary)]">
                        <p>
                            <strong className="text-orange-400">Security Scanner:</strong> Our scanner is provided &quot;as is&quot; and does not
                            guarantee detection of all vulnerabilities. It should complement, not replace, professional security audits.
                        </p>
                        <p>
                            <strong className="text-orange-400">AI Features:</strong> AI-generated responses (chat, fix suggestions, summaries)
                            are provided for informational purposes. Always review AI output before use.
                        </p>
                        <p>
                            <strong className="text-orange-400">Memory Accuracy:</strong> Conversation extraction may not capture 100% of content.
                            Always verify important information.
                        </p>
                        <p>
                            <strong className="text-orange-400">Third-Party Sites:</strong> Content scraped from AI sites (ChatGPT, Claude, etc.)
                            may be subject to those platforms&apos; terms of service.
                        </p>
                        <p>
                            <strong className="text-orange-400">MCP Integration:</strong> MCP server functionality depends on third-party tools
                            (Cursor, Claude Desktop) which may change without notice.
                        </p>
                        <p>
                            <strong className="text-orange-400">VibeLab Loop:</strong> The autonomous loop executes AI coding agents
                            which may modify your code. Always review changes before committing. We are not responsible for
                            unintended code modifications.
                        </p>
                    </div>
                </section>

                {/* Limitation of Liability */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Scale className="w-5 h-5 text-purple-400" />
                        7. Limitation of Liability
                    </h2>
                    <p className="text-[var(--foreground-secondary)]">
                        To the maximum extent permitted by law, VibeLab shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages, including loss of profits, data, or business opportunities,
                        arising from your use of the Service.
                    </p>
                </section>

                {/* Termination */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">8. Termination</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        We may terminate or suspend access to our Service immediately, without prior notice, for any reason,
                        including breach of these Terms. You may stop using the Service at any time by revoking GitHub OAuth access
                        and removing the browser extension.
                    </p>
                </section>

                {/* Changes */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        We reserve the right to modify these terms at any time. We will notify users of significant changes
                        by updating the &quot;Last updated&quot; date. Continued use after changes constitutes acceptance.
                    </p>
                </section>

                {/* Governing Law */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">10. Governing Law</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        These Terms shall be governed by and construed in accordance with applicable law, without regard
                        to conflict of law principles.
                    </p>
                </section>

                {/* Contact */}
                <section className="card p-6 border-[var(--accent)]/30">
                    <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        Questions about these Terms? Contact us at:{" "}
                        <a href="mailto:legal@vibelab.ai" className="text-[var(--accent)] hover:underline">
                            legal@vibelab.ai
                        </a>
                    </p>
                </section>

                {/* Links */}
                <div className="flex gap-4 pt-4">
                    <Link href="/privacy" className="btn-ghost">Privacy Policy</Link>
                    <Link href="/accessibility" className="btn-ghost">Accessibility</Link>
                </div>
            </div>
        </div>
    );
}
