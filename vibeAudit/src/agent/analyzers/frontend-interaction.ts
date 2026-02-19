/**
 * Frontend Interaction Analysis
 * Analyzes how frontends/clients interact with the contract:
 * ABI surface, approval chains, front-running, gas patterns, phishing vectors.
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

export interface ABISurface {
    readFunctions: { name: string; params: string; returns: string; purpose: string }[];
    writeFunctions: { name: string; params: string; access: string; purpose: string; valueRequired: boolean }[];
    adminFunctions: { name: string; params: string; risk: string }[];
    totalFunctions: number;
    complexityScore: number;  // 0-100 how complex the interface is
}

export interface ApprovalChain {
    tokenType: string;          // ERC-20, ERC-721, ERC-1155
    flow: string[];             // ["approve(spender, amount)", "transferFrom(from, to, amount)"]
    infiniteApproval: boolean;  // Does it request max uint256?
    permit2Support: boolean;
    revokeFunction: string;     // How to revoke
    risk: string;
}

export interface TxOrderingRisk {
    scenario: string;
    attackType: string;         // "front-run", "sandwich", "back-run", "displacement"
    targetFunction: string;
    profitMechanism: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    protection: string;         // "slippage param", "commit-reveal", "private mempool", "none"
}

export interface GasCostPattern {
    function: string;
    estimatedGas: string;       // "50k", "200k", "unbounded"
    variability: string;        // "fixed", "linear with array size", "unbounded loop"
    dosRisk: boolean;           // Can an attacker make this cost too much gas?
    dosScenario: string;
}

export interface PhishingVector {
    function: string;
    vector: string;             // "similar name to safe function", "hidden fee", "confusing params"
    userImpact: string;         // What the user loses
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    mitigation: string;
}

export interface EventReliance {
    event: string;
    emittedBy: string[];        // Functions that emit it
    offChainConsumers: string;  // "frontend", "indexer", "oracle", "bridge"
    missingEmissions: string[]; // State changes that SHOULD emit but don't
    spoofRisk: string;          // Can malicious contracts emit lookalike events?
}

export interface FrontendInteractionAnalysis {
    contractName: string;
    abiSurface: ABISurface;
    approvalChains: ApprovalChain[];
    txOrderingRisks: TxOrderingRisk[];
    gasCostPatterns: GasCostPattern[];
    phishingVectors: PhishingVector[];
    eventReliance: EventReliance[];
    riskScore: number;          // 0-100
    summary: string;
}

// ─── Analysis Prompt ────────────────────────────────────────────────

const FRONTEND_ANALYSIS_PROMPT = `You are an expert at analyzing smart contract interfaces from a frontend/client perspective. Analyze how a dApp frontend would interact with this contract and identify all interaction-layer risks.

Respond with ONLY a JSON object:
{
  "contractName": "string",
  "abiSurface": {
    "readFunctions": [{"name": "balanceOf", "params": "address owner", "returns": "uint256", "purpose": "get token balance"}],
    "writeFunctions": [{"name": "transfer", "params": "address to, uint256 amount", "access": "public", "purpose": "send tokens", "valueRequired": false}],
    "adminFunctions": [{"name": "pause", "params": "none", "risk": "freezes all transfers"}],
    "totalFunctions": 15,
    "complexityScore": 40
  },
  "approvalChains": [{
    "tokenType": "ERC-20",
    "flow": ["approve(spender, amount)", "deposit(amount)"],
    "infiniteApproval": true,
    "permit2Support": false,
    "revokeFunction": "approve(spender, 0)",
    "risk": "infinite approval allows draining all user tokens if contract is compromised"
  }],
  "txOrderingRisks": [{
    "scenario": "User submits large swap, attacker sees in mempool",
    "attackType": "sandwich",
    "targetFunction": "swap",
    "profitMechanism": "manipulate price before and after user trade",
    "severity": "HIGH",
    "protection": "slippage param"
  }],
  "gasCostPatterns": [{
    "function": "claimAll",
    "estimatedGas": "unbounded",
    "variability": "linear with number of pending rewards",
    "dosRisk": true,
    "dosScenario": "Attacker creates many small dust rewards, claimAll becomes too expensive"
  }],
  "phishingVectors": [{
    "function": "transferOwnership",
    "vector": "social engineering to call from admin wallet",
    "userImpact": "complete loss of contract control",
    "severity": "CRITICAL",
    "mitigation": "use 2-step ownership transfer"
  }],
  "eventReliance": [{
    "event": "Transfer",
    "emittedBy": ["transfer", "transferFrom"],
    "offChainConsumers": "frontend balance display, indexer",
    "missingEmissions": ["mint function doesn't emit Transfer from address(0)"],
    "spoofRisk": "low — event includes indexed addresses"
  }],
  "riskScore": 50,
  "summary": "Brief summary of frontend interaction risks"
}

Be thorough about every user-facing function. Think like a dApp developer trying to integrate safely.`;

// ─── Analysis Function ──────────────────────────────────────────────

export async function analyzeFrontendInteraction(
    code: string,
    contractName: string,
    context?: { address?: string; chain?: string; abi?: any[] },
): Promise<FrontendInteractionAnalysis> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    let userMessage = `Analyze the frontend interaction surface of this contract:\n\nContract: ${contractName}\n`;
    if (context?.address) userMessage += `Address: ${context.address}\n`;
    if (context?.chain) userMessage += `Chain: ${context.chain}\n`;
    if (context?.abi) userMessage += `ABI: ${JSON.stringify(context.abi).substring(0, 2000)}\n`;
    userMessage += `\n=== SOURCE CODE ===\n${code}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: FRONTEND_ANALYSIS_PROMPT },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean) as FrontendInteractionAnalysis;
    } catch (error) {
        console.error(`Frontend interaction analysis failed: ${(error as Error).message}`);
        return getEmptyFrontendAnalysis(contractName);
    }
}

function getEmptyFrontendAnalysis(name: string): FrontendInteractionAnalysis {
    return {
        contractName: name,
        abiSurface: { readFunctions: [], writeFunctions: [], adminFunctions: [], totalFunctions: 0, complexityScore: 0 },
        approvalChains: [],
        txOrderingRisks: [],
        gasCostPatterns: [],
        phishingVectors: [],
        eventReliance: [],
        riskScore: 0,
        summary: 'Frontend interaction analysis failed.',
    };
}
