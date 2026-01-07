"use client";

import { useState, useEffect } from "react";
import { Key, Check, X, AlertCircle } from "lucide-react";
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from "@/lib/gemini";

interface ApiKeyInputProps {
    onKeySet?: () => void;
}

export default function ApiKeyInput({ onKeySet }: ApiKeyInputProps) {
    const [key, setKey] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setHasKey(hasApiKey());
    }, []);

    const handleSave = () => {
        if (!key.trim()) {
            setError("Please enter an API key");
            return;
        }

        if (!key.startsWith("AI")) {
            setError("Invalid API key format. Gemini keys start with 'AI'");
            return;
        }

        setApiKey(key.trim());
        setHasKey(true);
        setIsEditing(false);
        setKey("");
        setError(null);
        onKeySet?.();
    };

    const handleClear = () => {
        clearApiKey();
        setHasKey(false);
        setIsEditing(true);
    };

    if (hasKey && !isEditing) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <Check className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">Gemini API Key Connected</p>
                    <p className="text-xs text-[var(--foreground-muted)]">AI-powered generation is enabled</p>
                </div>
                <button onClick={handleClear} className="btn-ghost text-sm text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                    Remove
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-medium text-white">Connect Gemini API</h3>
            </div>

            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                Add your free Gemini API key for AI-powered generation.{" "}
                <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
                >
                    Get a free key →
                </a>
            </p>

            <div className="flex gap-2">
                <input
                    type="password"
                    value={key}
                    onChange={(e) => { setKey(e.target.value); setError(null); }}
                    placeholder="AIza..."
                    className="input flex-1"
                />
                <button onClick={handleSave} className="btn-primary">
                    Save Key
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <p className="text-xs text-[var(--foreground-muted)] mt-3">
                Your key is stored locally in your browser. VibeLab never sees or stores your API key.
            </p>
        </div>
    );
}
