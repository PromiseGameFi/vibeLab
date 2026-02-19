/**
 * Deep Contract Analysis
 * Goes beyond vulnerability hunting — analyzes standards compliance,
 * upgrade mechanics, access control, fund flow, and dependencies.
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

export interface TokenCompliance {
    standard: string;               // ERC-20, ERC-721, ERC-1155, none
    deviations: string[];           // Missing functions, wrong signatures
    missingEvents: string[];        // Transfer, Approval, etc.
    edgeCaseRisks: string[];        // Zero-amount, self-transfer, etc.
}

export interface UpgradeMechanics {
    isUpgradeable: boolean;
    proxyPattern: string;           // Transparent, UUPS, Beacon, Diamond, none
    storageRisks: string[];         // Layout collision, uninitialized slots
    initGuards: string[];           // initializer modifier, initialized flag
    adminControl: string;           // Who can upgrade
}

export interface AccessControlMap {
    roles: { name: string; functions: string[]; holder: string }[];
    ownershipTransfer: string;      // Ownable, 2-step, renounced, none
    timelocks: string[];            // Functions behind timelocks
    unprotectedFunctions: string[]; // State-changing without access control
}

export interface FundFlowGraph {
    entryPoints: { function: string; tokenType: string; mechanism: string }[];
    exitPoints: { function: string; tokenType: string; recipient: string }[];
    internalTransfers: string[];
    feeStructure: string;
    emergencyWithdraw: boolean;
}

export interface DependencyAnalysis {
    externalContracts: { address: string; purpose: string; trustLevel: string }[];
    oracleReliance: { oracle: string; dataUsed: string; manipulationRisk: string }[];
    approvalPatterns: { token: string; spender: string; amount: string }[];
    libraryUsage: string[];
}

export interface ContractDeepAnalysis {
    contractName: string;
    contractType: string;           // Token, DEX, Lending, Vault, Bridge, NFT, DAO, Other
    tokenCompliance: TokenCompliance;
    upgradeMechanics: UpgradeMechanics;
    accessControl: AccessControlMap;
    fundFlow: FundFlowGraph;
    dependencies: DependencyAnalysis;
    overallRiskScore: number;       // 0-100
    summary: string;
}

// ─── Analysis Prompt ────────────────────────────────────────────────

const DEEP_ANALYSIS_PROMPT = `You are an expert smart contract security analyst. Perform a DEEP structural analysis of the contract. Do NOT just look for exploits — analyze the application architecture.

You MUST respond with ONLY a JSON object in this exact format:
{
  "contractName": "string",
  "contractType": "Token|DEX|Lending|Vault|Bridge|NFT|DAO|Staking|Governance|Other",
  "tokenCompliance": {
    "standard": "ERC-20|ERC-721|ERC-1155|none",
    "deviations": ["missing function X", "non-standard return type"],
    "missingEvents": ["Transfer", "Approval"],
    "edgeCaseRisks": ["zero-amount transfer", "self-transfer"]
  },
  "upgradeMechanics": {
    "isUpgradeable": false,
    "proxyPattern": "Transparent|UUPS|Beacon|Diamond|none",
    "storageRisks": ["gap variable missing", "storage collision risk"],
    "initGuards": ["uses initializer modifier"],
    "adminControl": "owner/multisig/governance/unknown"
  },
  "accessControl": {
    "roles": [{"name": "owner", "functions": ["withdraw", "pause"], "holder": "deployer"}],
    "ownershipTransfer": "Ownable|2-step|renounced|none",
    "timelocks": ["upgrade has 48h timelock"],
    "unprotectedFunctions": ["deposit", "swap"]
  },
  "fundFlow": {
    "entryPoints": [{"function": "deposit", "tokenType": "ETH", "mechanism": "payable"}],
    "exitPoints": [{"function": "withdraw", "tokenType": "ETH", "recipient": "caller"}],
    "internalTransfers": ["fees sent to treasury on withdraw"],
    "feeStructure": "0.3% swap fee, 10% performance fee",
    "emergencyWithdraw": true
  },
  "dependencies": {
    "externalContracts": [{"address": "Uniswap Router", "purpose": "swap", "trustLevel": "high"}],
    "oracleReliance": [{"oracle": "Chainlink ETH/USD", "dataUsed": "price feed", "manipulationRisk": "low"}],
    "approvalPatterns": [{"token": "USDC", "spender": "Router", "amount": "unlimited"}],
    "libraryUsage": ["OpenZeppelin SafeMath", "solady"]
  },
  "overallRiskScore": 45,
  "summary": "2-3 sentence summary of the contract's purpose and key risk areas"
}

Be thorough but precise. If a section doesn't apply, use empty arrays. Risk score: 0=safe, 100=extremely dangerous.`;

// ─── Analysis Function ──────────────────────────────────────────────

export async function analyzeContractDeep(
    code: string,
    contractName: string,
    context?: { address?: string; balance?: string; chain?: string },
): Promise<ContractDeepAnalysis> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    let userMessage = `Analyze this smart contract:\n\nContract: ${contractName}\n`;
    if (context?.address) userMessage += `Address: ${context.address}\n`;
    if (context?.balance) userMessage += `Balance: ${context.balance} ETH\n`;
    if (context?.chain) userMessage += `Chain: ${context.chain}\n`;
    userMessage += `\n=== SOURCE CODE ===\n${code}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: DEEP_ANALYSIS_PROMPT },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean) as ContractDeepAnalysis;
    } catch (error) {
        console.error(`Deep analysis failed: ${(error as Error).message}`);
        return getEmptyAnalysis(contractName);
    }
}

function getEmptyAnalysis(name: string): ContractDeepAnalysis {
    return {
        contractName: name,
        contractType: 'Other',
        tokenCompliance: { standard: 'none', deviations: [], missingEvents: [], edgeCaseRisks: [] },
        upgradeMechanics: { isUpgradeable: false, proxyPattern: 'none', storageRisks: [], initGuards: [], adminControl: 'unknown' },
        accessControl: { roles: [], ownershipTransfer: 'none', timelocks: [], unprotectedFunctions: [] },
        fundFlow: { entryPoints: [], exitPoints: [], internalTransfers: [], feeStructure: 'unknown', emergencyWithdraw: false },
        dependencies: { externalContracts: [], oracleReliance: [], approvalPatterns: [], libraryUsage: [] },
        overallRiskScore: 0,
        summary: 'Analysis failed — unable to process contract.',
    };
}
