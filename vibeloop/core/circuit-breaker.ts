// Circuit Breaker - Detects stuck loops and prevents runaway execution

import { CircuitBreakerState, ExecuteResult } from './types';

export interface CircuitBreakerConfig {
    noProgressThreshold: number;     // Open after N loops with no file changes
    sameErrorThreshold: number;      // Open after N loops with same error
    outputDeclineThreshold: number;  // Open if output declines by N%
    cooldownMinutes: number;         // Wait time before half-open
    halfOpenSuccessThreshold: number; // Successes needed to close
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    noProgressThreshold: 3,
    sameErrorThreshold: 5,
    outputDeclineThreshold: 70,
    cooldownMinutes: 5,
    halfOpenSuccessThreshold: 2,
};

export class CircuitBreaker {
    private config: CircuitBreakerConfig;
    private state: CircuitBreakerState;
    private lastOutputLength: number = 0;
    private halfOpenSuccesses: number = 0;
    private stateHistory: Array<{ state: string; time: Date; reason: string }> = [];

    constructor(config: Partial<CircuitBreakerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = {
            state: 'closed',
            failures: 0,
            lastFailure: null,
            noProgressLoops: 0,
            sameErrorCount: 0,
            lastError: null,
        };
    }

    /**
     * Record an execution result and update state
     */
    record(result: ExecuteResult): void {
        if (this.state.state === 'open') {
            // Check if we can transition to half-open
            if (this.canTransitionToHalfOpen()) {
                this.transitionTo('half-open', 'Cooldown period elapsed');
            }
            return;
        }

        // Check for no progress
        if (result.filesChanged.length === 0) {
            this.state.noProgressLoops++;
            if (this.state.noProgressLoops >= this.config.noProgressThreshold) {
                this.open(`No progress in ${this.state.noProgressLoops} loops`);
                return;
            }
        } else {
            this.state.noProgressLoops = 0;
        }

        // Check for repeated errors
        if (result.errors.length > 0) {
            const currentError = this.normalizeError(result.errors[0]);
            if (currentError === this.state.lastError) {
                this.state.sameErrorCount++;
                if (this.state.sameErrorCount >= this.config.sameErrorThreshold) {
                    this.open(`Same error repeated ${this.state.sameErrorCount} times: ${currentError}`);
                    return;
                }
            } else {
                this.state.lastError = currentError;
                this.state.sameErrorCount = 1;
            }
        }

        // Check for output decline
        if (this.lastOutputLength > 0) {
            const decline = ((this.lastOutputLength - result.output.length) / this.lastOutputLength) * 100;
            if (decline >= this.config.outputDeclineThreshold) {
                this.state.failures++;
                if (this.state.failures >= 3) {
                    this.open(`Output declined by ${decline.toFixed(0)}%`);
                    return;
                }
            }
        }
        this.lastOutputLength = result.output.length;

        // Handle half-open state
        if (this.state.state === 'half-open') {
            if (result.success && result.filesChanged.length > 0) {
                this.halfOpenSuccesses++;
                if (this.halfOpenSuccesses >= this.config.halfOpenSuccessThreshold) {
                    this.close('Recovered after successful executions');
                }
            } else {
                this.open('Failed during half-open recovery');
            }
        }
    }

    /**
     * Check if circuit allows execution
     */
    allowExecution(): boolean {
        if (this.state.state === 'closed') return true;
        if (this.state.state === 'half-open') return true;

        // Open - check if we can transition
        if (this.canTransitionToHalfOpen()) {
            this.transitionTo('half-open', 'Attempting recovery');
            return true;
        }

        return false;
    }

    /**
     * Get time until circuit can try again
     */
    getWaitTime(): number {
        if (this.state.state !== 'open' || !this.state.lastFailure) return 0;

        const elapsed = Date.now() - this.state.lastFailure.getTime();
        const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
        return Math.max(0, cooldownMs - elapsed);
    }

    /**
     * Manually reset the circuit
     */
    reset(): void {
        this.transitionTo('closed', 'Manual reset');
        this.state.failures = 0;
        this.state.noProgressLoops = 0;
        this.state.sameErrorCount = 0;
        this.state.lastError = null;
        this.halfOpenSuccesses = 0;
    }

    getState(): CircuitBreakerState {
        return { ...this.state };
    }

    getHistory(): typeof this.stateHistory {
        return [...this.stateHistory];
    }

    private open(reason: string): void {
        this.state.failures++;
        this.state.lastFailure = new Date();
        this.transitionTo('open', reason);
    }

    private close(reason: string): void {
        this.state.failures = 0;
        this.state.noProgressLoops = 0;
        this.state.sameErrorCount = 0;
        this.halfOpenSuccesses = 0;
        this.transitionTo('closed', reason);
    }

    private transitionTo(newState: CircuitBreakerState['state'], reason: string): void {
        const oldState = this.state.state;
        this.state.state = newState;

        this.stateHistory.push({
            state: `${oldState} -> ${newState}`,
            time: new Date(),
            reason,
        });

        // Keep only last 50 transitions
        if (this.stateHistory.length > 50) {
            this.stateHistory = this.stateHistory.slice(-50);
        }
    }

    private canTransitionToHalfOpen(): boolean {
        if (this.state.state !== 'open' || !this.state.lastFailure) return false;

        const elapsed = Date.now() - this.state.lastFailure.getTime();
        const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
        return elapsed >= cooldownMs;
    }

    private normalizeError(error: string): string {
        // Normalize error for comparison (remove line numbers, timestamps, etc.)
        return error
            .replace(/line \d+/gi, 'line N')
            .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
            .replace(/\d{2}:\d{2}:\d{2}/g, 'TIME')
            .trim()
            .toLowerCase();
    }
}
