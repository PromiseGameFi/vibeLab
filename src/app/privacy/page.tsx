import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Globe } from "lucide-react";

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
                        VibeLab ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
                        This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
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
                            <h3 className="font-medium text-white mb-2">Usage Data</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Scan history (stored locally in your browser)</li>
                                <li>Prompts entered in the optimizer (not stored on servers)</li>
                                <li>Skills you export or create</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-white mb-2">What We DON'T Collect</h3>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Your source code (scans happen client-side)</li>
                                <li>GitHub repository contents beyond what's needed for scanning</li>
                                <li>Payment information (we don't charge)</li>
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
                                <p className="text-sm">AI-powered fix suggestions</p>
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
                        <li>Scan history is stored in your browser's localStorage (not on our servers)</li>
                        <li>We use HTTPS for all communications</li>
                        <li>GitHub tokens are never stored permanently</li>
                    </ul>
                </section>

                {/* Your Rights */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li><strong>Access:</strong> Request a copy of your data</li>
                        <li><strong>Deletion:</strong> Request deletion of your data</li>
                        <li><strong>Revoke Access:</strong> Revoke GitHub permissions at any time via GitHub settings</li>
                        <li><strong>Opt-out:</strong> Clear localStorage to remove local data</li>
                    </ul>
                </section>

                {/* GDPR */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">GDPR Compliance (EU Users)</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        If you are in the European Union, you have additional rights under GDPR including the right to access,
                        rectify, port, and erase your personal data. We process data based on your consent (GitHub OAuth authorization).
                    </p>
                </section>

                {/* Contact */}
                <section className="card p-6 border-[var(--accent)]/30">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-[var(--accent)]" />
                        Contact Us
                    </h2>
                    <p className="text-[var(--foreground-secondary)]">
                        For privacy-related questions or requests, contact us {" "}
                        <a href="mailto:privacy@vibelab.ai" className="text-[var(--accent)] hover:underline">

                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
