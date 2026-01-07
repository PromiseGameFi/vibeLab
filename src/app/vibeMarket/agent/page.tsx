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
            <div className="flex items-center justify-between mb-12">
                <Link
                    href="/vibeMarket"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to VibeMarket
                </Link>
            </div>

            {/* Title */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-secondary/20 flex items-center justify-center text-accent-secondary">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black">Browser Agent</h1>
                        <p className="text-white/40 text-sm">Automated browser scripts for X engagement</p>
                    </div>
                </div>
            </header>

            {/* Warning */}
            <section className="mb-12 p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-500 mb-1">Use Responsibly</h3>
                        <p className="text-white/60 text-sm">These scripts run in your browser console for personal automation. Don't spam or violate X's Terms of Service. Use for productivity, not manipulation.</p>
                    </div>
                </div>
            </section>

            {/* Scripts */}
            <section className="space-y-6">
                {agentScripts.map(script => (
                    <div key={script.id} className="vibe-glass rounded-3xl p-6 border border-white/5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold mb-1">{script.name}</h3>
                                <p className="text-white/40 text-sm">{script.description}</p>
                            </div>
                            <button
                                onClick={() => copyScript(script.id, script.template)}
                                className="px-4 py-2 rounded-xl bg-accent-secondary/20 border border-accent-secondary/30 text-accent-secondary text-sm font-bold hover:bg-accent-secondary hover:text-white transition-all flex items-center gap-2"
                            >
                                {copied === script.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied === script.id ? "Copied!" : "Copy Script"}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-white/20">
                                <Terminal className="w-3 h-3" />
                                JavaScript
                            </div>
                            <pre className="bg-black/40 rounded-xl p-6 pt-10 overflow-x-auto text-xs text-white/60 font-mono">
                                {script.template}
                            </pre>
                        </div>
                    </div>
                ))}
            </section>

            {/* How to Use */}
            <section className="mt-12 p-6 rounded-3xl bg-accent-primary/5 border border-accent-primary/10">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-accent-primary mb-2">How to Use</h3>
                        <ol className="text-white/60 text-sm space-y-2">
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
