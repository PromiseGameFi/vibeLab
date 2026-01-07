"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Copy, Check, Terminal, AlertTriangle, Sparkles } from "lucide-react";

const agentScripts = [
    {
        id: "reply-mentions",
        name: "Reply to Top Mentions",
        description: "Generate personalized replies to your latest mentions",
        template: `// Reply to Top Mentions
const mentions = document.querySelectorAll('[data-testid="tweet"]');
mentions.forEach((tweet, i) => {
  if (i >= 5) return;
  const username = tweet.querySelector('[data-testid="User-Name"]')?.textContent;
  console.log(\`Mention from: \${username}\`);
});`
    },
    {
        id: "like-followers",
        name: "Engage with Followers",
        description: "Find and like recent posts from your followers",
        template: `// Engage with Follower Posts
const tweets = document.querySelectorAll('[data-testid="tweet"]');
tweets.forEach((tweet, i) => {
  if (i >= 3) return;
  const content = tweet.querySelector('[data-testid="tweetText"]')?.textContent;
  console.log(\`Tweet: \${content?.slice(0, 50)}...\`);
});`
    },
    {
        id: "extract-analytics",
        name: "Extract Analytics",
        description: "Scrape engagement metrics from your posts",
        template: `// Extract Post Analytics
const tweets = document.querySelectorAll('[data-testid="tweet"]');
const analytics = [];
tweets.forEach((tweet, i) => {
  if (i >= 5) return;
  const stats = tweet.querySelectorAll('[data-testid="app-text-transition-container"]');
  analytics.push({ replies: stats[0]?.textContent, retweets: stats[1]?.textContent });
});
console.table(analytics);`
    }
];

export default function AgentPage() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyScript = (id: string, script: string) => {
        navigator.clipboard.writeText(script);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/vibeMarket" className="btn-ghost text-[var(--foreground-secondary)]">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-secondary)] bg-opacity-20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Browser Agent</h1>
                        <p className="text-[var(--foreground-secondary)]">Automated scripts for X</p>
                    </div>
                </div>
            </header>

            {/* Warning */}
            <div className="card p-5 mb-10 border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-500 mb-1">Use Responsibly</h3>
                        <p className="text-[var(--foreground-secondary)] text-sm">
                            These scripts run in your browser console. Don't spam or violate X's Terms of Service.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scripts */}
            <section className="space-y-6">
                {agentScripts.map(script => (
                    <div key={script.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">{script.name}</h3>
                                <p className="text-[var(--foreground-secondary)] text-sm">{script.description}</p>
                            </div>
                            <button
                                onClick={() => copyScript(script.id, script.template)}
                                className="btn-primary text-sm"
                            >
                                {copied === script.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied === script.id ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                <Terminal className="w-3 h-3" />
                                JavaScript
                            </div>
                            <pre className="bg-black/50 rounded-xl p-5 pt-10 overflow-x-auto text-xs text-[var(--foreground-secondary)] font-mono border border-[var(--border)]">
                                {script.template}
                            </pre>
                        </div>
                    </div>
                ))}
            </section>

            {/* How to Use */}
            <div className="card p-6 mt-10 border-[var(--accent)]/30 bg-[var(--accent)]/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent)] mb-2">How to Use</h3>
                        <ol className="text-[var(--foreground-secondary)] text-sm space-y-1">
                            <li>1. Copy a script above</li>
                            <li>2. Open X (twitter.com)</li>
                            <li>3. Open Developer Tools (F12)</li>
                            <li>4. Paste in Console and run</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
