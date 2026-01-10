import { NextRequest, NextResponse } from 'next/server';

interface Memory {
    id: string;
    title: string;
    content: string;
    summary?: string;
    tags: string[];
    source: string;
    sourceUrl?: string;
    createdAt: string;
    updatedAt: string;
    tokenCount: number;
    summaryTokenCount?: number;
    relevanceScore: number;
    tier: string;
}

interface SyncRequest {
    action: 'add' | 'getAll' | 'delete';
    memory?: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'relevanceScore' | 'tier'>;
    id?: string;
}

// Simple token estimation
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Generate summary
function generateSummary(content: string, maxLength: number = 200): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let summary = '';
    for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence.trim() + '. ';
    }
    return summary.trim() || content.slice(0, maxLength) + '...';
}

// Generate ID
function generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory store (will be replaced by proper DB in production)
// For now, we use a simple approach - extension saves to chrome.storage AND calls this API
// The API just returns success - real sync would involve a database
let memoryCache: Memory[] = [];

export async function POST(request: NextRequest) {
    try {
        const { action, memory, id }: SyncRequest = await request.json();

        if (action === 'add' && memory) {
            const now = new Date().toISOString();
            const newMemory: Memory = {
                id: generateId(),
                title: memory.title,
                content: memory.content,
                summary: generateSummary(memory.content),
                tags: memory.tags || [],
                source: memory.source || 'other',
                sourceUrl: memory.sourceUrl,
                createdAt: now,
                updatedAt: now,
                tokenCount: estimateTokens(memory.content),
                summaryTokenCount: estimateTokens(generateSummary(memory.content)),
                relevanceScore: 100,
                tier: 'hot',
            };

            memoryCache.unshift(newMemory);

            return NextResponse.json({
                success: true,
                memory: newMemory,
            });
        }

        if (action === 'getAll') {
            return NextResponse.json({
                success: true,
                memories: memoryCache,
            });
        }

        if (action === 'delete' && id) {
            memoryCache = memoryCache.filter(m => m.id !== id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Sync API error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}

// GET endpoint for fetching memories
export async function GET() {
    return NextResponse.json({
        success: true,
        memories: memoryCache,
        count: memoryCache.length,
    });
}
