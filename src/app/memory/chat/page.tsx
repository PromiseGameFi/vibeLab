"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Brain,
    Send,
    ArrowLeft,
    Sparkles,
    User,
    Loader2,
    BookOpen,
    Zap
} from "lucide-react";
import Link from "next/link";
import { memoryStore } from "@/lib/memoryStore";
import { Memory } from "@/lib/memoryTypes";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    memoriesUsed?: number;
    memoryTitles?: string[];
}

export default function MemoryChatPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMemories, setLoadingMemories] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load memories
    const loadMemories = useCallback(async () => {
        setLoadingMemories(true);
        try {
            const data = await memoryStore.getAll();
            setMemories(data);
        } catch (error) {
            console.error("Failed to load memories:", error);
        }
        setLoadingMemories(false);
    }, []);

    useEffect(() => {
        loadMemories();
    }, [loadMemories]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message
    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/memory/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    memories: memories,
                    history: messages.slice(-6).map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: Message = {
                id: `msg_${Date.now()}`,
                role: "assistant",
                content: data.response,
                memoriesUsed: data.memoriesUsed,
                memoryTitles: data.memoryTitles,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg_${Date.now()}`,
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/memory"
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-white">Chat with Memory</h1>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    {loadingMemories
                                        ? "Loading..."
                                        : `${memories.length} memories available`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {messages.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Ask anything about your memories
                            </h2>
                            <p className="text-[var(--foreground-secondary)] max-w-md mx-auto mb-8">
                                I'll search through your saved conversations and context to give you accurate, personalized answers.
                            </p>

                            {/* Suggested prompts */}
                            <div className="flex flex-wrap justify-center gap-2">
                                {[
                                    "What have I learned about APIs?",
                                    "Summarize my recent projects",
                                    "What decisions have I made?",
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setInput(prompt)}
                                        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-[var(--foreground-secondary)] transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <Brain className="w-4 h-4 text-purple-400" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] ${message.role === "user"
                                                ? "bg-blue-500/20 rounded-2xl rounded-br-sm"
                                                : "bg-white/5 rounded-2xl rounded-bl-sm"
                                            } px-4 py-3`}
                                    >
                                        <p className="text-[var(--foreground)] whitespace-pre-wrap">
                                            {message.content}
                                        </p>

                                        {message.memoriesUsed && message.memoriesUsed > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/10">
                                                <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    Used {message.memoriesUsed} memories
                                                </p>
                                                {message.memoryTitles && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {message.memoryTitles.slice(0, 3).map((title, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300"
                                                            >
                                                                {title.length > 30 ? title.slice(0, 30) + "..." : title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {message.role === "user" && (
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-blue-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                                        <p className="text-[var(--foreground-muted)]">Thinking...</p>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </main>

            {/* Input */}
            <footer className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                placeholder="Ask about your memories..."
                                className="input w-full pr-12"
                                disabled={loading || loadingMemories}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading || loadingMemories}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-center text-[var(--foreground-muted)] mt-2">
                        <Zap className="w-3 h-3 inline mr-1" />
                        Powered by your memories + Gemini AI
                    </p>
                </div>
            </footer>
        </div>
    );
}
