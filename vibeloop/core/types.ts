// Core types for VibeLab Autonomous Loop

export interface LoopConfig {
    promptFile: string;           // Path to PROMPT.md or task file
    timeout: number;              // Execution timeout in minutes
    maxCalls: number;             // Max API calls per hour
    verbose: boolean;             // Verbose output
    monitor: boolean;             // Enable live dashboard
    adapter: AdapterType;         // Which AI tool to use
}

export type AdapterType = 'claude-code' | 'cursor' | 'antigravity' | 'opencode' | 'copilot';

export interface ExecuteOptions {
    prompt: string;
    sessionId?: string;
    timeout?: number;
    verbose?: boolean;
}

export interface ExecuteResult {
    success: boolean;
    output: string;
    filesChanged: string[];
    duration: number;
    exitSignals: ExitSignal[];
    errors: string[];
}

export interface ExitSignal {
    type: 'done' | 'test-only' | 'no-changes' | 'error' | 'limit-reached';
    message: string;
    confidence: number;  // 0-1
}

export interface LoopState {
    iteration: number;
    startTime: Date;
    lastExecutionTime: Date;
    totalApiCalls: number;
    filesChanged: Set<string>;
    consecutiveDoneSignals: number;
    consecutiveTestLoops: number;
    consecutiveNoChanges: number;
    errors: string[];
    status: LoopStatus;
}

export type LoopStatus =
    | 'running'
    | 'paused'
    | 'completed'
    | 'error'
    | 'rate-limited'
    | 'circuit-open';

export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailure: Date | null;
    noProgressLoops: number;
    sameErrorCount: number;
    lastError: string | null;
}

export interface Session {
    id: string;
    createdAt: Date;
    lastUpdated: Date;
    context: string;
    iteration: number;
    expiresAt: Date;
}

// Adapter interface that all IDE adapters must implement
export interface IAdapter {
    name: AdapterType;
    isAvailable(): Promise<boolean>;
    execute(options: ExecuteOptions): Promise<ExecuteResult>;
    getVersion(): Promise<string>;
    supportsSession(): boolean;
}

// Event types for the loop engine
export type LoopEvent =
    | { type: 'start'; config: LoopConfig }
    | { type: 'iteration'; state: LoopState }
    | { type: 'execute'; result: ExecuteResult }
    | { type: 'exit'; reason: ExitSignal }
    | { type: 'error'; error: Error }
    | { type: 'circuit-open'; state: CircuitBreakerState }
    | { type: 'rate-limit'; resumeAt: Date };

export type LoopEventHandler = (event: LoopEvent) => void;
