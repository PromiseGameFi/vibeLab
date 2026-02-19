/**
 * Process Flow Analysis
 * Analyzes the contract as a state machine / business process.
 * Maps state transitions, user journeys, ordering risks, and economic flow.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

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

// ─── Data Structures ────────────────────────────────────────────────

export interface StateTransition {
    from: string;
    to: string;
    trigger: string;        // Function call that causes transition
    conditions: string[];   // Required state/conditions
    sideEffects: string[];  // Fund movements, events emitted
}

export interface UserJourney {
    persona: string;        // "depositor", "borrower", "LP provider", "admin"
    steps: string[];        // Ordered actions
    risks: string[];        // Where they can get stuck/lose funds
    happyPath: boolean;     // Is this the intended flow?
}

export interface OrderingRisk {
    description: string;
    functions: string[];    // Functions involved
    riskType: string;       // "front-run", "race-condition", "sandwich", "forced-ordering"
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    mitigation: string;
}

export interface TimeDependency {
    function: string;
    mechanism: string;      // "block.timestamp", "block.number", "deadline param"
    purpose: string;        // "cooldown", "expiry", "TWAP", "vesting"
    risk: string;           // "miner manipulation", "deadline bypass", etc.
}

export interface EconomicFlow {
    pattern: string;        // "stake-earn-withdraw", "deposit-borrow-repay", "swap"
    steps: string[];
    feePoints: string[];    // Where fees are collected
    slippageRisks: string[];
    mevExposure: string;    // "sandwich-vulnerable", "front-run-risk", "none"
}

export interface ProcessFlowAnalysis {
    contractName: string;
    states: string[];                   // All possible contract states
    transitions: StateTransition[];
    userJourneys: UserJourney[];
    orderingRisks: OrderingRisk[];
    timeDependencies: TimeDependency[];
    economicFlows: EconomicFlow[];
    mermaidDiagram: string;             // Mermaid state diagram
    riskScore: number;                  // 0-100
    summary: string;
}

// ─── Analysis Prompt ────────────────────────────────────────────────

const PROCESS_FLOW_PROMPT = `You are a smart contract process analyst. Analyze the contract as a STATE MACHINE and BUSINESS PROCESS. Focus on HOW users interact with it, not just vulnerability hunting.

Respond with ONLY a JSON object:
{
  "contractName": "string",
  "states": ["Active", "Paused", "Locked", "Finalized"],
  "transitions": [{
    "from": "Active",
    "to": "Paused",
    "trigger": "pause()",
    "conditions": ["caller is owner"],
    "sideEffects": ["Paused event emitted"]
  }],
  "userJourneys": [{
    "persona": "depositor",
    "steps": ["approve tokens", "call deposit(amount)", "wait for earnings", "call withdraw()"],
    "risks": ["can be front-run on deposit", "withdraw may revert if pool is empty"],
    "happyPath": true
  }],
  "orderingRisks": [{
    "description": "Deposit can be sandwich attacked",
    "functions": ["deposit", "swap"],
    "riskType": "sandwich",
    "severity": "HIGH",
    "mitigation": "Add slippage protection parameter"
  }],
  "timeDependencies": [{
    "function": "claim",
    "mechanism": "block.timestamp",
    "purpose": "cooldown period",
    "risk": "miner can manipulate by ~15 seconds"
  }],
  "economicFlows": [{
    "pattern": "stake-earn-withdraw",
    "steps": ["stake tokens", "accrue rewards per block", "claim rewards", "unstake"],
    "feePoints": ["10% fee on rewards claim"],
    "slippageRisks": ["reward token price can drop between earning and claiming"],
    "mevExposure": "front-run-risk on large claims"
  }],
  "mermaidDiagram": "stateDiagram-v2\\n    [*] --> Active\\n    Active --> Paused: pause()\\n    Paused --> Active: unpause()\\n    Active --> Finalized: finalize()",
  "riskScore": 55,
  "summary": "Brief summary of the process flow and key risks"
}

Map EVERY state transition and user path. Be thorough. If something doesn't apply, use empty arrays.`;

// ─── Analysis Function ──────────────────────────────────────────────

export async function analyzeProcessFlow(
    code: string,
    contractName: string,
    context?: { address?: string; balance?: string; chain?: string },
): Promise<ProcessFlowAnalysis> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    let userMessage = `Analyze the process flow of this contract:\n\nContract: ${contractName}\n`;
    if (context?.address) userMessage += `Address: ${context.address}\n`;
    if (context?.chain) userMessage += `Chain: ${context.chain}\n`;
    userMessage += `\n=== SOURCE CODE ===\n${code}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: PROCESS_FLOW_PROMPT },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean) as ProcessFlowAnalysis;
    } catch (error) {
        console.error(`Process flow analysis failed: ${(error as Error).message}`);
        return getEmptyProcessFlow(contractName);
    }
}

function getEmptyProcessFlow(name: string): ProcessFlowAnalysis {
    return {
        contractName: name,
        states: [],
        transitions: [],
        userJourneys: [],
        orderingRisks: [],
        timeDependencies: [],
        economicFlows: [],
        mermaidDiagram: 'stateDiagram-v2\n    [*] --> Unknown',
        riskScore: 0,
        summary: 'Process flow analysis failed.',
    };
}
