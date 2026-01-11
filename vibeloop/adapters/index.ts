// Adapter registry and exports

export { ClaudeCodeAdapter } from './claude-code';
export { CursorAdapter } from './cursor';
export { OpenCodeAdapter } from './opencode';
export { AntigravityAdapter } from './antigravity';

import { IAdapter, AdapterType } from '../core/types';
import { ClaudeCodeAdapter } from './claude-code';
import { CursorAdapter } from './cursor';
import { OpenCodeAdapter } from './opencode';
import { AntigravityAdapter } from './antigravity';

// Factory function to get adapter by type
export function getAdapter(type: AdapterType): IAdapter {
    switch (type) {
        case 'claude-code':
            return new ClaudeCodeAdapter();
        case 'cursor':
            return new CursorAdapter();
        case 'opencode':
            return new OpenCodeAdapter();
        case 'antigravity':
            return new AntigravityAdapter();
        case 'copilot':
            throw new Error('Copilot adapter not yet implemented');
        default:
            throw new Error(`Unknown adapter type: ${type}`);
    }
}

// Get available adapters
export async function getAvailableAdapters(): Promise<AdapterType[]> {
    const adapters: AdapterType[] = [];

    const claudeAdapter = new ClaudeCodeAdapter();
    if (await claudeAdapter.isAvailable()) {
        adapters.push('claude-code');
    }

    const cursorAdapter = new CursorAdapter();
    if (await cursorAdapter.isAvailable()) {
        adapters.push('cursor');
    }

    const openCodeAdapter = new OpenCodeAdapter();
    if (await openCodeAdapter.isAvailable()) {
        adapters.push('opencode');
    }

    const antigravityAdapter = new AntigravityAdapter();
    if (await antigravityAdapter.isAvailable()) {
        adapters.push('antigravity');
    }

    return adapters;
}

// Get adapter info
export function getAdapterInfo(): Array<{ type: AdapterType; name: string; status: string }> {
    return [
        { type: 'claude-code', name: 'Claude Code', status: '✅ Ready' },
        { type: 'cursor', name: 'Cursor', status: '⚠️ Experimental' },
        { type: 'opencode', name: 'OpenCode', status: '⚠️ Experimental' },
        { type: 'antigravity', name: 'Antigravity', status: '🔜 Coming Soon' },
        { type: 'copilot', name: 'GitHub Copilot', status: '🔜 Coming Soon' },
    ];
}
