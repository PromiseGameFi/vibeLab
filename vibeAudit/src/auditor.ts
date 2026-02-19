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

export interface ExploitFinding {
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    profit_potential: string;
    exploit_test_code: string;    // Full runnable Foundry test contract
    attack_vector: string;        // Step-by-step attack plan
    prerequisites: string;        // What the attacker needs (flash loan, tokens, etc.)
    line?: number;
}

export interface MevOpportunity {
    type: 'flash_loan' | 'sandwich' | 'oracle_manipulation' | 'arbitrage' | 'liquidation' | 'access_control';
    title: string;
    description: string;
    estimated_profit: string;
    exploit_code: string;
    risk_level: string;
}

// ─── System Prompts ─────────────────────────────────────────────────

const EXPLOIT_SYSTEM_PROMPT = `You are an elite Black Hat Smart Contract Hacker.
Your job is to find EXPLOITABLE vulnerabilities and write WEAPONIZED Foundry test code to prove them.

RULES:
1. For EVERY vulnerability, generate a COMPLETE, RUNNABLE Foundry test contract.
2. The test MUST be self-contained: import statements, contract definition, setUp(), and the exploit test function.
3. Use forge fork testing: assume the test runs with --fork-url pointing to a live RPC.
4. Focus on THEFT (drain funds), LOCKING (freeze assets), and MANIPULATION (game logic for profit).
5. Do NOT provide "fixes". Only provide attack strategies.
6. Be specific about profit potential (e.g., "All ETH in contract" or "Unlimited token minting").

FORMAT YOUR RESPONSE AS A JSON OBJECT with a key "findings" containing an array:
{
  "findings": [
    {
      "severity": "Critical",
      "title": "Reentrancy Drain",
      "description": "The withdraw() function sends ETH before updating balances...",
      "profit_potential": "All ETH held by the contract (~X ETH)",
      "exploit_test_code": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\nimport \\"forge-std/Test.sol\\";\\n...",
      "attack_vector": "1. Deploy attacker contract\\n2. Deposit minimum amount\\n3. Call withdraw() which triggers fallback\\n4. Fallback re-enters withdraw() before balance update\\n5. Drain all funds",
      "prerequisites": "Small amount of ETH for initial deposit",
      "line": 42
    }
  ]
}

If no EXPLOITABLE issues are found, return: {"findings": []}`;

const MEV_SYSTEM_PROMPT = `You are an MEV (Maximal Extractable Value) researcher and exploit developer.
Analyze the given smart contract code for MEV opportunities and profitable attack vectors.

Look for:
1. FLASH LOAN opportunities: Functions that rely on spot prices or balances that can be manipulated atomically.
2. SANDWICH vectors: Token swaps without slippage protection.
3. ORACLE MANIPULATION: Usage of manipulable price feeds (e.g., Uniswap spot prices).
4. ARBITRAGE: Price discrepancies between pools or protocols.
5. LIQUIDATION: Under-collateralized positions that can be liquidated for profit.
6. ACCESS CONTROL: Unprotected admin functions that can be called by anyone.

FORMAT YOUR RESPONSE AS A JSON OBJECT with a key "opportunities" containing an array:
{
  "opportunities": [
    {
      "type": "flash_loan",
      "title": "Flash Loan Oracle Manipulation",
      "description": "The contract uses Uniswap V2 spot price...",
      "estimated_profit": "Depends on pool liquidity, potentially $10K-$1M+",
      "exploit_code": "// Complete Foundry test code...",
      "risk_level": "Low risk (atomic, no capital needed)"
    }
  ]
}

If no opportunities found, return: {"opportunities": []}`;

// ─── Audit Functions ────────────────────────────────────────────────

/**
 * Analyze a contract for exploitable vulnerabilities and generate weaponized PoCs.
 */
export async function analyzeForExploits(
    code: string,
    filename: string,
    context?: { address?: string; balance?: string }
): Promise<ExploitFinding[]> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    let userMessage = `TARGET CONTRACT: ${filename}\n\n${code}`;
    if (context?.address) {
        userMessage += `\n\n--- ON-CHAIN CONTEXT ---\nDeployed at: ${context.address}\nContract balance: ${context.balance || 'Unknown'} ETH`;
    }
    userMessage += `\n\nFind every exploitable vulnerability and generate COMPLETE Foundry test code for each. GO.`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: EXPLOIT_SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{"findings":[]}';
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return (parsed.findings || parsed) as ExploitFinding[];
    } catch (error) {
        console.error(`Error analyzing ${filename}:`, error);
        return [{
            severity: 'Low',
            title: 'Analysis Failed',
            description: `AI analysis failed: ${(error as Error).message}`,
            profit_potential: 'N/A',
            exploit_test_code: '',
            attack_vector: 'Check API key or try again.',
            prerequisites: 'N/A',
        }];
    }
}

/**
 * Analyze a contract for MEV / profitable exploit opportunities.
 */
export async function analyzeForMev(
    code: string,
    filename: string,
    context?: { address?: string; balance?: string }
): Promise<MevOpportunity[]> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    let userMessage = `TARGET: ${filename}\n\n${code}`;
    if (context?.address) {
        userMessage += `\n\nDeployed at: ${context.address}\nBalance: ${context.balance || 'Unknown'} ETH`;
    }
    userMessage += `\n\nFind all MEV and profitable exploit opportunities. GO.`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: MEV_SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{"opportunities":[]}';
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return (parsed.opportunities || parsed) as MevOpportunity[];
    } catch (error) {
        console.error(`MEV analysis failed for ${filename}:`, error);
        return [];
    }
}
