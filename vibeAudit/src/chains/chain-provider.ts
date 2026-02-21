/**
 * Chain Provider Interface — Abstracts chain-specific operations
 * so the analysis pipeline works across EVM, Solana, and SUI.
 */

// ─── Shared Types ───────────────────────────────────────────────────

export type ChainType = 'evm' | 'solana' | 'sui';

export interface ProgramInfo {
    address: string;
    name: string;
    bytecodeSize: number;
    balance: string;           // Native token balance as string
    hasSource: boolean;
    sourceCode?: string;
    language: 'solidity' | 'vyper' | 'rust' | 'move' | 'unknown';
    abi?: any;                 // ABI / IDL / Move module
}

export interface ChainIntel {
    chainType: ChainType;
    chainName: string;
    address: string;
    programName: string;
    bytecode: string;
    bytecodeSize: number;
    balance: string;
    sourceCode?: string;
    decompiledCode?: string;
    language: 'solidity' | 'vyper' | 'rust' | 'move' | 'unknown';

    // Contract/program metadata
    isUpgradeable: boolean;        // Proxy (EVM) / Upgradeable program (Solana) / upgradeable package (SUI)
    deployer?: string;
    owner?: string;
    createdAt?: string;

    // Token info (if applicable)
    tokenInfo?: {
        standard: string;          // ERC-20, SPL, Coin<T>
        symbol?: string;
        name?: string;
        decimals?: number;
        totalSupply?: string;
    };

    // Functions / instructions
    detectedFunctions: string[];
    totalTxCount: number;

    // Chain-specific extras
    extra: Record<string, any>;
}

export interface TxInfo {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    success: boolean;
    methodName?: string;
}

export interface SimulationAction {
    chain: string;
    target?: string;
    from?: string;
    to?: string;
    data?: string;
    value?: string;
    blockTag?: string | number;
    rawTransactionBase64?: string;
    transactionBlock?: string;
    sender?: string;
    payload?: Record<string, unknown>;
}

export interface SimResult {
    supported: boolean;            // Can this chain simulate exploits?
    passed: boolean;
    chain?: string;
    output?: string;
    error?: string;
    duration?: number;
    gasUsed?: string;
    details?: Record<string, unknown>;
}

// ─── Chain Provider Interface ───────────────────────────────────────

export interface ChainProvider {
    readonly chainType: ChainType;
    readonly chainName: string;

    /** Connect to the chain RPC */
    connect(rpcUrl: string): Promise<void>;

    /** Get native token balance */
    getBalance(address: string): Promise<string>;

    /** Fetch program/contract info */
    fetchProgram(address: string): Promise<ProgramInfo>;

    /** Gather deep intelligence for the analysis pipeline */
    gatherIntel(address: string): Promise<ChainIntel>;

    /** Get verified source code (if available) */
    getSourceCode(address: string): Promise<string | null>;

    /** Decompile or disassemble raw bytecode */
    decompileOrDisassemble(bytecode: string): Promise<string>;

    /** Get recent transactions for an address */
    getRecentTransactions(address: string, count: number): Promise<TxInfo[]>;

    /** Whether this chain supports fork-based exploit simulation */
    canSimulate(): boolean;

    /** Simulate an action against live chain state (defensive mode). */
    simulateAction(action: SimulationAction): Promise<SimResult>;

    /** Optional broadcast action. Disabled in defensive mode by default. */
    broadcastAction?(action: SimulationAction): Promise<SimResult>;
}

// ─── Default RPC URLs ────────────────────────────────────────────────

export const DEFAULT_RPCS: Record<string, string> = {
    // EVM
    ethereum: 'https://cloudflare-eth.com',
    sepolia: 'https://rpc.sepolia.org',
    bsc: 'https://bsc-dataseed1.binance.org',
    'bsc-testnet': 'https://data-seed-prebsc-1-s1.binance.org:8545',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    base: 'https://mainnet.base.org',
    somnia: 'https://dream-rpc.somnia.network',
    'somnia-testnet': 'https://dream-rpc.somnia.network',

    // Solana
    'solana': 'https://api.mainnet-beta.solana.com',
    'solana-devnet': 'https://api.devnet.solana.com',

    // SUI
    'sui': 'https://fullnode.mainnet.sui.io:443',
    'sui-testnet': 'https://fullnode.testnet.sui.io:443',
};

/** Determine chain type from chain name */
export function getChainType(chain: string): ChainType {
    const solanaChains = ['solana', 'solana-devnet', 'solana-testnet'];
    const suiChains = ['sui', 'sui-testnet', 'sui-devnet'];

    if (solanaChains.includes(chain)) return 'solana';
    if (suiChains.includes(chain)) return 'sui';
    return 'evm';
}

export function normalizeChainName(chain: string): string {
    const normalized = chain.trim().toLowerCase();
    if (normalized === 'eth' || normalized === 'mainnet') return 'ethereum';
    if (normalized === 'arb') return 'arbitrum';
    if (normalized === 'bnb') return 'bsc';
    return normalized;
}

/** Get the smart contract language for a chain */
export function getChainLanguage(chain: string): string {
    const type = getChainType(chain);
    if (type === 'solana') return 'Rust (Anchor)';
    if (type === 'sui') return 'Move';
    return 'Solidity';
}
