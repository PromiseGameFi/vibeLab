/**
 * Chain Provider Factory — Returns the appropriate provider for a given chain name.
 */

import { ChainProvider, ChainType, getChainType, DEFAULT_RPCS } from './chain-provider';
import { EVMProvider } from './evm-provider';
import { SolanaProvider } from './solana-provider';
import { SUIProvider } from './sui-provider';

export { ChainProvider, ChainType, ChainIntel, ProgramInfo, TxInfo, SimResult, getChainType, getChainLanguage, DEFAULT_RPCS } from './chain-provider';
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
    const chainType = getChainType(chain);
    const url = rpcUrl || DEFAULT_RPCS[chain];

    if (!url) {
        throw new Error(`No RPC URL for chain "${chain}". Provide one with --rpc or set DEFAULT_RPC in .env`);
    }

    let provider: ChainProvider;

    switch (chainType) {
        case 'solana':
            provider = new SolanaProvider(chain);
            break;
        case 'sui':
            provider = new SUIProvider(chain);
            break;
        case 'evm':
        default:
            provider = new EVMProvider(chain);
            break;
    }

    await provider.connect(url);
    return provider;
}

/** All supported chains grouped by type */
export const SUPPORTED_CHAINS: Record<ChainType, string[]> = {
    evm: ['ethereum', 'sepolia', 'bsc', 'bsc-testnet', 'arbitrum', 'base'],
    solana: ['solana', 'solana-devnet'],
    sui: ['sui', 'sui-testnet'],
};

/** Flat list of all supported chain names */
export const ALL_CHAINS: string[] = [
    ...SUPPORTED_CHAINS.evm,
    ...SUPPORTED_CHAINS.solana,
    ...SUPPORTED_CHAINS.sui,
];
