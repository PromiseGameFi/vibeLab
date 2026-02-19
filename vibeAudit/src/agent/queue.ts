/**
 * Agent Queue — Priority target queue
 * Scores and prioritizes contracts for the attack pipeline.
 */

export interface QueueTarget {
    address: string;
    chain: string;
    rpcUrl: string;
    source?: string;
    bytecodeHash?: string;
    name?: string;
    balance: string;
    priority: number;         // Higher = attack sooner
    addedAt: string;
    origin: 'watcher' | 'mempool' | 'manual' | 'mev-scan';
    metadata?: Record<string, any>;
}

// ─── Priority Queue ─────────────────────────────────────────────────

export class TargetQueue {
    private queue: QueueTarget[] = [];
    private seen: Set<string> = new Set();   // Dedup by address+chain
    private maxSize: number;

    constructor(maxSize: number = 500) {
        this.maxSize = maxSize;
    }

    /**
     * Add a target to the queue. Deduplicates by address+chain.
     * Returns true if added, false if already in queue.
     */
    add(target: QueueTarget): boolean {
        const key = `${target.chain}:${target.address.toLowerCase()}`;
        if (this.seen.has(key)) return false;

        this.seen.add(key);
        this.queue.push(target);

        // Keep sorted by priority (highest first)
        this.queue.sort((a, b) => b.priority - a.priority);

        // Trim if too large
        if (this.queue.length > this.maxSize) {
            const removed = this.queue.pop()!;
            const removedKey = `${removed.chain}:${removed.address.toLowerCase()}`;
            this.seen.delete(removedKey);
        }

        return true;
    }

    /**
     * Get and remove the highest priority target.
     */
    next(): QueueTarget | null {
        const target = this.queue.shift() || null;
        if (target) {
            const key = `${target.chain}:${target.address.toLowerCase()}`;
            this.seen.delete(key);
        }
        return target;
    }

    /**
     * Peek at the top N targets without removing.
     */
    peek(n: number = 5): QueueTarget[] {
        return this.queue.slice(0, n);
    }

    /**
     * Check if a specific address is already queued.
     */
    has(address: string, chain: string): boolean {
        const key = `${chain}:${address.toLowerCase()}`;
        return this.seen.has(key);
    }

    /**
     * Remove a specific target by address.
     */
    remove(address: string, chain: string): boolean {
        const key = `${chain}:${address.toLowerCase()}`;
        if (!this.seen.has(key)) return false;

        this.seen.delete(key);
        this.queue = this.queue.filter(
            t => !(t.address.toLowerCase() === address.toLowerCase() && t.chain === chain)
        );
        return true;
    }

    get size(): number {
        return this.queue.length;
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    clear(): void {
        this.queue = [];
        this.seen.clear();
    }

    /**
     * Get queue snapshot for dashboard.
     */
    snapshot(): { size: number; topTargets: QueueTarget[] } {
        return {
            size: this.queue.length,
            topTargets: this.queue.slice(0, 10),
        };
    }
}

// ─── Priority Scoring ───────────────────────────────────────────────

/**
 * Calculate priority score for a target.
 * Higher score = attack sooner.
 */
export function calculatePriority(params: {
    balance: string;              // ETH balance
    hasSource: boolean;           // Verified source available?
    bytecodeSize: number;         // Contract size in bytes
    isNew: boolean;               // Newly deployed?
    knownVulnPatterns?: string[]; // Categories from memory that historically work
}): number {
    let score = 0;

    // Balance is king: more money = higher priority
    const balanceEth = parseFloat(params.balance) || 0;
    if (balanceEth >= 100) score += 50;
    else if (balanceEth >= 10) score += 40;
    else if (balanceEth >= 1) score += 30;
    else if (balanceEth >= 0.1) score += 15;
    else score += 5;

    // Having source code makes analysis much better
    if (params.hasSource) score += 20;

    // Medium-size contracts are most interesting
    // (too small = proxy/minimal, too large = complex library)
    if (params.bytecodeSize >= 500 && params.bytecodeSize <= 10000) score += 15;
    else if (params.bytecodeSize >= 100 && params.bytecodeSize <= 30000) score += 8;

    // Fresh deployments are prime targets
    if (params.isNew) score += 15;

    // Bonus for contracts matching historically successful patterns
    if (params.knownVulnPatterns && params.knownVulnPatterns.length > 0) {
        score += Math.min(params.knownVulnPatterns.length * 5, 20);
    }

    return Math.min(score, 100);
}
