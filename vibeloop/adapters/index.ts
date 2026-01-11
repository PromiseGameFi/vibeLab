// Adapter registry and exports

export { ClaudeCodeAdapter } from './claude-code';

import { IAdapter, AdapterType } from '../core/types';
import { ClaudeCodeAdapter } from './claude-code';

// Factory function to get adapter by type
export function getAdapter(type: AdapterType): IAdapter {
    switch (type) {
        case 'claude-code':
            return new ClaudeCodeAdapter();
        case 'cursor':
            throw new Error('Cursor adapter not yet implemented');
        case 'antigravity':
            throw new Error('Antigravity adapter not yet implemented');
        case 'opencode':
            throw new Error('OpenCode adapter not yet implemented');
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

    // Add more adapters as they're implemented

    return adapters;
}
