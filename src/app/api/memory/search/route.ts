import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

interface Memory {
    id: string;
    title: string;
    content: string;
    summary?: string;
    embedding?: number[];
    [key: string]: unknown;
}

interface SearchRequest {
    query: string;
    memories: Memory[];
    maxResults?: number;
}

export async function POST(request: NextRequest) {
    try {
        const { query, memories, maxResults = 5 }: SearchRequest = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Get embedding model
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        // Generate query embedding
        const queryResult = await model.embedContent(query);
        const queryEmbedding = queryResult.embedding.values;

        // Generate embeddings for memories that don't have them
        const memoriesWithEmbeddings = await Promise.all(
            memories.map(async (memory) => {
                if (memory.embedding && memory.embedding.length > 0) {
                    return memory;
                }

                // Generate embedding for this memory
                const text = `${memory.title}\n${memory.summary || memory.content.slice(0, 500)}`;
                try {
                    const result = await model.embedContent(text);
                    return { ...memory, embedding: result.embedding.values };
                } catch {
                    return { ...memory, embedding: [] };
                }
            })
        );

        // Compute similarity scores
        const scored = memoriesWithEmbeddings
            .filter(m => m.embedding && m.embedding.length > 0)
            .map(memory => ({
                memory,
                score: cosineSimilarity(queryEmbedding, memory.embedding!)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);

        return NextResponse.json({
            results: scored.map(({ memory, score }) => ({
                id: memory.id,
                title: memory.title,
                summary: memory.summary,
                score: Math.round(score * 100) / 100,
                embedding: memory.embedding
            })),
            queryEmbedding
        });

    } catch (error) {
        console.error('Semantic search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
