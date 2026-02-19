/**
 * Stage 3: Multi-Vector AI Analysis
 * Run multiple focused AI passes instead of one generic one.
 * Each pass targets a specific attack vector category.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { ContractRecon, formatReconForAI } from './recon';
import { StaticFinding, formatStaticForAI } from './static-analysis';

dotenv.config();

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY || 'dummy',
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://vibelab.app',
                'X-Title': 'VibeAudit',
            },
        });
    }
    return _openai;
}

// ─── AI Finding Structure ───────────────────────────────────────────

export interface AIFinding {
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    category: string;
    description: string;
    exploitScenario: string;
    affectedFunction: string;
    lineStart: number;
    lineEnd: number;
    profitPotential: string;
    exploitCode: string;      // Foundry test code
    prerequisites: string[];   // What's needed for the exploit
    pass: string;             // Which analysis pass found this
}

export interface AnalysisPassResult {
    pass: string;
    findings: AIFinding[];
    duration: number;
}

// ─── Analysis Pass Definitions ──────────────────────────────────────

interface AnalysisPass {
    name: string;
    emoji: string;
    systemPrompt: string;
}

const PASSES: AnalysisPass[] = [
    {
        name: 'reentrancy',
        emoji: '🔄',
        systemPrompt: `You are a reentrancy attack specialist. Focus ONLY on:
- Classic reentrancy (external call before state update)
- Cross-function reentrancy (state shared between functions, one calls external)
- Cross-contract reentrancy (via callbacks like ERC-777, ERC-721 onReceive)
- Read-only reentrancy (view functions returning stale state during reentrant call)

For each vulnerability, provide a COMPLETE Foundry test contract that demonstrates the reentrancy attack with an attacker contract that has the malicious callback.

Respond ONLY in JSON format:
{
  "findings": [{
    "title": "string",
    "severity": "CRITICAL|HIGH",
    "category": "reentrancy",
    "description": "root cause + why it's exploitable",
    "exploitScenario": "step-by-step attack flow",
    "affectedFunction": "functionName",
    "lineStart": 0,
    "lineEnd": 0,
    "profitPotential": "estimated stolen amount",
    "exploitCode": "// COMPLETE Foundry test with attacker contract",
    "prerequisites": ["what attacker needs"]
  }]
}
If no reentrancy issues found, return {"findings": []}.`,
    },
    {
        name: 'economic',
        emoji: '💰',
        systemPrompt: `You are a DeFi economic attack specialist. Focus ONLY on:
- Flash loan attack vectors (borrow → manipulate → profit → repay)
- Oracle manipulation (TWAP, spot price, on-chain oracle)
- Price manipulation via large trades or liquidity
- Sandwich attack opportunities
- Reward/yield calculation manipulation
- Share price manipulation (inflation attacks on ERC-4626 vaults)

For each vulnerability, provide COMPLETE Foundry test code showing the economic exploit.

Respond ONLY in JSON format:
{
  "findings": [{
    "title": "string",
    "severity": "CRITICAL|HIGH",
    "category": "economic",
    "description": "root cause",
    "exploitScenario": "step-by-step flash loan/manipulation flow",
    "affectedFunction": "functionName",
    "lineStart": 0,
    "lineEnd": 0,
    "profitPotential": "profit estimate",
    "exploitCode": "// COMPLETE Foundry test with flash loan setup",
    "prerequisites": ["what attacker needs"]
  }]
}
If no economic issues found, return {"findings": []}.`,
    },
    {
        name: 'access-control',
        emoji: '🔓',
        systemPrompt: `You are an access control attack specialist. Focus ONLY on:
- Missing access control on critical functions (withdraw, mint, pause, upgrade)
- tx.origin phishing vulnerabilities
- Privilege escalation paths
- Proxy/upgrade vulnerabilities (uninitialized, storage collisions)
- Signature replay attacks
- Missing validation of function parameters
- Front-running authorization transactions

For each vulnerability, provide COMPLETE Foundry test code showing the access control bypass.

Respond ONLY in JSON format:
{
  "findings": [{
    "title": "string",
    "severity": "CRITICAL|HIGH",
    "category": "access-control",
    "description": "root cause",
    "exploitScenario": "step-by-step bypass flow",
    "affectedFunction": "functionName",
    "lineStart": 0,
    "lineEnd": 0,
    "profitPotential": "impact description",
    "exploitCode": "// COMPLETE Foundry test",
    "prerequisites": ["what attacker needs"]
  }]
}
If no access control issues found, return {"findings": []}.`,
    },
    {
        name: 'logic',
        emoji: '🧠',
        systemPrompt: `You are a smart contract logic bug specialist. Focus ONLY on:
- Business logic flaws (incorrect calculations, wrong ordering)
- Invariant violations (balances don't sum, shares miscalculated)
- Edge cases (empty arrays, zero amounts, first depositor attacks)
- Rounding errors exploitable over many transactions
- DoS vectors (unbounded loops, griefing with reverts)
- Incorrect state transitions
- Missing or incorrect event emissions affecting off-chain systems

For each vulnerability, provide COMPLETE Foundry test code proving the logic bug.

Respond ONLY in JSON format:
{
  "findings": [{
    "title": "string",
    "severity": "CRITICAL|HIGH|MEDIUM",
    "category": "logic",
    "description": "root cause",
    "exploitScenario": "step-by-step exploit",
    "affectedFunction": "functionName",
    "lineStart": 0,
    "lineEnd": 0,
    "profitPotential": "impact",
    "exploitCode": "// COMPLETE Foundry test",
    "prerequisites": ["what's needed"]
  }]
}
If no logic issues found, return {"findings": []}.`,
    },
    {
        name: 'attack-chain',
        emoji: '⛓️',
        systemPrompt: `You are an advanced attack chain builder. You will receive:
1. Contract source code
2. Reconnaissance data (functions, state vars, attack surface)
3. Static analysis findings
4. Findings from previous AI passes (reentrancy, economic, access control, logic)

Your job is to find MULTI-STEP EXPLOITS that combine multiple smaller issues:
- Flash loan → reentrancy combos
- Access control bypass → drain funds chains
- Price manipulation → arbitrage sequences
- Multiple function interaction exploits

Generate COMPLETE Foundry test contracts for each attack chain.

Respond ONLY in JSON format:
{
  "findings": [{
    "title": "string — describe the full chain",
    "severity": "CRITICAL",
    "category": "attack-chain",
    "description": "how multiple issues combine into one devastating exploit",
    "exploitScenario": "complete multi-step attack flow",
    "affectedFunction": "primary entry point",
    "lineStart": 0,
    "lineEnd": 0,
    "profitPotential": "total estimated profit",
    "exploitCode": "// COMPLETE multi-step Foundry test",
    "prerequisites": ["all requirements"]
  }]
}
If no attack chains can be constructed, return {"findings": []}.`,
    },
];

// ─── Run Analysis ───────────────────────────────────────────────────

/**
 * Run all analysis passes against a contract.
 * Returns findings from each pass.
 */
