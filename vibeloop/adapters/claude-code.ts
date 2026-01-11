// Claude Code Adapter - Integration with Anthropic's Claude CLI

import { spawn } from 'child_process';
import { IAdapter, AdapterType, ExecuteOptions, ExecuteResult, ExitSignal } from '../core/types';

export class ClaudeCodeAdapter implements IAdapter {
    name: AdapterType = 'claude-code';
    private sessionId: string | null = null;

    /**
     * Check if claude CLI is installed and accessible
     */
    async isAvailable(): Promise<boolean> {
        return new Promise(resolve => {
            const proc = spawn('which', ['claude']);
            proc.on('close', code => resolve(code === 0));
            proc.on('error', () => resolve(false));
        });
    }

    /**
     * Get Claude CLI version
     */
    async getVersion(): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn('claude', ['--version']);
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
     * Execute Claude Code with the given prompt
     */
    async execute(options: ExecuteOptions): Promise<ExecuteResult> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const args = ['--print'];

            // Add session continuation if available
            if (options.sessionId || this.sessionId) {
                args.push('--continue');
            }

            // Add the prompt
            args.push(options.prompt);

            const proc = spawn('claude', args, {
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

                // Detect session ID
                const sessionMatch = chunk.match(/session[:\s]+([a-zA-Z0-9-]+)/i);
                if (sessionMatch) {
                    this.sessionId = sessionMatch[1];
                }
            });

            proc.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            // Handle timeout
            const timeout = options.timeout || 15 * 60 * 1000; // 15 min default
            const timeoutId = setTimeout(() => {
                proc.kill('SIGTERM');
                reject(new Error(`Execution timed out after ${timeout / 1000}s`));
            }, timeout);

            proc.on('close', (code: number | null) => {
                clearTimeout(timeoutId);

                const duration = Date.now() - startTime;

                // Parse errors
                if (code !== 0 && stderr) {
                    errors.push(stderr.trim());
                }

                // Check for rate limit errors
                if (stdout.includes('rate limit') || stderr.includes('rate limit')) {
                    exitSignals.push({
                        type: 'limit-reached',
                        message: 'API rate limit reached',
                        confidence: 0.95,
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
                reject(err);
            });
        });
    }
}
