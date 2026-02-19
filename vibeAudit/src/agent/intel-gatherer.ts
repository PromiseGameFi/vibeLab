/**
 * Intelligence Gatherer — Deep On-Chain Data Collection
 * Autonomously fetches everything available about a contract:
 * bytecode, source/decompiled, ABI, storage layout, tx history,
 * token info, related contracts, on-chain state.
 */

import { ethers } from 'ethers';
import axios from 'axios';
import chalk from 'chalk';
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

// ─── Data Structures ────────────────────────────────────────────────

export interface ContractIntel {
    address: string;
    chain: string;

    // Core
    bytecode: string;
    bytecodeSize: number;
    creationTx?: string;
    deployer?: string;
    deployBlock?: number;

    // Source
    sourceCode?: string;
    decompiled?: string;        // AI-decompiled if no source
    contractName: string;
    compilerVersion?: string;

    // ABI
    abi: any[];
    functionSelectors: string[];
    detectedFunctions: DetectedFunction[];

    // Storage
    storageSlots: StorageSlot[];
    owner?: string;
    isPaused?: boolean;

    // Token Info
    tokenInfo?: TokenInfo;

    // Transaction History
    recentTxs: TxSummary[];
    topCallers: { address: string; count: number }[];
    totalTxCount?: number;

    // Related Contracts
    isProxy: boolean;
    implementationAddress?: string;
    relatedContracts: RelatedContract[];

    // On-Chain State
    balance: string;
    stateSnapshot: Record<string, string>;

    // Meta
    gatherTimestamp: string;
    gatherDuration: number;
}

export interface DetectedFunction {
    selector: string;
    signature?: string;     // e.g. "transfer(address,uint256)"
    name?: string;
    stateMutability?: string;
}

export interface StorageSlot {
    slot: string;
    value: string;
    label?: string;         // What this slot likely represents
}

export interface TokenInfo {
    standard: string;       // ERC-20, ERC-721, ERC-1155
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
}

export interface TxSummary {
    hash: string;
    from: string;
    to: string;
    value: string;
    functionName?: string;
    blockNumber: number;
    timestamp?: number;
}

export interface RelatedContract {
    address: string;
    relationship: string;   // "implementation", "library", "token", "oracle", "governance"
}

// ─── Explorer API Config ────────────────────────────────────────────

const EXPLORER_APIS: Record<string, { url: string; keyEnv: string }> = {
    ethereum: { url: 'https://api.etherscan.io/api', keyEnv: 'ETHERSCAN_API_KEY' },
    sepolia: { url: 'https://api-sepolia.etherscan.io/api', keyEnv: 'ETHERSCAN_API_KEY' },
    bsc: { url: 'https://api.bscscan.com/api', keyEnv: 'BSCSCAN_API_KEY' },
    'bsc-testnet': { url: 'https://api-testnet.bscscan.com/api', keyEnv: 'BSCSCAN_API_KEY' },
    arbitrum: { url: 'https://api.arbiscan.io/api', keyEnv: 'ARBISCAN_API_KEY' },
    base: { url: 'https://api.basescan.org/api', keyEnv: 'BASESCAN_API_KEY' },
};

// ─── Well-Known Storage Slots ───────────────────────────────────────

