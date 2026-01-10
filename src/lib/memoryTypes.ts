// Memory Types for VibeLab AI Memory

export interface Memory {
    id: string;
    title: string;
    content: string;
    summary?: string;  // Compressed version for token efficiency
    tags: string[];
    source: MemorySource;
    sourceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    tokenCount: number;
    summaryTokenCount?: number;
    relevanceScore: number;  // 0-100, for smart export
    tier: MemoryTier;
}

export type MemorySource =
    | 'manual'
    | 'chatgpt'
    | 'claude'
    | 'gemini'
    | 'cursor'
    | 'other';

export type MemoryTier =
    | 'hot'    // Recent, full detail
    | 'warm'   // This week, summarized
    | 'cold';  // Older, archived

export interface MemoryExportOptions {
    maxTokens: number;
    includeFullContent: boolean;
    filterTags?: string[];
    filterSources?: MemorySource[];
    sortBy: 'relevance' | 'recency' | 'tokens';
}

export interface MemoryExportResult {
    memories: Memory[];
    formattedContext: string;
    totalTokens: number;
    memoriesIncluded: number;
    memoriesExcluded: number;
}

export interface MemoryStats {
    totalMemories: number;
    totalTokens: number;
    bySource: Record<MemorySource, number>;
    byTag: Record<string, number>;
    byTier: Record<MemoryTier, number>;
}

// Default tags for organization
export const DEFAULT_TAGS = [
    'project',
    'code',
    'ideas',
    'personal',
    'api',
    'debug',
    'design',
    'research'
] as const;

// Source display config
export const SOURCE_CONFIG: Record<MemorySource, { label: string; color: string; icon: string }> = {
    manual: { label: 'Manual', color: 'text-gray-400', icon: '✏️' },
    chatgpt: { label: 'ChatGPT', color: 'text-green-400', icon: '🤖' },
    claude: { label: 'Claude', color: 'text-orange-400', icon: '🧠' },
    gemini: { label: 'Gemini', color: 'text-blue-400', icon: '✨' },
    cursor: { label: 'Cursor', color: 'text-purple-400', icon: '💻' },
    other: { label: 'Other', color: 'text-gray-400', icon: '📝' }
};

// Tier display config
export const TIER_CONFIG: Record<MemoryTier, { label: string; color: string }> = {
    hot: { label: 'Recent', color: 'text-red-400' },
    warm: { label: 'This Week', color: 'text-yellow-400' },
    cold: { label: 'Archived', color: 'text-blue-400' }
};
