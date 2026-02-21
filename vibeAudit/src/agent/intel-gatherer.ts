/**
 * Intelligence Gatherer — Chain-agnostic intelligence collection.
 * Uses the chain provider abstraction so EVM, Solana, and Sui share one flow.
 */

import { getProvider, ChainIntel } from '../chains';

export interface DetectedFunction {
    selector: string;
    signature?: string;
    name?: string;
    stateMutability?: string;
}

export interface StorageSlot {
    slot: string;
    value: string;
    label?: string;
}

export interface TokenInfo {
    standard: string;
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
    relationship: string;
}

export interface ContractIntel {
    address: string;
    chain: string;
    language: string;

    bytecode: string;
    bytecodeSize: number;
    balance: string;

    contractName: string;
    sourceCode?: string;
    decompiled?: string;

    functionSelectors: string[];
    detectedFunctions: DetectedFunction[];

    storageSlots: StorageSlot[];
    owner?: string;
    isPaused?: boolean;

    tokenInfo?: TokenInfo;

    recentTxs: TxSummary[];
    topCallers: { address: string; count: number }[];
    totalTxCount?: number;

    isProxy: boolean;
    implementationAddress?: string;
    relatedContracts: RelatedContract[];

    creationTx?: string;
    deployer?: string;
    deployBlock?: number;
    compilerVersion?: string;

    stateSnapshot: Record<string, string>;
    gatherTimestamp: string;
    gatherDuration: number;

    chainType: string;
    rawChainIntel: ChainIntel;
}

function selectorFromFunctionName(name: string): string {
    if (name.startsWith('0x')) return name;
    return `fn:${name}`;
}

export async function gatherIntel(
    address: string,
    chain: string,
    rpcUrl?: string,
): Promise<ContractIntel> {
    const start = Date.now();
    const provider = await getProvider(chain, rpcUrl);
    const intel = await provider.gatherIntel(address);
    const txs = await provider.getRecentTransactions(address, 50).catch(() => []);

    const relatedContracts: RelatedContract[] = [];
    const implAddress = (intel.extra?.implAddress as string | undefined)
        || (intel.extra?.implementationAddress as string | undefined);

    if (implAddress) {
        relatedContracts.push({ address: implAddress, relationship: 'implementation' });
    }

    const callerCounts = new Map<string, number>();
    for (const tx of txs) {
        if (tx.from) callerCounts.set(tx.from, (callerCounts.get(tx.from) || 0) + 1);
    }

    const topCallers = Array.from(callerCounts.entries())
        .map(([callerAddress, count]) => ({ address: callerAddress, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const detectedFunctions: DetectedFunction[] = intel.detectedFunctions.map((entry) => {
        if (entry.startsWith('0x')) {
            return { selector: entry };
        }

        const name = entry.includes('::') ? entry.split('::').slice(-1)[0] : entry;
        return {
            selector: selectorFromFunctionName(entry),
            name,
            signature: entry,
        };
    });

    const stateSnapshot: Record<string, string> = {};
    if (intel.owner) stateSnapshot.owner = intel.owner;

    const summaryTxs: TxSummary[] = txs.map((tx, index) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        functionName: tx.methodName,
        blockNumber: index,
        timestamp: tx.timestamp,
    }));

    return {
        address,
        chain: intel.chainName,
        chainType: intel.chainType,
        language: intel.language,

        bytecode: intel.bytecode,
        bytecodeSize: intel.bytecodeSize,
        balance: intel.balance,

        contractName: intel.programName,
        sourceCode: intel.sourceCode,
        decompiled: intel.decompiledCode,

        functionSelectors: intel.detectedFunctions.map(selectorFromFunctionName),
        detectedFunctions,

        storageSlots: [],
        owner: intel.owner,
        isPaused: undefined,

        tokenInfo: intel.tokenInfo,

        recentTxs: summaryTxs,
        topCallers,
        totalTxCount: intel.totalTxCount,

        isProxy: !!intel.extra?.isProxy,
        implementationAddress: implAddress,
        relatedContracts,

        creationTx: undefined,
        deployer: intel.deployer,
        deployBlock: undefined,
        compilerVersion: undefined,

        stateSnapshot,
        gatherTimestamp: new Date().toISOString(),
        gatherDuration: Date.now() - start,

        rawChainIntel: intel,
    };
}

/**
 * Returns the best available code for analysis.
 * Priority: verified source -> chain decompiled view -> bytecode fallback.
 */
export function getAnalyzableCode(intel: ContractIntel): string {
    if (intel.sourceCode) return intel.sourceCode;
    if (intel.decompiled) {
        return [
            `// AI-DECOMPILED`,
            `// Contract: ${intel.contractName}`,
            `// Address: ${intel.address}`,
            `// Chain: ${intel.chain}`,
            '',
            intel.decompiled,
        ].join('\n');
    }

    const lines = [
        '// BYTECODE-ONLY ANALYSIS',
        `// Contract: ${intel.address}`,
        `// Chain: ${intel.chain}`,
        `// Size: ${intel.bytecodeSize} bytes`,
        `// Balance: ${intel.balance}`,
        '',
        intel.bytecode,
    ];

    return lines.join('\n');
}
