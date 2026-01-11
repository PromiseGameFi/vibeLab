// Loop Engine - Main autonomous execution loop

import * as fs from 'fs';
import * as path from 'path';
import {
    LoopConfig,
    LoopState,
    LoopStatus,
    LoopEvent,
    LoopEventHandler,
    IAdapter,
    ExecuteResult,
    ExitSignal,
} from './types';
import { ExitDetector } from './exit-detector';
import { CircuitBreaker } from './circuit-breaker';
import { SessionManager } from './session-manager';

export interface LoopEngineConfig extends Partial<LoopConfig> {
    projectRoot: string;
}

export class LoopEngine {
    private config: LoopConfig;
    private projectRoot: string;
    private adapter: IAdapter;
    private exitDetector: ExitDetector;
    private circuitBreaker: CircuitBreaker;
    private sessionManager: SessionManager;
    private state: LoopState;
    private running: boolean = false;
    private eventHandlers: LoopEventHandler[] = [];

    constructor(adapter: IAdapter, config: LoopEngineConfig) {
        this.adapter = adapter;
        this.projectRoot = config.projectRoot;
        this.config = {
            promptFile: config.promptFile || 'PROMPT.md',
            timeout: config.timeout || 15,
            maxCalls: config.maxCalls || 100,
            verbose: config.verbose || false,
            monitor: config.monitor || false,
            adapter: adapter.name,
        };

        this.exitDetector = new ExitDetector();
        this.circuitBreaker = new CircuitBreaker();
        this.sessionManager = new SessionManager(this.projectRoot);
        this.state = this.createInitialState();
    }

    /**
     * Subscribe to loop events
     */
    on(handler: LoopEventHandler): () => void {
        this.eventHandlers.push(handler);
        return () => {
            this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
        };
    }

    /**
     * Start the autonomous loop
     */
    async start(): Promise<void> {
        if (this.running) {
            throw new Error('Loop is already running');
        }

        // Check adapter availability
        const available = await this.adapter.isAvailable();
        if (!available) {
            throw new Error(`Adapter ${this.adapter.name} is not available`);
        }

        // Load prompt
        const prompt = await this.loadPrompt();
        if (!prompt) {
            throw new Error(`Prompt file not found: ${this.config.promptFile}`);
        }

        this.running = true;
        this.state = this.createInitialState();
        this.emit({ type: 'start', config: this.config });

        try {
            await this.runLoop(prompt);
        } finally {
            this.running = false;
        }
    }

    /**
     * Stop the loop gracefully
     */
    stop(): void {
        this.running = false;
        this.state.status = 'completed';
    }

    /**
     * Get current state
     */
    getState(): LoopState {
        return { ...this.state, filesChanged: new Set(this.state.filesChanged) };
    }

