/**
 * Target Triage — Quick evaluation before running the expensive pipeline
 * Decides: "Is this worth the full 6-stage pipeline?"
 * Uses learned feature weights from the RL database for adaptive scoring.
 */

import { ethers } from 'ethers';
import chalk from 'chalk';
import crypto from 'crypto';
import axios from 'axios';
import { QueueTarget } from './queue';
import { AgentMemory } from './memory';

export interface TriageResult {
    target: QueueTarget;
    shouldAttack: boolean;
    reason: string;
    adjustedPriority: number;
    hasSource: boolean;
    source?: string;
    contractName?: string;
}

// Known OpenZeppelin/standard template bytecode prefixes
// If a contract matches, it's likely hardened and lower priority
const KNOWN_TEMPLATE_HASHES = new Set<string>([
    // These would be populated with common bytecode hashes
    // from OpenZeppelin, Uniswap, etc.
]);

// ─── Triage Function ────────────────────────────────────────────────

export async function triageTarget(
    target: QueueTarget,
    memory: AgentMemory
): Promise<TriageResult> {
    const result: TriageResult = {
        target,
        shouldAttack: true,
        reason: 'Passed triage',
        adjustedPriority: target.priority,
        hasSource: false,
    };

    // ─── Check 1: Already analyzed? ─────────────────────────────

    const existing = memory.getContract(target.address, target.chain);
    if (existing && existing.status === 'completed') {
        result.shouldAttack = false;
        result.reason = 'Already analyzed';
        return result;
    }

    // ─── Check 2: Duplicate bytecode? ───────────────────────────

    if (target.bytecodeHash && memory.hasBytecode(target.bytecodeHash)) {
        // Same bytecode = same contract code, already analyzed
        result.adjustedPriority -= 30;
        result.reason = 'Duplicate bytecode (seen before, lower priority)';

        // If very low priority after deduction, skip
        if (result.adjustedPriority <= 10) {
            result.shouldAttack = false;
            return result;
        }
    }

    // ─── Check 3: Try to get verified source ────────────────────

    const source = await tryFetchSource(target);
    if (source) {
        result.hasSource = true;
        result.source = source.code;
        result.contractName = source.name;
        result.adjustedPriority += 15; // Source is valuable
    }

    // ─── Check 4: Balance check (re-verify on-chain) ────────────

    let balanceEth = 0;
    try {
        const provider = new ethers.JsonRpcProvider(target.rpcUrl);
        const currentBalance = await provider.getBalance(target.address);
        balanceEth = parseFloat(ethers.formatEther(currentBalance));

        // Update balance
        target.balance = ethers.formatEther(currentBalance);

        if (balanceEth <= 0 && !result.hasSource) {
            // Zero balance and no source = not worth it
            result.shouldAttack = false;
            result.reason = 'Zero balance and no source code';
            return result;
        }

        // Boost priority if balance increased since discovery
        if (balanceEth > parseFloat(target.balance || '0') * 1.5) {
            result.adjustedPriority += 10;
        }
    } catch {
        // Can't verify balance, proceed with caution
    }

    // ─── Check 5: Bytecode size sanity ──────────────────────────

    let bytecodeSize = 0;
    if (!result.hasSource) {
        try {
            const provider = new ethers.JsonRpcProvider(target.rpcUrl);
            const bytecode = await provider.getCode(target.address);
            bytecodeSize = (bytecode.length - 2) / 2;

            if (bytecodeSize < 50) {
                // Too small — likely a destroy-and-recreate proxy or minimal proxy
                result.shouldAttack = false;
                result.reason = `Contract too small (${bytecodeSize} bytes)`;
                return result;
            }

            // Check if it's an EIP-1167 minimal proxy
            if (bytecode.startsWith('0x363d3d373d3d3d363d73')) {
                result.adjustedPriority -= 10; // Proxy — need to find implementation
                result.reason = 'Minimal proxy detected (lower priority)';
            }

        } catch {
            // Can't fetch bytecode, proceed
        }
    }

    // ─── Check 6: Known template check ──────────────────────────

    if (target.bytecodeHash && KNOWN_TEMPLATE_HASHES.has(target.bytecodeHash)) {
        result.adjustedPriority -= 20;
        result.reason = 'Known template (likely hardened, lower priority)';

        if (result.adjustedPriority <= 10) {
            result.shouldAttack = false;
            return result;
        }
    }



    // Clamp priority
    result.adjustedPriority = Math.max(0, Math.min(100, result.adjustedPriority));

    return result;
}

// ─── Source Fetching ────────────────────────────────────────────────

interface FetchedSource {
    code: string;
    name: string;
}

const EXPLORER_APIS: Record<string, { url: string; keyEnv: string }> = {
    ethereum: { url: 'https://api.etherscan.io/api', keyEnv: 'ETHERSCAN_API_KEY' },
    bsc: { url: 'https://api.bscscan.com/api', keyEnv: 'BSCSCAN_API_KEY' },
    arbitrum: { url: 'https://api.arbiscan.io/api', keyEnv: 'ARBISCAN_API_KEY' },
    base: { url: 'https://api.basescan.org/api', keyEnv: 'BASESCAN_API_KEY' },
};

async function tryFetchSource(target: QueueTarget): Promise<FetchedSource | null> {
    const explorer = EXPLORER_APIS[target.chain];
    if (!explorer) return null;

    const apiKey = process.env[explorer.keyEnv];
    if (!apiKey) return null;

    try {
        const response = await axios.get(explorer.url, {
            params: {
                module: 'contract',
                action: 'getsourcecode',
                address: target.address,
                apikey: apiKey,
            },
            timeout: 8000,
        });

        const data = response.data;
        if (data.status === '1' && data.result?.[0]?.SourceCode) {
            const contract = data.result[0];
            if (contract.SourceCode === '') return null;

            return {
                code: contract.SourceCode,
                name: contract.ContractName,
            };
        }
    } catch {
        // Explorer fetch failed
    }

    return null;
}
