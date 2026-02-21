/**
 * Chain Provider Factory — Returns the appropriate provider for a given chain name.
 */

import { ChainProvider, ChainType, getChainType, DEFAULT_RPCS, normalizeChainName } from './chain-provider';
import { EVMProvider } from './evm-provider';
import { SolanaProvider } from './solana-provider';
import { SUIProvider } from './sui-provider';

export {
    ChainProvider,
    ChainType,
    ChainIntel,
    ProgramInfo,
    TxInfo,
    SimResult,
    SimulationAction,
    getChainType,
    getChainLanguage,
    normalizeChainName,
    DEFAULT_RPCS,
} from './chain-provider';
export { EVMProvider } from './evm-provider';
export { SolanaProvider } from './solana-provider';
export { SUIProvider } from './sui-provider';
export { ChainMetadata, CHAIN_METADATA } from './chain-data';

/**
 * Get a connected chain provider for the given chain name.
 * @param chain - Chain name (e.g. 'ethereum', 'solana', 'sui')
 * @param rpcUrl - Optional custom RPC URL (falls back to DEFAULT_RPCS)
 */
export async function getProvider(chain: string, rpcUrl?: string): Promise<ChainProvider> {
    const normalizedChain = normalizeChainName(chain);
    const chainType = getChainType(normalizedChain);
    const url = rpcUrl || DEFAULT_RPCS[normalizedChain] || process.env.DEFAULT_RPC;

    if (!url) {
        throw new Error(`No RPC URL for chain "${normalizedChain}". Provide one with --rpc or set DEFAULT_RPC in .env`);
    }

    let provider: ChainProvider;

    switch (chainType) {
        case 'solana':
            provider = new SolanaProvider(normalizedChain);
            break;
        case 'sui':
            provider = new SUIProvider(normalizedChain);
            break;
        case 'evm':
        default:
            provider = new EVMProvider(normalizedChain);
            break;
    }

    await provider.connect(url);
    return provider;
}

/** All supported chains grouped by type */
export const SUPPORTED_CHAINS: Record<ChainType, string[]> = {
    evm: ['ethereum', 'sepolia', 'bsc', 'bsc-testnet', 'arbitrum', 'base', 'somnia', 'somnia-testnet'],
    solana: ['solana', 'solana-devnet'],
    sui: ['sui', 'sui-testnet'],
};

/** Flat list of all supported chain names */
export const ALL_CHAINS: string[] = [
    ...SUPPORTED_CHAINS.evm,
    ...SUPPORTED_CHAINS.solana,
    ...SUPPORTED_CHAINS.sui,
];
