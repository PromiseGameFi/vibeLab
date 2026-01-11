// OpenCode Adapter - Integration with OpenCode CLI

import { spawn } from 'child_process';
import { IAdapter, AdapterType, ExecuteOptions, ExecuteResult, ExitSignal } from '../core/types';

/**
 * OpenCode Adapter
 * 
 * OpenCode is an open-source AI coding agent that runs in the terminal.
 * https://github.com/opencode-ai/opencode
 * 
 * It can be run via: opencode [prompt]
 */
export class OpenCodeAdapter implements IAdapter {
    name: AdapterType = 'opencode';
    private sessionId: string | null = null;

    /**
     * Check if opencode CLI is installed
     */
    async isAvailable(): Promise<boolean> {
        return new Promise(resolve => {
            const proc = spawn('which', ['opencode']);
            proc.on('close', code => resolve(code === 0));
            proc.on('error', () => resolve(false));
        });
    }

    /**
     * Get OpenCode version
     */
    async getVersion(): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn('opencode', ['--version']);
            let output = '';
            proc.stdout.on('data', data => output += data.toString());
            proc.on('close', code => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error('Failed to get version'));
                }
            });
            proc.on('error', reject);
        });
    }

    supportsSession(): boolean {
        return true;
    }

    /**
     * Execute OpenCode with the given prompt
     */
    async execute(options: ExecuteOptions): Promise<ExecuteResult> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const args: string[] = [];

            // Add non-interactive flag if available
            args.push('--non-interactive');

            // Add prompt
            args.push(options.prompt);

            const proc = spawn('opencode', args, {
                cwd: process.cwd(),
                env: process.env,
            });

            let stdout = '';
            let stderr = '';
            const filesChanged: string[] = [];
            const errors: string[] = [];
            const exitSignals: ExitSignal[] = [];

            proc.stdout.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;

                // Parse file changes from output
                const fileMatches = chunk.match(/(?:Created|Modified|Updated|Wrote)\s+[`']?([^\s`']+)[`']?/gi);
                if (fileMatches) {
                    fileMatches.forEach(match => {
                        const file = match.replace(/(?:Created|Modified|Updated|Wrote)\s+[`']?/i, '').replace(/[`']$/, '');
                        if (file && !filesChanged.includes(file)) {
                            filesChanged.push(file);
                        }
                    });
                }
            });

            proc.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            // Handle timeout
            const timeout = options.timeout || 15 * 60 * 1000;
            const timeoutId = setTimeout(() => {
                proc.kill('SIGTERM');
                reject(new Error(`Execution timed out after ${timeout / 1000}s`));
            }, timeout);

            proc.on('close', (code: number | null) => {
                clearTimeout(timeoutId);

                const duration = Date.now() - startTime;

                if (code !== 0 && stderr) {
                    errors.push(stderr.trim());
                }

                // Detect completion signals
                if (stdout.includes('All tasks complete') || stdout.includes('Done')) {
                    exitSignals.push({
                        type: 'done',
                        message: 'OpenCode signaled completion',
                        confidence: 0.9,
                    });
                }

                resolve({
                    success: code === 0,
                    output: stdout,
                    filesChanged,
                    duration,
                    exitSignals,
                    errors,
                });
            });

            proc.on('error', (err: Error) => {
                clearTimeout(timeoutId);
                reject(new Error(`OpenCode not found. Install via: npm install -g opencode`));
            });
        });
    }
}
