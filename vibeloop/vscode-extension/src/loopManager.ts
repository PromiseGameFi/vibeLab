// Loop Manager - Manages the autonomous loop lifecycle

import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface LoopState {
    iteration: number;
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'rate-limited';
    filesChanged: Set<string>;
    totalApiCalls: number;
    startTime: Date | null;
    lastExecutionTime: Date | null;
    errors: string[];
    currentTask: string;
}

export interface LoopConfig {
    projectRoot: string;
    promptFile: string;
    adapter: string;
    timeout: number;
    maxCalls: number;
}

export class LoopManager {
    private context: vscode.ExtensionContext;
    private state: LoopState;
    private process: ChildProcess | null = null;
    private stateChangeHandlers: Array<(state: LoopState) => void> = [];
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.state = this.createInitialState();
        this.outputChannel = vscode.window.createOutputChannel('VibeLab Loop');
    }

    private createInitialState(): LoopState {
        return {
            iteration: 0,
            status: 'idle',
            filesChanged: new Set(),
            totalApiCalls: 0,
            startTime: null,
            lastExecutionTime: null,
            errors: [],
            currentTask: '',
        };
    }

    onStateChange(handler: (state: LoopState) => void): void {
        this.stateChangeHandlers.push(handler);
    }

    private emitStateChange(): void {
        this.stateChangeHandlers.forEach(handler => handler(this.state));
    }

    async start(config: LoopConfig): Promise<void> {
        if (this.state.status === 'running') {
            vscode.window.showWarningMessage('Loop is already running');
            return;
        }

        this.state = this.createInitialState();
        this.state.status = 'running';
        this.state.startTime = new Date();
        this.state.currentTask = 'Initializing...';
        this.emitStateChange();

        // Check for the adapter CLI
        const adapter = config.adapter;
        let command: string;
        let args: string[];

        switch (adapter) {
            case 'claude':
            case 'claude-code':
                command = 'claude';
                args = ['--print'];
                break;
            case 'aider':
                command = 'aider';
                args = ['--yes-always', '--message'];
                break;
            case 'cursor':
                command = 'cursor';
                args = ['--wait'];
                break;
            case 'opencode':
                command = 'opencode';
                args = ['--non-interactive'];
                break;
            case 'antigravity':
            case 'copilot':
            case 'lm-api':
                // Try to use VS Code Language Model API
                if (await this.hasLanguageModelAPI()) {
                    const promptPath = path.join(config.projectRoot, config.promptFile);
                    let prompt: string;
                    try {
                        prompt = fs.readFileSync(promptPath, 'utf-8');
                    } catch {
                        vscode.window.showErrorMessage(`Failed to read ${config.promptFile}`);
                        this.state.status = 'error';
                        this.emitStateChange();
                        return;
                    }
                    await this.runWithLanguageModel(prompt, config);
                    return;
                } else {
                    vscode.window.showWarningMessage(
                        'No Language Model available. Install GitHub Copilot or use a CLI adapter like Aider.'
                    );
                    this.state.status = 'error';
                    this.state.currentTask = 'No LM available';
                    this.emitStateChange();
                    return;
                }
            default:
                vscode.window.showErrorMessage(`Unsupported adapter: ${adapter}`);
                this.state.status = 'error';
                this.emitStateChange();
                return;
        }

        // Read prompt file
        const promptPath = path.join(config.projectRoot, config.promptFile);
        let prompt: string;
        try {
            prompt = fs.readFileSync(promptPath, 'utf-8');
        } catch {
            vscode.window.showErrorMessage(`Failed to read ${config.promptFile}`);
            this.state.status = 'error';
            this.emitStateChange();
            return;
        }

        // Run the loop
        await this.runLoop(command, args, prompt, config);
    }

    private async runLoop(
        command: string,
        baseArgs: string[],
        prompt: string,
        config: LoopConfig
    ): Promise<void> {
        while (this.state.status === 'running') {
            this.state.iteration++;
            this.state.currentTask = `Iteration ${this.state.iteration}`;
            this.emitStateChange();

            try {
                const result = await this.executeIteration(command, baseArgs, prompt, config);

                this.state.totalApiCalls++;
                this.state.lastExecutionTime = new Date();

                // Add changed files
                result.filesChanged.forEach(f => this.state.filesChanged.add(f));

                // Check for completion
                if (this.detectCompletion(result.output)) {
                    this.state.status = 'completed';
                    this.state.currentTask = 'All tasks complete!';
                    vscode.window.showInformationMessage('VibeLab Loop completed successfully!');
                    break;
                }

                // Check rate limit
                if (this.state.totalApiCalls >= config.maxCalls) {
                    this.state.status = 'rate-limited';
                    this.state.currentTask = 'Rate limited - waiting...';
                    vscode.window.showWarningMessage('Rate limit reached. Loop paused.');
                    break;
                }

                this.emitStateChange();

            } catch (error) {
                this.state.errors.push(error instanceof Error ? error.message : String(error));

                // Check if we should stop
                if (this.state.errors.length >= 5) {
                    this.state.status = 'error';
                    this.state.currentTask = 'Too many errors';
                    vscode.window.showErrorMessage('Loop stopped due to repeated errors');
                    break;
                }
            }

            // Small delay between iterations
            await this.sleep(1000);
        }

        this.emitStateChange();
    }

    private executeIteration(
        command: string,
        baseArgs: string[],
        prompt: string,
        config: LoopConfig
    ): Promise<{ output: string; filesChanged: string[] }> {
        return new Promise((resolve, reject) => {
            const args = [...baseArgs, prompt];

            this.process = spawn(command, args, {
                cwd: config.projectRoot,
                env: process.env,
            });

            let output = '';
            const filesChanged: string[] = [];

            this.process.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                output += chunk;

                // Parse file changes
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

            this.process.stderr?.on('data', (data: Buffer) => {
                output += data.toString();
            });

            const timeout = config.timeout * 60 * 1000;
            const timeoutId = setTimeout(() => {
                this.process?.kill('SIGTERM');
                reject(new Error(`Timeout after ${config.timeout} minutes`));
            }, timeout);

            this.process.on('close', (code) => {
                clearTimeout(timeoutId);
                this.process = null;

                if (code === 0) {
                    resolve({ output, filesChanged });
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });

            this.process.on('error', (err) => {
                clearTimeout(timeoutId);
                this.process = null;
                reject(err);
            });
        });
    }

    private detectCompletion(output: string): boolean {
        const patterns = [
            /all\s+tasks?\s+(are\s+)?complete/i,
            /project\s+(is\s+)?complete/i,
            /implementation\s+(is\s+)?done/i,
            /nothing\s+(left|more)\s+to\s+do/i,
            /successfully\s+completed/i,
        ];

        return patterns.some(p => p.test(output));
    }

    stop(): void {
        if (this.process) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
        this.state.status = 'idle';
        this.state.currentTask = 'Stopped';
        this.emitStateChange();
    }

    async reset(): Promise<void> {
        this.stop();
        this.state = this.createInitialState();
        this.emitStateChange();
    }

    getState(): LoopState {
        return { ...this.state, filesChanged: new Set(this.state.filesChanged) };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== VS Code Language Model API Support =====

    /**
     * Check if VS Code Language Model API is available
     */
    private async hasLanguageModelAPI(): Promise<boolean> {
        try {
            // Check if vscode.lm exists (VS Code 1.90+)
            if (!vscode.lm) {
                return false;
            }
            const models = await vscode.lm.selectChatModels({});
            return models.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Run the loop using VS Code Language Model API
     */
    private async runWithLanguageModel(prompt: string, config: LoopConfig): Promise<void> {
        this.outputChannel.show();
        this.outputChannel.appendLine('='.repeat(50));
        this.outputChannel.appendLine('VibeLab Loop - Using Language Model API');
        this.outputChannel.appendLine('='.repeat(50));

        try {
            // Get available models
            const models = await vscode.lm.selectChatModels({});
            if (models.length === 0) {
                throw new Error('No language models available');
            }

            const model = models[0];
            this.outputChannel.appendLine(`Using model: ${model.name || model.id}`);

            while (this.state.status === 'running') {
                this.state.iteration++;
                this.state.currentTask = `LM Iteration ${this.state.iteration}`;
                this.emitStateChange();

                this.outputChannel.appendLine(`\n--- Iteration ${this.state.iteration} ---`);

                // Build the message
                const systemPrompt = `You are an autonomous coding agent. Complete the tasks described below. 
When all tasks are complete, respond with "All tasks complete."
Work in the project directory and make necessary code changes.`;

                const messages = [
                    vscode.LanguageModelChatMessage.User(systemPrompt + '\n\n' + prompt)
                ];

                // Send request to language model
                const response = await model.sendRequest(messages, {});

                // Collect response
                let result = '';
                for await (const chunk of response.text) {
                    result += chunk;
                    this.outputChannel.append(chunk);
                }

                this.state.totalApiCalls++;
                this.state.lastExecutionTime = new Date();

                // Check for completion
                if (this.detectCompletion(result)) {
                    this.state.status = 'completed';
                    this.state.currentTask = 'All tasks complete!';
                    this.outputChannel.appendLine('\n\n✅ Loop completed successfully!');
                    vscode.window.showInformationMessage('VibeLab Loop completed!');
                    break;
                }

                // Check rate limit
                if (this.state.totalApiCalls >= config.maxCalls) {
                    this.state.status = 'rate-limited';
                    this.state.currentTask = 'Rate limited';
                    this.outputChannel.appendLine('\n\n⚠️ Rate limit reached');
                    vscode.window.showWarningMessage('Rate limit reached. Loop paused.');
                    break;
                }

                this.emitStateChange();

                // Delay between iterations
                await this.sleep(2000);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.state.errors.push(message);
            this.state.status = 'error';
            this.state.currentTask = 'Error: ' + message;
            this.outputChannel.appendLine(`\n\n❌ Error: ${message}`);
            vscode.window.showErrorMessage(`VibeLab Loop error: ${message}`);
        }

        this.emitStateChange();
    }
}
