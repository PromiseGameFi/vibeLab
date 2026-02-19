/**
 * Stage 2: Static Analysis
 * Fast, deterministic pattern matching to catch obvious vulnerabilities
 * BEFORE sending to AI. These are cheap and reliable.
 */

import { ContractRecon, FunctionInfo, ExternalCall } from './recon';

export interface StaticFinding {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    category: string;
    description: string;
    line: number;
    function: string;
    pattern: string;       // Which pattern triggered this
    confidence: number;    // 0-1 how confident this is a real issue
}

// ─── Main static analysis function ──────────────────────────────────

export function staticAnalysis(code: string, recon: ContractRecon): StaticFinding[] {
    const findings: StaticFinding[] = [];
    let findingId = 0;

    const make = (f: Omit<StaticFinding, 'id'>): StaticFinding => ({
        ...f,
        id: `STATIC-${String(++findingId).padStart(3, '0')}`,
    });

    // ─── Check 1: Reentrancy (state change after external call) ─────

    for (const fn of recon.functions) {
        if (!fn.hasExternalCall || !fn.hasStateChange) continue;

        const body = extractFunctionBody(code, fn);
        if (!body) continue;

        // Find positions of external calls and state changes
        const callPos = findPatternPositions(body, /\.(call|transfer|send)\s*[({]/g);
        const statePos = findPatternPositions(body, /\w+\s*(\[.*?\])?\s*[-+]?=\s*/g);

        // If any state change comes AFTER an external call → reentrancy
        for (const cp of callPos) {
            for (const sp of statePos) {
                if (sp > cp) {
                    findings.push(make({
                        title: `Reentrancy in ${fn.name}(): state change after external call`,
                        severity: 'CRITICAL',
                        category: 'reentrancy',
                        description: `Function ${fn.name}() makes an external call before updating state. An attacker can re-enter during the call and drain funds.`,
                        line: fn.lineStart,
                        function: fn.name,
                        pattern: 'external-call-before-state-update',
                        confidence: 0.9,
                    }));
                    break;
                }
            }
        }
    }

    // ─── Check 2: Missing access control ────────────────────────────

    for (const fn of recon.functions) {
        if (fn.visibility !== 'public' && fn.visibility !== 'external') continue;
        if (fn.modifiers.length > 0) continue;  // Has some modifier
        if (fn.mutability === 'view' || fn.mutability === 'pure') continue;  // Read-only

        // Check if the function body has a manual require/if check for msg.sender
        const body = extractFunctionBody(code, fn);
        const hasManualCheck = body && /(?:require|if)\s*\([^)]*msg\.sender[^)]*\)/.test(body);

        if (!hasManualCheck && fn.hasEthTransfer) {
            findings.push(make({
                title: `Missing access control on ${fn.name}() — sends ETH`,
                severity: 'CRITICAL',
                category: 'access-control',
                description: `${fn.name}() sends ETH and has no access control. Anyone can call it.`,
                line: fn.lineStart,
                function: fn.name,
                pattern: 'unguarded-eth-transfer',
                confidence: 0.95,
            }));
        } else if (!hasManualCheck && fn.hasStateChange) {
            findings.push(make({
                title: `Missing access control on ${fn.name}()`,
                severity: 'HIGH',
                category: 'access-control',
                description: `${fn.name}() modifies state with no access restrictions.`,
                line: fn.lineStart,
                function: fn.name,
                pattern: 'unguarded-state-change',
                confidence: 0.7,
            }));
        }
    }

    // ─── Check 3: tx.origin usage ───────────────────────────────────

    const txOriginLines = findLineNumbers(code, /tx\.origin/g);
    for (const line of txOriginLines) {
        const fn = findFunctionForLine(recon.functions, line);
        findings.push(make({
            title: `tx.origin used for authentication`,
            severity: 'HIGH',
            category: 'access-control',
            description: `tx.origin is used at line ${line}. This is vulnerable to phishing attacks where a malicious contract tricks the owner into calling it.`,
            line,
            function: fn?.name || 'unknown',
            pattern: 'tx-origin-auth',
            confidence: 0.85,
        }));
    }

    // ─── Check 4: Unchecked return values ───────────────────────────

    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // .send() without checking return
        if (/\.send\(/.test(line) && !line.startsWith('require') && !line.includes('= ') && !line.includes('if')) {
            const fn = findFunctionForLine(recon.functions, i + 1);
            findings.push(make({
                title: `Unchecked .send() return value`,
                severity: 'HIGH',
                category: 'unchecked-return',
                description: `Return value of .send() is not checked at line ${i + 1}. If the transfer fails, execution continues silently.`,
                line: i + 1,
                function: fn?.name || 'unknown',
                pattern: 'unchecked-send',
                confidence: 0.9,
            }));
        }

        // .transfer() in a loop (DoS risk)
        if (/\.transfer\(/.test(line)) {
            // Check if we're inside a for/while loop
            const preceding = lines.slice(Math.max(0, i - 10), i).join('\n');
            if (/(?:for|while)\s*\(/.test(preceding)) {
                const fn = findFunctionForLine(recon.functions, i + 1);
                findings.push(make({
                    title: `ETH transfer inside loop — DoS risk`,
                    severity: 'HIGH',
                    category: 'dos',
                    description: `transfer() inside a loop at line ${i + 1}. If one recipient reverts, the entire loop fails.`,
                    line: i + 1,
                    function: fn?.name || 'unknown',
                    pattern: 'transfer-in-loop',
                    confidence: 0.85,
                }));
            }
        }
    }

    // ─── Check 5: Dangerous delegatecall ────────────────────────────

    if (recon.hasDelegatecall) {
        const delegateLines = findLineNumbers(code, /\.delegatecall\s*\(/g);
        for (const line of delegateLines) {
            const fn = findFunctionForLine(recon.functions, line);
            // Check if the target is user-controllable
            const lineContent = lines[line - 1] || '';
            const isByParam = /\w+\.delegatecall/.test(lineContent);

            findings.push(make({
                title: `Dangerous delegatecall${isByParam ? ' with controllable target' : ''}`,
                severity: isByParam ? 'CRITICAL' : 'HIGH',
                category: 'delegatecall',
                description: `delegatecall at line ${line} executes code in the context of this contract's storage. If the target is attacker-controlled, all funds can be stolen.`,
                line,
                function: fn?.name || 'unknown',
                pattern: 'delegatecall',
                confidence: isByParam ? 0.9 : 0.6,
            }));
        }
    }

    // ─── Check 6: Selfdestruct ──────────────────────────────────────

    if (recon.hasSelfdestruct) {
        const selfdestructLines = findLineNumbers(code, /selfdestruct\s*\(/g);
        for (const line of selfdestructLines) {
            const fn = findFunctionForLine(recon.functions, line);
            findings.push(make({
                title: `Contract can be destroyed via selfdestruct`,
                severity: 'CRITICAL',
                category: 'selfdestruct',
                description: `selfdestruct at line ${line} can permanently kill the contract and send remaining ETH to an arbitrary address.`,
                line,
                function: fn?.name || 'unknown',
                pattern: 'selfdestruct',
                confidence: 0.95,
            }));
        }
    }

    // ─── Check 7: Integer issues in unchecked blocks ────────────────

    const uncheckedBlocks = findLineNumbers(code, /unchecked\s*\{/g);
    for (const line of uncheckedBlocks) {
        const fn = findFunctionForLine(recon.functions, line);
        findings.push(make({
            title: `Unchecked arithmetic block — potential overflow/underflow`,
            severity: 'MEDIUM',
            category: 'integer',
            description: `Unchecked block at line ${line} disables Solidity's overflow protections.`,
            line,
            function: fn?.name || 'unknown',
            pattern: 'unchecked-math',
            confidence: 0.5,
        }));
    }

    // ─── Check 8: Missing nonReentrant on functions with external calls ─

    for (const fn of recon.functions) {
        if (!fn.hasExternalCall) continue;
        if (fn.visibility !== 'public' && fn.visibility !== 'external') continue;

        const hasReentrancyGuard = fn.modifiers.some(m =>
            m.toLowerCase().includes('nonreentrant') || m.toLowerCase().includes('reentrancy')
        );

        if (!hasReentrancyGuard && fn.hasEthTransfer) {
            findings.push(make({
                title: `No reentrancy guard on ${fn.name}()`,
                severity: 'HIGH',
                category: 'reentrancy',
                description: `${fn.name}() makes external calls and transfers ETH but has no nonReentrant modifier.`,
                line: fn.lineStart,
                function: fn.name,
                pattern: 'missing-nonreentrant',
                confidence: 0.8,
            }));
        }
    }

    return findings;
}

// ─── Utility Functions ──────────────────────────────────────────────

function extractFunctionBody(code: string, fn: FunctionInfo): string | null {
    const lines = code.split('\n');
    if (fn.lineStart <= 0 || fn.lineEnd > lines.length) return null;
    return lines.slice(fn.lineStart - 1, fn.lineEnd).join('\n');
}

function findPatternPositions(text: string, pattern: RegExp): number[] {
    const positions: number[] = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
        positions.push(match.index);
    }
    return positions;
}

function findLineNumbers(code: string, pattern: RegExp): number[] {
    const lineNumbers: number[] = [];
    let match;
    while ((match = pattern.exec(code)) !== null) {
        lineNumbers.push(code.substring(0, match.index).split('\n').length);
    }
    return lineNumbers;
}

function findFunctionForLine(functions: FunctionInfo[], line: number): FunctionInfo | undefined {
    return functions.find(f => line >= f.lineStart && line <= f.lineEnd);
}

/**
 * Format static findings into a context string for AI consumption.
 */
export function formatStaticForAI(findings: StaticFinding[]): string {
    if (findings.length === 0) return 'Static analysis: No issues detected.\n';

    let ctx = `=== STATIC ANALYSIS: ${findings.length} ISSUE(S) FOUND ===\n`;
    for (const f of findings) {
        ctx += `[${f.severity}] ${f.title} (L${f.line}, confidence: ${(f.confidence * 100).toFixed(0)}%)\n`;
        ctx += `  ${f.description}\n\n`;
    }
    return ctx;
}
