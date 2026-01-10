import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Simple token estimation
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Search memories for relevant context
function searchMemories(memories: Memory[], query: string, maxTokens: number = 4000): Memory[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Score memories by relevance
    const scored = memories.map(memory => {
        let score = 0;
        const content = (memory.title + ' ' + memory.content + ' ' + memory.tags.join(' ')).toLowerCase();

        // Exact phrase match
        if (content.includes(queryLower)) {
            score += 10;
        }

        // Word matches
        queryWords.forEach(word => {
            if (content.includes(word)) {
                score += 2;
            }
        });

        // Recency boost
        const ageHours = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 5 - ageHours / 24);

        return { memory, score };
    });

    // Sort by score and select within token budget
    scored.sort((a, b) => b.score - a.score);

    const selected: Memory[] = [];
    let totalTokens = 0;

    for (const { memory, score } of scored) {
        if (score === 0) continue;

        const tokens = memory.summaryTokenCount || memory.tokenCount;
        if (totalTokens + tokens <= maxTokens) {
            selected.push(memory);
            totalTokens += tokens;
        }
    }

    return selected;
}

// Format memories as context
function formatContext(memories: Memory[]): string {
    if (memories.length === 0) return '';

    return memories.map(m => {
        const content = m.summary || m.content;
        return `## ${m.title}\nSource: ${m.source}\n\n${content}`;
    }).join('\n\n---\n\n');
}

interface Memory {
    id: string;
    title: string;
    content: string;
    summary?: string;
    tags: string[];
    source: string;
    createdAt: string;
    tokenCount: number;
    summaryTokenCount?: number;
}

interface ChatRequest {
    message: string;
    memories: Memory[];
    history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: NextRequest) {
    try {
        const { message, memories, history = [] }: ChatRequest = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        // Search for relevant memories
        const relevantMemories = searchMemories(memories, message, 3000);
        const context = formatContext(relevantMemories);

        // Build the prompt
        const systemPrompt = `You are a helpful AI assistant with access to the user's saved memories. 
Use the provided context to answer questions accurately. If the context doesn't contain relevant information, 
say so and provide your best general knowledge answer.

Be concise but thorough. Reference specific memories when relevant.`;

        const contextSection = context
            ? `\n\n## Your Memories (${relevantMemories.length} relevant):\n\n${context}`
            : '\n\n(No relevant memories found for this query)';

        // Build conversation history
        const historyText = history.map(h =>
            `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`
        ).join('\n\n');

        const fullPrompt = `${systemPrompt}${contextSection}

${historyText ? `## Previous Conversation:\n${historyText}\n\n` : ''}## Current Question:
${message}

Answer:`;

        // Call Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        return NextResponse.json({
            response,
            memoriesUsed: relevantMemories.length,
            memoryTitles: relevantMemories.map(m => m.title),
            tokensUsed: estimateTokens(fullPrompt)
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