const KNOWN_SLOTS: { slot: string; label: string }[] = [
    { slot: '0x0', label: 'slot_0 (often totalSupply or owner)' },
    { slot: '0x1', label: 'slot_1 (often name or balances mapping)' },
    { slot: '0x2', label: 'slot_2 (often symbol or allowances)' },
    { slot: '0x3', label: 'slot_3 (often decimals)' },
    // EIP-1967 proxy slots
    { slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', label: 'EIP-1967 implementation' },
    { slot: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103', label: 'EIP-1967 admin' },
    { slot: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50', label: 'EIP-1967 beacon' },
    // Ownable (OpenZeppelin)
    { slot: '0x0000000000000000000000000000000000000000000000000000000000000000', label: 'OZ Ownable owner (slot 0)' },
];

// ─── ERC Interface IDs ──────────────────────────────────────────────

const ERC_SELECTORS = {
    // ERC-20
    'totalSupply()': '0x18160ddd',
    'balanceOf(address)': '0x70a08231',
    'transfer(address,uint256)': '0xa9059cbb',
    'approve(address,uint256)': '0x095ea7b3',
    'allowance(address,address)': '0xdd62ed3e',
    'name()': '0x06fdde03',
    'symbol()': '0x95d89b41',
    'decimals()': '0x313ce567',
    // ERC-721
    'ownerOf(uint256)': '0x6352211e',
    'safeTransferFrom(address,address,uint256)': '0x42842e0e',
    'tokenURI(uint256)': '0xc87b56dd',
    // Common admin
    'owner()': '0x8da5cb5b',
    'paused()': '0x5c975abb',
    'pause()': '0x8456cb59',
    'unpause()': '0x3f4ba83a',
    // Proxy
    'implementation()': '0x5c60da1b',
    'upgradeTo(address)': '0x3659cfe6',
};

// ─── Main Gathering Function ────────────────────────────────────────

export async function gatherIntel(
    address: string,
    chain: string,
    rpcUrl: string,
): Promise<ContractIntel> {
    const startTime = Date.now();
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log(chalk.cyan(`   📡 Gathering intelligence on ${address} [${chain}]`));

    const intel: ContractIntel = {
        address,
        chain,
        bytecode: '',
        bytecodeSize: 0,
        contractName: 'Unknown',
        abi: [],
        functionSelectors: [],
        detectedFunctions: [],
        storageSlots: [],
        recentTxs: [],
        topCallers: [],
        isProxy: false,
        relatedContracts: [],
        balance: '0',
        stateSnapshot: {},
        gatherTimestamp: new Date().toISOString(),
        gatherDuration: 0,
    };

    // Run gathering steps in parallel where possible
    const [bytecodeResult, balanceResult, sourceResult] = await Promise.all([
        fetchBytecode(provider, address).catch(() => null),
        fetchBalance(provider, address).catch(() => null),
        fetchVerifiedSource(address, chain).catch(() => null),
    ]);

    // Bytecode
    if (bytecodeResult) {
        intel.bytecode = bytecodeResult;
        intel.bytecodeSize = (bytecodeResult.length - 2) / 2;
        console.log(chalk.gray(`     bytecode: ${intel.bytecodeSize} bytes`));
    }

    // Balance
    if (balanceResult !== null) {
        intel.balance = balanceResult;
        console.log(chalk.gray(`     balance: ${balanceResult} ETH`));
    }

    // Source
    if (sourceResult) {
        intel.sourceCode = sourceResult.sourceCode;
        intel.contractName = sourceResult.contractName;
        intel.compilerVersion = sourceResult.compilerVersion;
        if (sourceResult.abi.length > 0) intel.abi = sourceResult.abi;
        console.log(chalk.green(`     source: ${sourceResult.contractName} (verified)`));
    }

    // Extract function selectors from bytecode
    if (intel.bytecode) {
        intel.functionSelectors = extractSelectors(intel.bytecode);
        intel.detectedFunctions = await resolveFunctionSelectors(intel.functionSelectors);
        console.log(chalk.gray(`     functions: ${intel.detectedFunctions.length} detected`));
    }

    // Parallel: storage, proxy check, token info, tx history
    const [storageResult, proxyResult, tokenResult, txResult, creationResult] = await Promise.all([
        readStorageSlots(provider, address).catch(() => []),
        checkProxy(provider, address).catch(() => null),
        detectTokenInfo(provider, address, intel.bytecode).catch(() => null),
        fetchTxHistory(address, chain).catch(() => ({ txs: [], topCallers: [], totalCount: 0 })),
        fetchCreationTx(address, chain).catch(() => null),
    ]);

    // Storage
    intel.storageSlots = storageResult;
    if (storageResult.length > 0) {
        console.log(chalk.gray(`     storage: ${storageResult.filter(s => s.value !== '0x' + '0'.repeat(64)).length} non-zero slots read`));
    }

    // Proxy
    if (proxyResult) {
        intel.isProxy = true;
        intel.implementationAddress = proxyResult;
        intel.relatedContracts.push({ address: proxyResult, relationship: 'implementation' });
        console.log(chalk.yellow(`     proxy: YES → implementation ${proxyResult.substring(0, 12)}...`));
    }

    // Token info
    if (tokenResult) {
        intel.tokenInfo = tokenResult;
        console.log(chalk.gray(`     token: ${tokenResult.standard} ${tokenResult.symbol || ''}`));
    }

    // TX history
    intel.recentTxs = txResult.txs;
    intel.topCallers = txResult.topCallers;
    intel.totalTxCount = txResult.totalCount;
    if (txResult.txs.length > 0) {
        console.log(chalk.gray(`     txs: ${txResult.totalCount} total, ${txResult.topCallers.length} unique callers`));
    }

    // Creation tx
    if (creationResult) {
        intel.creationTx = creationResult.txHash;
        intel.deployer = creationResult.deployer;
        intel.deployBlock = creationResult.blockNumber;
        console.log(chalk.gray(`     deployer: ${creationResult.deployer.substring(0, 12)}... (block ${creationResult.blockNumber})`));
    }

    // On-chain state (owner, paused)
    intel.owner = await readOwner(provider, address).catch(() => undefined);
    intel.isPaused = await readPaused(provider, address).catch(() => undefined);
    if (intel.owner) {
        intel.stateSnapshot['owner'] = intel.owner;
        console.log(chalk.gray(`     owner: ${intel.owner.substring(0, 12)}...`));
    }

    // If no source, try AI decompilation
    if (!intel.sourceCode && intel.bytecode && intel.bytecodeSize > 100) {
        console.log(chalk.yellow(`     decompiling bytecode via AI...`));
        intel.decompiled = await aiDecompile(intel.bytecode, intel.detectedFunctions).catch(() => undefined);
        if (intel.decompiled) {
            console.log(chalk.green(`     decompiled: ${intel.decompiled.split('\n').length} lines`));
        }
    }

    intel.gatherDuration = Date.now() - startTime;
    console.log(chalk.cyan(`   ✓ Intel gathered in ${(intel.gatherDuration / 1000).toFixed(1)}s`));

    return intel;
}

// ─── Helper Functions ───────────────────────────────────────────────

async function fetchBytecode(provider: ethers.JsonRpcProvider, address: string): Promise<string> {
    const code = await provider.getCode(address);
    if (code === '0x') throw new Error('No contract at address');
    return code;
}

async function fetchBalance(provider: ethers.JsonRpcProvider, address: string): Promise<string> {
    const bal = await provider.getBalance(address);
    return ethers.formatEther(bal);
}

interface VerifiedSourceResult {
    sourceCode: string;
    contractName: string;
    compilerVersion: string;
    abi: any[];
}

async function fetchVerifiedSource(address: string, chain: string): Promise<VerifiedSourceResult | null> {
    const explorer = EXPLORER_APIS[chain];
    if (!explorer) return null;

    const apiKey = process.env[explorer.keyEnv];
    if (!apiKey) return null;

    try {
        const response = await axios.get(explorer.url, {
            params: {
                module: 'contract',
                action: 'getsourcecode',
                address,
                apikey: apiKey,
            },
            timeout: 10000,
        });

        const data = response.data;
        if (data.status === '1' && data.result?.[0]?.SourceCode && data.result[0].SourceCode !== '') {
            const c = data.result[0];
            let abi: any[] = [];
            try { abi = JSON.parse(c.ABI); } catch { }

            return {
                sourceCode: c.SourceCode,
                contractName: c.ContractName,
                compilerVersion: c.CompilerVersion,
                abi,
            };
        }
    } catch { }

    return null;
}

// ─── Function Selector Extraction ───────────────────────────────────

function extractSelectors(bytecode: string): string[] {
    // Extract 4-byte selectors from PUSH4 opcodes in bytecode
    const selectors: Set<string> = new Set();
    const hex = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;

    for (let i = 0; i < hex.length - 10; i += 2) {
        // PUSH4 = 0x63
        if (hex.substring(i, i + 2) === '63') {
            const selector = '0x' + hex.substring(i + 2, i + 10);
            // Filter out unlikely selectors (all zeros, etc.)
            if (selector !== '0x00000000' && selector !== '0xffffffff') {
                selectors.add(selector);
            }
        }
    }

    return Array.from(selectors);
}

async function resolveFunctionSelectors(selectors: string[]): Promise<DetectedFunction[]> {
    const functions: DetectedFunction[] = [];

    // First, check against known selectors
    const knownMap = new Map<string, string>();
    for (const [sig, sel] of Object.entries(ERC_SELECTORS)) {
        knownMap.set(sel, sig);
    }

    for (const selector of selectors) {
        const known = knownMap.get(selector);
        if (known) {
            const name = known.split('(')[0];
            functions.push({ selector, signature: known, name });
            continue;
        }

        // Try 4byte.directory for unknown selectors
        try {
            const resp = await axios.get(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`, {
                timeout: 3000,
            });
            if (resp.data?.results?.length > 0) {
                const sig = resp.data.results[0].text_signature;
                const name = sig.split('(')[0];
                functions.push({ selector, signature: sig, name });
            } else {
                functions.push({ selector });
            }
        } catch {
            functions.push({ selector });
        }
    }

    return functions;
}

// ─── Storage Reading ────────────────────────────────────────────────

async function readStorageSlots(
    provider: ethers.JsonRpcProvider,
    address: string,
): Promise<StorageSlot[]> {
    const slots: StorageSlot[] = [];

    for (const known of KNOWN_SLOTS) {
        try {
            const value = await provider.getStorage(address, known.slot);
            slots.push({ slot: known.slot, value, label: known.label });
        } catch {
            // Skip failed reads
        }
    }

    return slots;
}

// ─── Proxy Detection ────────────────────────────────────────────────

async function checkProxy(
    provider: ethers.JsonRpcProvider,
    address: string,
): Promise<string | null> {
    // Check EIP-1967 implementation slot
    const implSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

    try {
        const value = await provider.getStorage(address, implSlot);
        const impl = '0x' + value.slice(26); // Extract address from 32-byte slot
        if (impl !== '0x' + '0'.repeat(40) && impl !== ethers.ZeroAddress) {
            // Verify it's actually a contract
            const code = await provider.getCode(impl);
            if (code !== '0x') return impl;
        }
    } catch { }

    return null;
}

// ─── Token Detection ────────────────────────────────────────────────

async function detectTokenInfo(
    provider: ethers.JsonRpcProvider,
    address: string,
    bytecode: string,
): Promise<TokenInfo | null> {
    // Check if bytecode contains ERC-20 selectors
    const hasTransfer = bytecode.includes('a9059cbb');
    const hasBalance = bytecode.includes('70a08231');
    const hasTotalSupply = bytecode.includes('18160ddd');

    if (!hasTransfer || !hasBalance) return null;

    const contract = new ethers.Contract(address, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function ownerOf(uint256) view returns (address)',
    ], provider);

    const info: TokenInfo = { standard: hasTotalSupply ? 'ERC-20' : 'Unknown' };

    try { info.name = await contract.name(); } catch { }
    try { info.symbol = await contract.symbol(); } catch { }
    try { info.decimals = await contract.decimals(); } catch { }
    try {
        const supply = await contract.totalSupply();
        info.totalSupply = supply.toString();
    } catch { }

    // Check ERC-721
    try {
        await contract.ownerOf(1);
        info.standard = 'ERC-721';
    } catch (e: any) {
        // If it reverts with a specific error, it might still be ERC-721
        if (e?.code !== 'CALL_EXCEPTION' || !bytecode.includes('6352211e')) {
            // Not ERC-721
        } else {
            info.standard = 'ERC-721';
        }
    }

    return info;
}

// ─── Transaction History ────────────────────────────────────────────

interface TxHistoryResult {
    txs: TxSummary[];
    topCallers: { address: string; count: number }[];
    totalCount: number;
}

async function fetchTxHistory(address: string, chain: string): Promise<TxHistoryResult> {
    const explorer = EXPLORER_APIS[chain];
    if (!explorer) return { txs: [], topCallers: [], totalCount: 0 };

    const apiKey = process.env[explorer.keyEnv];
    if (!apiKey) return { txs: [], topCallers: [], totalCount: 0 };

    try {
        const response = await axios.get(explorer.url, {
            params: {
                module: 'account',
                action: 'txlist',
                address,
                startblock: 0,
                endblock: 99999999,
                page: 1,
                offset: 100,
                sort: 'desc',
                apikey: apiKey,
            },
            timeout: 10000,
        });

        if (response.data.status !== '1' || !response.data.result) {
            return { txs: [], topCallers: [], totalCount: 0 };
        }

        const rawTxs = response.data.result;
        const callerCounts = new Map<string, number>();

        const txs: TxSummary[] = rawTxs.slice(0, 50).map((tx: any) => {
            callerCounts.set(tx.from, (callerCounts.get(tx.from) || 0) + 1);
            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                functionName: tx.functionName || undefined,
                blockNumber: parseInt(tx.blockNumber),
                timestamp: parseInt(tx.timeStamp),
            };
        });

        const topCallers = Array.from(callerCounts.entries())
            .map(([address, count]) => ({ address, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return { txs, topCallers, totalCount: rawTxs.length };
    } catch {
        return { txs: [], topCallers: [], totalCount: 0 };
    }
}

// ─── Creation TX ────────────────────────────────────────────────────

async function fetchCreationTx(
    address: string,
    chain: string,
): Promise<{ txHash: string; deployer: string; blockNumber: number } | null> {
    const explorer = EXPLORER_APIS[chain];
    if (!explorer) return null;

    const apiKey = process.env[explorer.keyEnv];
    if (!apiKey) return null;

    try {
        const response = await axios.get(explorer.url, {
            params: {
                module: 'contract',
                action: 'getcontractcreation',
                contractaddresses: address,
                apikey: apiKey,
            },
            timeout: 10000,
        });

        if (response.data.status === '1' && response.data.result?.[0]) {
            const cr = response.data.result[0];
            // Get block number from tx
            return {
                txHash: cr.txHash,
                deployer: cr.contractCreator,
                blockNumber: 0, // Would need another call to get block
            };
        }
    } catch { }

    return null;
}

// ─── On-Chain State ─────────────────────────────────────────────────

async function readOwner(provider: ethers.JsonRpcProvider, address: string): Promise<string | undefined> {
    const contract = new ethers.Contract(address, ['function owner() view returns (address)'], provider);
    try {
        return await contract.owner();
    } catch {
        return undefined;
    }
}

async function readPaused(provider: ethers.JsonRpcProvider, address: string): Promise<boolean | undefined> {
    const contract = new ethers.Contract(address, ['function paused() view returns (bool)'], provider);
    try {
        return await contract.paused();
    } catch {
        return undefined;
    }
}

// ─── AI Decompilation ───────────────────────────────────────────────

async function aiDecompile(bytecode: string, functions: DetectedFunction[]): Promise<string | undefined> {
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    const funcList = functions
        .filter(f => f.signature || f.name)
        .map(f => `  ${f.selector}: ${f.signature || f.name || '?'}`)
        .join('\n');

    const prompt = `You are an EVM bytecode analyst. Given the following bytecode and detected function selectors, reconstruct the most likely Solidity interface and implementation logic.

DETECTED FUNCTIONS:
${funcList || '  (none resolved)'}

BYTECODE (first 2000 chars):
${bytecode.substring(0, 4000)}

Respond with a Solidity-like pseudo-code reconstruction. Focus on:
1. Contract interface (all functions with parameters and return types)
2. State variable layout (based on SLOAD/SSTORE patterns)
3. Access control (onlyOwner, role-based)
4. Fund flow (payable functions, ETH/token transfers)
5. Any suspicious patterns (selfdestruct, delegatecall, assembly)

Output clean Solidity-style code, even if some details are uncertain. Mark uncertain parts with comments.`;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: 'You are an expert EVM bytecode decompiler. Output clean Solidity pseudo-code.' },
                { role: 'user', content: prompt },
            ],
        });

        return response.choices[0].message.content || undefined;
    } catch {
        return undefined;
    }
}

// ─── Utility: Get analyzable code ───────────────────────────────────

/**
 * Returns the best available code for analysis.
 * Priority: verified source → AI decompiled → bytecode comment block
 */
export function getAnalyzableCode(intel: ContractIntel): string {
    if (intel.sourceCode) return intel.sourceCode;
    if (intel.decompiled) return `// AI-DECOMPILED from bytecode\n// Contract: ${intel.contractName}\n// Address: ${intel.address}\n\n${intel.decompiled}`;

    // Construct a minimal analysis doc from what we have
    const lines: string[] = [
        `// BYTECODE-ONLY ANALYSIS`,
        `// Contract: ${intel.address}`,
        `// Chain: ${intel.chain}`,
        `// Size: ${intel.bytecodeSize} bytes`,
        `// Balance: ${intel.balance} ETH`,
        ``,
    ];

    if (intel.tokenInfo) {
        lines.push(`// Token: ${intel.tokenInfo.standard} ${intel.tokenInfo.name || ''} (${intel.tokenInfo.symbol || ''})`);
    }
    if (intel.isProxy) {
        lines.push(`// PROXY → Implementation: ${intel.implementationAddress}`);
    }
    if (intel.detectedFunctions.length > 0) {
        lines.push(`\n// Detected functions:`);
        for (const fn of intel.detectedFunctions) {
            lines.push(`//   ${fn.selector}: ${fn.signature || fn.name || 'unknown'}`);
        }
    }
    if (intel.owner) {
        lines.push(`\n// Owner: ${intel.owner}`);
    }

    return lines.join('\n');
}