    private async runLoop(basePrompt: string): Promise<void> {
        while (this.running) {
            // Check circuit breaker
            if (!this.circuitBreaker.allowExecution()) {
                const waitTime = this.circuitBreaker.getWaitTime();
                this.state.status = 'circuit-open';
                this.emit({
                    type: 'circuit-open',
                    state: this.circuitBreaker.getState()
                });

                if (waitTime > 0) {
                    await this.sleep(waitTime);
                    continue;
                }
            }

            // Check rate limit
            if (this.state.totalApiCalls >= this.config.maxCalls) {
                this.state.status = 'rate-limited';
                const resumeAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
                this.emit({ type: 'rate-limit', resumeAt });
                break;
            }

            // Get session context
            const sessionContext = await this.sessionManager.getContext();

            // Build prompt with context
            const fullPrompt = this.buildPrompt(basePrompt, sessionContext);

            // Execute
            this.state.iteration++;
            this.state.status = 'running';
            this.emit({ type: 'iteration', state: this.getState() });

            try {
                const result = await this.adapter.execute({
                    prompt: fullPrompt,
                    timeout: this.config.timeout * 60 * 1000,
                    verbose: this.config.verbose,
                });

                this.state.totalApiCalls++;
                this.state.lastExecutionTime = new Date();

                // Track file changes
                result.filesChanged.forEach(f => this.state.filesChanged.add(f));

                // Record in circuit breaker
                this.circuitBreaker.record(result);

                // Analyze for exit signals
                const signals = this.exitDetector.analyze(result);
                this.updateStateFromSignals(signals, result);

                // Update session
                await this.sessionManager.update(
                    this.extractContext(result),
                    this.state.iteration
                );

                this.emit({ type: 'execute', result });

                // Check exit conditions
                const exitCheck = this.exitDetector.shouldExit(
                    this.state.consecutiveDoneSignals,
                    this.state.consecutiveTestLoops,
                    this.state.consecutiveNoChanges
                );

                if (exitCheck.exit) {
                    this.state.status = 'completed';
                    this.emit({
                        type: 'exit',
                        reason: {
                            type: 'done',
                            message: exitCheck.reason || 'Exit conditions met',
                            confidence: 0.9,
                        },
                    });
                    break;
                }

            } catch (error) {
                this.state.errors.push(error instanceof Error ? error.message : String(error));
                this.emit({ type: 'error', error: error instanceof Error ? error : new Error(String(error)) });

                // Check for 5-hour limit
                if (this.is5HourLimitError(error)) {
                    this.state.status = 'rate-limited';
                    const resumeAt = new Date(Date.now() + 60 * 60 * 1000);
                    this.emit({ type: 'rate-limit', resumeAt });
                    break;
                }
            }

            // Small delay between iterations
            await this.sleep(1000);
        }
    }

    private createInitialState(): LoopState {
        return {
            iteration: 0,
            startTime: new Date(),
            lastExecutionTime: new Date(),
            totalApiCalls: 0,
            filesChanged: new Set(),
            consecutiveDoneSignals: 0,
            consecutiveTestLoops: 0,
            consecutiveNoChanges: 0,
            errors: [],
            status: 'running',
        };
    }

    private async loadPrompt(): Promise<string | null> {
        const promptPath = path.join(this.projectRoot, this.config.promptFile);
        try {
            return fs.readFileSync(promptPath, 'utf-8');
        } catch {
            return null;
        }
    }

    private buildPrompt(basePrompt: string, sessionContext: string): string {
        let prompt = basePrompt;

        if (sessionContext) {
            prompt += sessionContext;
        }

        // Add iteration context
        prompt += `\n\n[Autonomous Loop: Iteration ${this.state.iteration}]`;

        if (this.state.filesChanged.size > 0) {
            prompt += `\n[Files modified so far: ${this.state.filesChanged.size}]`;
        }

        return prompt;
    }

    private updateStateFromSignals(signals: ExitSignal[], result: ExecuteResult): void {
        // Track consecutive signals
        const hasDone = signals.some(s => s.type === 'done');
        const hasTestOnly = signals.some(s => s.type === 'test-only');
        const hasNoChanges = result.filesChanged.length === 0;

        this.state.consecutiveDoneSignals = hasDone ? this.state.consecutiveDoneSignals + 1 : 0;
        this.state.consecutiveTestLoops = hasTestOnly ? this.state.consecutiveTestLoops + 1 : 0;
        this.state.consecutiveNoChanges = hasNoChanges ? this.state.consecutiveNoChanges + 1 : 0;
    }

    private extractContext(result: ExecuteResult): string {
        // Extract relevant context from the result for session continuity
        const lines = result.output.split('\n');

        // Get last N lines as context
        const contextLines = lines.slice(-50);

        // Add file changes
        if (result.filesChanged.length > 0) {
            contextLines.push(`\nFiles changed: ${result.filesChanged.join(', ')}`);
        }

        return contextLines.join('\n');
    }

    private is5HourLimitError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return /rate.?limit|5.?hour|usage.?limit/i.test(message);
    }

    private emit(event: LoopEvent): void {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch {
                // Ignore handler errors
            }
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
