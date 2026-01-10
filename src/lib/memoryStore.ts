// Memory Store - IndexedDB-based storage with token optimization
import {
    Memory,
    MemorySource,
    MemoryTier,
    MemoryExportOptions,
    MemoryExportResult,
    MemoryStats
} from './memoryTypes';

const DB_NAME = 'vibelab-memory';
const DB_VERSION = 1;
const STORE_NAME = 'memories';

// Simple token estimation (roughly 4 chars per token)
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Generate unique ID
function generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate relevance score based on recency and usage
function calculateRelevance(memory: Memory): number {
    const now = Date.now();
    const ageMs = now - new Date(memory.createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Decay: 100 for new, drops by 10 per day
    const recencyScore = Math.max(0, 100 - (ageHours / 24) * 10);

    return Math.round(recencyScore);
}

// Determine tier based on age
function calculateTier(createdAt: Date): MemoryTier {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 1) return 'hot';
    if (ageDays < 7) return 'warm';
    return 'cold';
}

// Simple summarization (rule-based MVP)
export function generateSummary(content: string, maxLength: number = 200): string {
    // Take first paragraph or sentences up to maxLength
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let summary = '';

    for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence.trim() + '. ';
    }

    return summary.trim() || content.slice(0, maxLength) + '...';
}

class MemoryStore {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('source', 'source', { unique: false });
                    store.createIndex('tier', 'tier', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        await this.init();
        const tx = this.db!.transaction(STORE_NAME, mode);
        return tx.objectStore(STORE_NAME);
    }

    // Create a new memory
    async add(input: {
        title: string;
        content: string;
        tags?: string[];
        source?: MemorySource;
        sourceUrl?: string;
    }): Promise<Memory> {
        const now = new Date();
        const content = input.content;
        const summary = generateSummary(content);

        const memory: Memory = {
            id: generateId(),
            title: input.title,
            content,
            summary,
            tags: input.tags || [],
            source: input.source || 'manual',
            sourceUrl: input.sourceUrl,
            createdAt: now,
            updatedAt: now,
            tokenCount: estimateTokens(content),
            summaryTokenCount: estimateTokens(summary),
            relevanceScore: 100,
            tier: 'hot'
        };

        const store = await this.getStore('readwrite');

        return new Promise((resolve, reject) => {
            const request = store.add(memory);
            request.onsuccess = () => resolve(memory);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all memories
    async getAll(): Promise<Memory[]> {
        const store = await this.getStore();

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const memories = request.result.map((m: Memory) => ({
                    ...m,
                    relevanceScore: calculateRelevance(m),
                    tier: calculateTier(m.createdAt)
                }));
                resolve(memories.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get single memory
    async get(id: string): Promise<Memory | null> {
        const store = await this.getStore();

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Update memory
    async update(id: string, updates: Partial<Memory>): Promise<Memory | null> {
        const existing = await this.get(id);
        if (!existing) return null;

        const updated: Memory = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
        };

        // Recalculate tokens if content changed
        if (updates.content) {
            updated.tokenCount = estimateTokens(updates.content);
            updated.summary = generateSummary(updates.content);
            updated.summaryTokenCount = estimateTokens(updated.summary);
        }

        const store = await this.getStore('readwrite');

        return new Promise((resolve, reject) => {
            const request = store.put(updated);
            request.onsuccess = () => resolve(updated);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete memory
    async delete(id: string): Promise<boolean> {
        const store = await this.getStore('readwrite');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Search memories
    async search(query: string): Promise<Memory[]> {
        const all = await this.getAll();
        const q = query.toLowerCase();

        return all.filter(m =>
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q) ||
            m.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    // Filter by tags
    async filterByTags(tags: string[]): Promise<Memory[]> {
        const all = await this.getAll();
        return all.filter(m =>
            tags.some(tag => m.tags.includes(tag))
        );
    }

    // Export with token budget
    async export(options: MemoryExportOptions): Promise<MemoryExportResult> {
        let memories = await this.getAll();

        // Apply filters
        if (options.filterTags?.length) {
            memories = memories.filter(m =>
                options.filterTags!.some(tag => m.tags.includes(tag))
            );
        }

        if (options.filterSources?.length) {
            memories = memories.filter(m =>
                options.filterSources!.includes(m.source)
            );
        }

        // Sort
        switch (options.sortBy) {
            case 'relevance':
                memories.sort((a, b) => b.relevanceScore - a.relevanceScore);
                break;
            case 'recency':
                memories.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
            case 'tokens':
                memories.sort((a, b) => a.tokenCount - b.tokenCount);
                break;
        }

        // Select within token budget
        const selected: Memory[] = [];
        let totalTokens = 0;

        for (const memory of memories) {
            const tokens = options.includeFullContent
                ? memory.tokenCount
                : (memory.summaryTokenCount || memory.tokenCount);

            if (totalTokens + tokens <= options.maxTokens) {
                selected.push(memory);
                totalTokens += tokens;
            }
        }

        // Format context
        const formattedContext = selected.map(m => {
            const content = options.includeFullContent ? m.content : (m.summary || m.content);
            return `## ${m.title}\n${content}`;
        }).join('\n\n---\n\n');

        return {
            memories: selected,
            formattedContext,
            totalTokens,
            memoriesIncluded: selected.length,
            memoriesExcluded: memories.length - selected.length
        };
    }

    // Get stats
    async getStats(): Promise<MemoryStats> {
        const all = await this.getAll();

        const stats: MemoryStats = {
            totalMemories: all.length,
            totalTokens: all.reduce((sum, m) => sum + m.tokenCount, 0),
            bySource: {} as Record<MemorySource, number>,
            byTag: {},
            byTier: { hot: 0, warm: 0, cold: 0 }
        };

        for (const memory of all) {
            // Count by source
            stats.bySource[memory.source] = (stats.bySource[memory.source] || 0) + 1;

            // Count by tag
            for (const tag of memory.tags) {
                stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
            }

            // Count by tier
            stats.byTier[memory.tier]++;
        }

        return stats;
    }
}

// Singleton instance
export const memoryStore = new MemoryStore();
