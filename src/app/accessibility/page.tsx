import Link from "next/link";
import { ArrowLeft, Accessibility, Eye, Keyboard, MessageSquare, Monitor, Volume2 } from "lucide-react";

export const metadata = {
    title: "Accessibility Statement | VibeLab",
    description: "VibeLab's commitment to accessibility and inclusive design.",
};

export default function AccessibilityPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 pb-24">
            <div className="mb-8">
                <Link href="/" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </div>

            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                        <Accessibility className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Accessibility Statement</h1>
                        <p className="text-[var(--foreground-secondary)]">Last updated: January 2026</p>
                    </div>
                </div>
            </header>

            <div className="prose prose-invert max-w-none space-y-8">
                {/* Commitment */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Our Commitment</h2>
                    <p className="text-[var(--foreground-secondary)]">
                        VibeLab is committed to ensuring digital accessibility for people with disabilities.
                        We are continually improving the user experience for everyone by applying relevant accessibility standards.
                    </p>
                </section>

                {/* Standards */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Conformance Status</h2>
                    <p className="text-[var(--foreground-secondary)] mb-4">
                        We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
                        These guidelines explain how to make web content more accessible for people with disabilities.
                    </p>
                </section>

                {/* Accessibility Features */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Accessibility Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Keyboard className="w-5 h-5 text-blue-400" />
                                <h3 className="font-medium text-white">Keyboard Navigation</h3>
                            </div>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                All interactive elements are accessible via keyboard navigation.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-5 h-5 text-purple-400" />
                                <h3 className="font-medium text-white">Color Contrast</h3>
                            </div>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Text meets WCAG AA contrast ratios for readability.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Monitor className="w-5 h-5 text-green-400" />
                                <h3 className="font-medium text-white">Screen Reader Support</h3>
                            </div>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Semantic HTML and ARIA labels for screen reader compatibility.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Volume2 className="w-5 h-5 text-orange-400" />
                                <h3 className="font-medium text-white">Reduced Motion</h3>
                            </div>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Respects prefers-reduced-motion for users sensitive to animations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* What We Do */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">What We're Doing</h2>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li>Using semantic HTML elements (nav, main, section, article)</li>
                        <li>Providing alt text for images and icons</li>
                        <li>Ensuring form inputs have proper labels</li>
                        <li>Maintaining focus indicators for keyboard users</li>
                        <li>Testing with screen readers (VoiceOver, NVDA)</li>
                        <li>Using ARIA attributes where needed</li>
                    </ul>
                </section>

                {/* Known Limitations */}
                <section className="card p-6 border-orange-500/30">
                    <h2 className="text-xl font-semibold text-white mb-4">Known Limitations</h2>
                    <p className="text-[var(--foreground-secondary)] mb-4">
                        We are actively working to address the following known accessibility limitations:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-[var(--foreground-secondary)]">
                        <li>Some complex interactive components may not be fully accessible</li>
                        <li>Third-party integrations (GitHub OAuth) may have their own accessibility issues</li>
                        <li>Older browser versions may not fully support all accessibility features</li>
                    </ul>
                </section>

                {/* Assistive Technologies */}
                <section className="card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Tested With</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["VoiceOver", "NVDA", "Chrome DevTools", "axe DevTools"].map(tool => (
                            <div key={tool} className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-center text-sm text-[var(--foreground-secondary)]">
                                {tool}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Feedback */}
                <section className="card p-6 border-[var(--accent)]/30">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
                        Feedback
                    </h2>
                    <p className="text-[var(--foreground-secondary)] mb-4">
                        We welcome your feedback on the accessibility of VibeLab. Please let us know if you encounter
                        accessibility barriers:
                    </p>
                    <ul className="text-[var(--foreground-secondary)] space-y-2">
                        <li>
                            Email:{" "}
                            <a href="mailto:accessibility@vibelab.ai" className="text-[var(--accent)] hover:underline">
                                accessibility@vibelab.ai
                            </a>
                        </li>
                    </ul>
                    <p className="text-[var(--foreground-secondary)] mt-4">
                        We try to respond to accessibility feedback within 5 business days.
                    </p>
                </section>

                {/* Links */}
                <div className="flex gap-4 pt-4">
                    <Link href="/terms" className="btn-ghost">Terms of Service</Link>
                    <Link href="/privacy" className="btn-ghost">Privacy Policy</Link>
                </div>
            </div>
        </div>
    );
}
