// Cursor Adapter - Integration with Cursor IDE

import { spawn } from 'child_process';
import { IAdapter, AdapterType, ExecuteOptions, ExecuteResult, ExitSignal } from '../core/types';

/**
 * Cursor Adapter
 * 
 * Cursor can be automated via:
 * 1. CLI mode: `cursor --help` for commands
 * 2. Extension API if running as VS Code extension
 * 3. MCP (Model Context Protocol) for external tool integration
 * 
 * This adapter uses the Cursor CLI for headless automation.
 */
export class CursorAdapter implements IAdapter {
    name: AdapterType = 'cursor';
    private sessionId: string | null = null;

    /**
     * Check if Cursor CLI is installed and accessible
     */
    async isAvailable(): Promise<boolean> {
        return new Promise(resolve => {
            // Try common Cursor CLI paths
            const paths = ['cursor', '/Applications/Cursor.app/Contents/MacOS/Cursor'];

            const tryPath = (index: number) => {
                if (index >= paths.length) {
                    resolve(false);
                    return;
                }

                const proc = spawn('which', [paths[index]]);
                proc.on('close', code => {
                    if (code === 0) {
                        resolve(true);
                    } else {
                        tryPath(index + 1);
                    }
                });
                proc.on('error', () => tryPath(index + 1));
            };

            tryPath(0);
        });
    }

    /**
     * Get Cursor version
     */
    async getVersion(): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn('cursor', ['--version']);
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
        return false; // Cursor doesn't have native session support like Claude
    }

    /**
     * Execute a prompt in Cursor
     * 
     * Note: Cursor's CLI primarily opens the GUI. For true headless operation,
     * we can use the Composer feature via keybindings or MCP integration.
     * 
     * This implementation uses a workaround approach:
     * 1. Write prompt to a file
     * 2. Open Cursor with the file
     * 3. Monitor for file changes as output
     */
    async execute(options: ExecuteOptions): Promise<ExecuteResult> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            // For Cursor, we use the --goto flag to open specific files
            // and rely on Cursor's AI features being triggered manually or via extensions

            // In a full implementation, this would:
            // 1. Use Cursor's extension API if available
            // 2. Use MCP to communicate with Cursor
            // 3. Monitor workspace for changes

            const args = ['--wait'];

            const proc = spawn('cursor', args, {
                cwd: process.cwd(),
                env: process.env,
            });

            let stdout = '';
            let stderr = '';
            const filesChanged: string[] = [];
            const errors: string[] = [];
            const exitSignals: ExitSignal[] = [];

            proc.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            proc.stderr?.on('data', (data: Buffer) => {
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

                // If cursor CLI not found, provide helpful message
                if (err.message.includes('ENOENT')) {
                    reject(new Error(
                        'Cursor CLI not found. Please ensure Cursor is installed and ' +
                        'the "cursor" command is available in your PATH. ' +
                        'You can add it via Cursor: Command Palette > "Install cursor command"'
                    ));
                } else {
                    reject(err);
                }
            });
        });
    }
}
