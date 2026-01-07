"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Bot,
    Copy,
    Check,
    Terminal,
    AlertTriangle,
    Sparkles
} from "lucide-react";

const agentScripts = [
    {
        id: "reply-mentions",
        name: "Reply to Top Mentions",
        description: "Generate personalized replies to your latest mentions",
        template: `// Browser Agent Script: Reply to Top Mentions
// Run this in your browser console while on X (twitter.com)

const mentions = document.querySelectorAll('[data-testid="tweet"]');
const topMentions = Array.from(mentions).slice(0, 5);

topMentions.forEach((tweet, i) => {
  const username = tweet.querySelector('[data-testid="User-Name"]')?.textContent;
  const content = tweet.querySelector('[data-testid="tweetText"]')?.textContent;
  
  console.log(\`[Mention \${i + 1}]\`);
  console.log(\`From: \${username}\`);
  console.log(\`Content: \${content?.slice(0, 100)}...\`);
  console.log(\`Suggested Reply: "Thanks for the mention! {YOUR_REPLY_HERE}"\`);
  console.log('---');
});`
    },
    {
        id: "like-followers",
        name: "Engage with Follower Posts",
        description: "Find and like recent posts from your followers",
        template: `// Browser Agent Script: Engage with Follower Posts
// Navigate to a follower's profile first, then run this

const tweets = document.querySelectorAll('[data-testid="tweet"]');
const recentTweets = Array.from(tweets).slice(0, 3);

console.log('Found', recentTweets.length, 'recent tweets to engage with:');

recentTweets.forEach((tweet, i) => {
  const content = tweet.querySelector('[data-testid="tweetText"]')?.textContent;
  const likeButton = tweet.querySelector('[data-testid="like"]');
  
  console.log(\`[Tweet \${i + 1}]: \${content?.slice(0, 50)}...\`);
  
  // Uncomment to auto-like:
  // likeButton?.click();
});`
    },
    {
        id: "draft-thread",
        name: "Quick Thread Drafter",
        description: "Open X compose with a pre-formatted thread structure",
        template: `// Browser Agent Script: Quick Thread Drafter
// Run on X homepage to open compose with structure

const composeButton = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
composeButton?.click();

setTimeout(() => {
  const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (textarea) {
    textarea.focus();
    document.execCommand('insertText', false, 
      '🧵 Thread: [YOUR TITLE HERE]\\n\\n1/');
  }
}, 500);

console.log('Compose opened! Start your thread.');`
    },
    {
        id: "extract-analytics",
        name: "Extract Post Analytics",
        description: "Scrape engagement metrics from your recent posts",
        template: `// Browser Agent Script: Extract Post Analytics
// Navigate to your profile first, then run this

const tweets = document.querySelectorAll('[data-testid="tweet"]');
const analytics = [];

tweets.forEach((tweet, i) => {
  if (i >= 5) return; // Limit to 5 posts
  
  const content = tweet.querySelector('[data-testid="tweetText"]')?.textContent;
  const stats = tweet.querySelectorAll('[data-testid="app-text-transition-container"]');
  
  analytics.push({
    content: content?.slice(0, 50) + '...',
    replies: stats[0]?.textContent || '0',
    retweets: stats[1]?.textContent || '0',
    likes: stats[2]?.textContent || '0',
    views: stats[3]?.textContent || '0'
  });
});

console.table(analytics);
console.log('Copy this data to your spreadsheet for tracking!');`
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
        <div className="max-w-4xl mx-auto px-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)] bg-opacity-10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-[var(--accent-secondary)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Browser Agent</h1>
                        <p className="text-[var(--foreground-secondary)] text-sm">Automated browser scripts for X engagement</p>
                    </div>
                </div>
            </header>

            {/* Warning */}
            <section className="mb-10 p-5 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Use Responsibly</h3>
                        <p className="text-yellow-700 dark:text-yellow-400/80 text-sm">These scripts run in your browser console for personal automation. Don't spam or violate X's Terms of Service.</p>
                    </div>
                </div>
            </section>

            {/* Scripts */}
            <section className="space-y-6">
                {agentScripts.map(script => (
                    <div key={script.id} className="vibe-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{script.name}</h3>
                                <p className="text-[var(--foreground-secondary)] text-sm">{script.description}</p>
                            </div>
                            <button
                                onClick={() => copyScript(script.id, script.template)}
                                className="vibe-btn-primary flex items-center gap-2 text-sm"
                            >
                                {copied === script.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied === script.id ? "Copied!" : "Copy"}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute top-3 left-4 flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                                <Terminal className="w-3 h-3" />
                                JavaScript
                            </div>
                            <pre className="bg-[var(--background-secondary)] rounded-xl p-5 pt-10 overflow-x-auto text-xs text-[var(--foreground-secondary)] font-mono border border-[var(--border)]">
                                {script.template}
                            </pre>
                        </div>
                    </div>
                ))}
            </section>

            {/* How to Use */}
            <section className="mt-10 p-6 rounded-xl bg-[var(--accent-primary)] bg-opacity-5 border border-[var(--accent-primary)] border-opacity-20">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-[var(--accent-primary)] mb-2">How to Use</h3>
                        <ol className="text-[var(--foreground-secondary)] text-sm space-y-1.5">
                            <li>1. Copy a script above</li>
                            <li>2. Open X (twitter.com) in your browser</li>
                            <li>3. Open Developer Tools (F12 or Cmd+Opt+I)</li>
                            <li>4. Go to the Console tab</li>
                            <li>5. Paste and run the script</li>
                        </ol>
                    </div>
                </div>
            </section>
        </div>
    );
}