export async function multiVectorAnalysis(
    code: string,
    filename: string,
    recon: ContractRecon,
    staticFindings: StaticFinding[],
): Promise<AnalysisPassResult[]> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';
    const results: AnalysisPassResult[] = [];

    // Build context from recon and static analysis
    const reconContext = formatReconForAI(recon);
    const staticContext = formatStaticForAI(staticFindings);

    // Accumulate findings for the chain-building pass
    let allFindingsContext = '';

    for (let i = 0; i < PASSES.length; i++) {
        const pass = PASSES[i];
        const start = Date.now();

        console.log(chalk.cyan(`   ${pass.emoji} Pass ${i + 1}/${PASSES.length}: ${pass.name}...`));

        // Build user message with all available context
        let userMessage = `TARGET: ${filename}\n\n`;
        userMessage += `${reconContext}\n`;
        userMessage += `${staticContext}\n`;

        // For the attack-chain pass, include all previous findings
        if (pass.name === 'attack-chain' && allFindingsContext) {
            userMessage += `=== PREVIOUS FINDINGS (combine these) ===\n${allFindingsContext}\n`;
        }

        userMessage += `=== SOURCE CODE ===\n${code}`;

        try {
            const response = await getOpenAI().chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: pass.systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content || '{"findings":[]}';
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            const findings: AIFinding[] = (parsed.findings || []).map((f: any) => ({
                ...f,
                pass: pass.name,
            }));

            const duration = Date.now() - start;
            results.push({ pass: pass.name, findings, duration });

            console.log(chalk.yellow(`     → ${findings.length} finding(s) [${(duration / 1000).toFixed(1)}s]`));

            // Add to accumulated context for chain pass
            if (findings.length > 0) {
                allFindingsContext += `--- ${pass.name.toUpperCase()} PASS ---\n`;
                for (const f of findings) {
                    allFindingsContext += `[${f.severity}] ${f.title}: ${f.description}\n`;
                }
                allFindingsContext += '\n';
            }

        } catch (error) {
            console.error(chalk.red(`     ✗ Pass ${pass.name} failed: ${(error as Error).message}`));
            results.push({ pass: pass.name, findings: [], duration: Date.now() - start });
        }
    }

    return results;
}

/**
 * Run a single focused pass (for targeted re-analysis).
 */
export async function singlePassAnalysis(
    code: string,
    filename: string,
    passName: string,
    recon: ContractRecon,
    staticFindings: StaticFinding[],
): Promise<AIFinding[]> {
    const pass = PASSES.find(p => p.name === passName);
    if (!pass) throw new Error(`Unknown pass: ${passName}`);

    const result = await multiVectorAnalysis(code, filename, recon, staticFindings);
    return result.find(r => r.pass === passName)?.findings || [];
}
