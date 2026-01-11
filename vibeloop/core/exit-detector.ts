// Exit Detector - Determines when the autonomous loop should stop

import { ExecuteResult, ExitSignal } from './types';

export interface ExitDetectorConfig {
    maxConsecutiveDone: number;       // Exit after N "done" signals
    maxConsecutiveTestLoops: number;  // Exit after N test-only loops
    maxConsecutiveNoChanges: number;  // Exit after N loops with no changes
    testPercentageThreshold: number;  // Flag if N% of loops are test-only
}

const DEFAULT_CONFIG: ExitDetectorConfig = {
    maxConsecutiveDone: 2,
    maxConsecutiveTestLoops: 3,
    maxConsecutiveNoChanges: 3,
    testPercentageThreshold: 30,
};

// Patterns that indicate completion
const DONE_PATTERNS = [
    /all\s+tasks?\s+(are\s+)?complete/i,
    /project\s+(is\s+)?complete/i,
    /implementation\s+(is\s+)?done/i,
    /nothing\s+(left|more)\s+to\s+do/i,
    /all\s+requirements?\s+(are\s+)?met/i,
    /finished\s+implementing/i,
    /successfully\s+completed/i,
    /no\s+further\s+changes\s+needed/i,
    /task\s+list\s+(is\s+)?empty/i,
];

// Patterns that indicate test-only loop
const TEST_PATTERNS = [
    /running\s+tests?/i,
    /all\s+tests?\s+pass/i,
    /npm\s+(run\s+)?test/i,
    /jest|vitest|mocha/i,
    /test\s+suite/i,
];

// Patterns that indicate errors
const ERROR_PATTERNS = [
    /error:/i,
    /failed:/i,
    /exception:/i,
    /cannot\s+find/i,
    /type\s*error/i,
    /syntax\s*error/i,
];

export class ExitDetector {
    private config: ExitDetectorConfig;
    private totalLoops: number = 0;
    private testLoops: number = 0;

    constructor(config: Partial<ExitDetectorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Analyze execution result for exit signals
     */
    analyze(result: ExecuteResult): ExitSignal[] {
        const signals: ExitSignal[] = [];
        this.totalLoops++;

        // Check for done signals
        const doneSignal = this.detectDoneSignal(result.output);
        if (doneSignal) {
            signals.push(doneSignal);
        }

        // Check for test-only loop
        const testSignal = this.detectTestOnlyLoop(result);
        if (testSignal) {
            signals.push(testSignal);
            this.testLoops++;
        }

        // Check for no changes
        if (result.filesChanged.length === 0) {
            signals.push({
                type: 'no-changes',
                message: 'No files were modified in this iteration',
                confidence: 0.7,
            });
        }

        // Check for errors
        const errorSignal = this.detectErrors(result);
        if (errorSignal) {
            signals.push(errorSignal);
        }

        return signals;
    }

    /**
     * Detect completion signals in output
     */
    private detectDoneSignal(output: string): ExitSignal | null {
        for (const pattern of DONE_PATTERNS) {
            if (pattern.test(output)) {
                return {
                    type: 'done',
                    message: `Detected completion: ${pattern.source}`,
                    confidence: 0.85,
                };
            }
        }
        return null;
    }

    /**
     * Detect if this was a test-only loop
     */
    private detectTestOnlyLoop(result: ExecuteResult): ExitSignal | null {
        const hasTestActivity = TEST_PATTERNS.some(p => p.test(result.output));
        const noCodeChanges = result.filesChanged.every(f =>
            f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
        );

        if (hasTestActivity && (result.filesChanged.length === 0 || noCodeChanges)) {
            return {
                type: 'test-only',
                message: 'Loop only ran tests without code changes',
                confidence: 0.75,
            };
        }
        return null;
    }

    /**
     * Detect errors in output
     */
    private detectErrors(result: ExecuteResult): ExitSignal | null {
        // Check explicit errors from result
        if (result.errors.length > 0) {
            return {
                type: 'error',
                message: result.errors[0],
                confidence: 0.9,
            };
        }

        // Check output for error patterns (with filtering)
        for (const pattern of ERROR_PATTERNS) {
            const match = result.output.match(pattern);
            if (match) {
                // Filter false positives (JSON fields, etc.)
                const context = result.output.substring(
                    Math.max(0, result.output.indexOf(match[0]) - 50),
                    result.output.indexOf(match[0]) + 100
                );

                // Skip if in JSON context
                if (context.includes('"error"') || context.includes("'error'")) {
                    continue;
                }

                return {
                    type: 'error',
                    message: `Detected error pattern: ${match[0]}`,
                    confidence: 0.7,
                };
            }
        }
        return null;
    }

    /**
     * Check if we should exit based on accumulated signals
     */
    shouldExit(
        consecutiveDone: number,
        consecutiveTestLoops: number,
        consecutiveNoChanges: number
    ): { exit: boolean; reason?: string } {
        if (consecutiveDone >= this.config.maxConsecutiveDone) {
            return {
                exit: true,
                reason: `${consecutiveDone} consecutive completion signals`
            };
        }

        if (consecutiveTestLoops >= this.config.maxConsecutiveTestLoops) {
            return {
                exit: true,
                reason: `${consecutiveTestLoops} consecutive test-only loops`
            };
        }

        if (consecutiveNoChanges >= this.config.maxConsecutiveNoChanges) {
            return {
                exit: true,
                reason: `${consecutiveNoChanges} loops with no file changes`
            };
        }

        // Check test percentage
        if (this.totalLoops >= 5) {
            const testPercentage = (this.testLoops / this.totalLoops) * 100;
            if (testPercentage >= this.config.testPercentageThreshold) {
                return {
                    exit: true,
                    reason: `${testPercentage.toFixed(0)}% of loops are test-only`,
                };
            }
        }

        return { exit: false };
    }

    reset(): void {
        this.totalLoops = 0;
        this.testLoops = 0;
    }
}
