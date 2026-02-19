/**
 * Bridge Security Analysis
 * Detects and analyzes cross-chain bridge patterns:
 * message verification, lock/mint, finality, admin keys, known exploit patterns.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY || 'dummy',
            baseURL: 'https://api.groq.com/openai/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://vibelab.app',
                'X-Title': 'VibeAudit',
            },
        });
    }
    return _openai;
}

// ─── Bridge Detection ───────────────────────────────────────────────

const BRIDGE_SIGNATURES = [
    'bridge', 'bridgeTo', 'bridgeFrom', 'crossChain',
    'relayMessage', 'relayTokens', 'sendMessage',
    'lockTokens', 'unlockTokens', 'lockAndBridge',
    'mintBridged', 'burnBridged',
    'verifyProof', 'verifyMessage', 'processMessage',
    'l1Bridge', 'l2Bridge', 'remoteToken',
    'sourceChain', 'destinationChain', 'chainId',
];

export function isBridgeContract(code: string): boolean {
    const lower = code.toLowerCase();
    const matchCount = BRIDGE_SIGNATURES.filter(sig => lower.includes(sig.toLowerCase())).length;
    return matchCount >= 3; // At least 3 bridge-related signatures
}

// ─── Data Structures ────────────────────────────────────────────────

export interface MessageVerification {
    mechanism: string;          // "ECDSA signature", "merkle proof", "optimistic", "multisig"
    validators: string;         // Who validates messages
    thresholdScheme: string;    // "1-of-1", "3-of-5 multisig", "optimistic 7-day"
    replayProtection: boolean;
    risks: string[];
}

export interface LockMintMechanics {
    lockFunction: string;
    mintFunction: string;
    burnFunction: string;
    unlockFunction: string;
    atomicity: string;          // "atomic", "2-phase", "optimistic"
    drainRisks: string[];       // Can locked tokens be drained?
    spoofRisks: string[];       // Can minting be spoofed?
}

export interface FinalityRisk {
    sourceChain: string;
    confirmations: string;      // Number of confirmations waited
    reorgWindow: string;        // How long the reorg window is
    risk: string;               // "reorg could cause double-spend"
    mitigation: string;
}

export interface AdminKeyRisk {
    role: string;               // "relayer", "guardian", "admin", "pauser"
    capabilities: string[];     // What they can do
    keyType: string;            // "EOA", "multisig", "governance", "unknown"
    singlePointOfFailure: boolean;
    risk: string;
}

export interface LiquidityPoolRisk {
    poolType: string;           // "locked vault", "liquidity pool", "mint/burn"
    imbalanceRisk: string;
    withdrawalRace: string;
    tvlConcentration: string;   // "single contract", "distributed"
    risk: string;
}

export interface KnownExploitPattern {
    pattern: string;            // "Wormhole guardian spoof", "Ronin multisig compromise", etc.
    match: boolean;             // Does this contract match the pattern?
    similarity: string;         // "exact", "partial", "structural"
    explanation: string;
}

export interface BridgeSecurityAnalysis {
    contractName: string;
    isBridge: boolean;
    bridgeType: string;         // "lock-mint", "burn-mint", "liquidity-pool", "optimistic", "zk-proof"
    messageVerification: MessageVerification;
    lockMintMechanics: LockMintMechanics;
    finalityRisks: FinalityRisk[];
    adminKeyRisks: AdminKeyRisk[];
    liquidityPoolRisks: LiquidityPoolRisk[];
    knownExploitPatterns: KnownExploitPattern[];
    riskScore: number;          // 0-100
    summary: string;
}

// ─── Analysis Prompt ────────────────────────────────────────────────

function getBridgeAnalysisPrompt(language: string): string {
    return `You are a cross-chain bridge security expert. Analyze this ${language} ${language === 'Move' ? 'module' : 'program'} for bridge-specific vulnerabilities and design weaknesses.

Known bridge exploit patterns to check against:
- Wormhole: Guardian key compromise, signature verification bypass
- Ronin: Multisig threshold too low, validator key compromise
- Nomad: Improper message validation, proof verification bypass
- Poly Network: Cross-chain message spoofing, keeper key management
- Multichain: Admin key custody, single point of failure
- Harmony Horizon: Insufficient multisig, validator set manipulation

Respond with ONLY a JSON object:
{
  "contractName": "string",
  "isBridge": true,
  "bridgeType": "lock-mint|burn-mint|liquidity-pool|optimistic|zk-proof|hybrid",
  "messageVerification": {
    "mechanism": "ECDSA multisig",
    "validators": "5 guardian addresses",
    "thresholdScheme": "3-of-5",
    "replayProtection": true,
    "risks": ["compromising 3 guardians allows unlimited minting"]
  },
  "lockMintMechanics": {
    "lockFunction": "deposit(address token, uint256 amount, uint256 destChainId)",
    "mintFunction": "mint(address to, uint256 amount, bytes proof)",
    "burnFunction": "burn(uint256 amount)",
    "unlockFunction": "withdraw(address to, uint256 amount, bytes proof)",
    "atomicity": "2-phase",
    "drainRisks": ["admin can call emergencyWithdraw on locked funds"],
    "spoofRisks": ["invalid proof could pass if validator is compromised"]
  },
  "finalityRisks": [{
    "sourceChain": "Ethereum",
    "confirmations": "12 blocks",
    "reorgWindow": "~3 minutes",
    "risk": "reorg could cause double-spend if tokens already minted on destination",
    "mitigation": "wait for more confirmations"
  }],
  "adminKeyRisks": [{
    "role": "relayer",
    "capabilities": ["submit proofs", "trigger minting"],
    "keyType": "EOA",
    "singlePointOfFailure": true,
    "risk": "single relayer EOA controls all cross-chain minting"
  }],
  "liquidityPoolRisks": [{
    "poolType": "locked vault",
    "imbalanceRisk": "if destination chain mints more than source locks",
    "withdrawalRace": "no queuing — large withdrawals may fail",
    "tvlConcentration": "single contract holds all locked assets",
    "risk": "single contract is high-value target"
  }],
  "knownExploitPatterns": [{
    "pattern": "Wormhole guardian spoof",
    "match": false,
    "similarity": "structural",
    "explanation": "similar guardian-based verification but with higher threshold"
  }],
  "riskScore": 70,
  "summary": "Brief summary of bridge security posture"
}

If the ${language === 'Move' ? 'module' : 'program'} is NOT a bridge, set isBridge to false and provide minimal analysis. Be thorough about all bridge-specific risks.
For Solana: check for Wormhole guardian patterns, account ownership, PDA seeds. For SUI: check shared object access, capability-based authentication.`;
}

// ─── Analysis Function ──────────────────────────────────────────────

export async function analyzeBridgeSecurity(
    code: string,
    contractName: string,
    context?: { address?: string; chain?: string; language?: string },
): Promise<BridgeSecurityAnalysis> {
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    const lang = context?.language || 'Solidity';

    // Quick check — is this even a bridge?
    if (!isBridgeContract(code)) {
        return getEmptyBridgeAnalysis(contractName);
    }

    let userMessage = `Analyze bridge security for this ${lang} ${lang === 'Move' ? 'module' : 'program'}:\n\nName: ${contractName}\n`;
    if (context?.address) userMessage += `Address: ${context.address}\n`;
    if (context?.chain) userMessage += `Chain: ${context.chain}\n`;
    userMessage += `Language: ${lang}\n`;
    userMessage += `\n=== SOURCE CODE ===\n${code}`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: getBridgeAnalysisPrompt(lang) },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content || '{}';
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean) as BridgeSecurityAnalysis;
    } catch (error) {
        console.error(`Bridge security analysis failed: ${(error as Error).message}`);
        return getEmptyBridgeAnalysis(contractName);
    }
}

function getEmptyBridgeAnalysis(name: string): BridgeSecurityAnalysis {
    return {
        contractName: name,
        isBridge: false,
        bridgeType: 'none',
        messageVerification: { mechanism: 'N/A', validators: 'N/A', thresholdScheme: 'N/A', replayProtection: false, risks: [] },
        lockMintMechanics: { lockFunction: '', mintFunction: '', burnFunction: '', unlockFunction: '', atomicity: 'N/A', drainRisks: [], spoofRisks: [] },
        finalityRisks: [],
        adminKeyRisks: [],
        liquidityPoolRisks: [],
        knownExploitPatterns: [],
        riskScore: 0,
        summary: 'Not a bridge contract — bridge analysis skipped.',
    };
}
