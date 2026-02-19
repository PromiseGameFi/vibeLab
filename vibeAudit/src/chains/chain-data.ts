/**
 * Rich Metadata for supported blockchains.
 * Sourced from chainlist.org and respective network documentation.
 */

export interface ChainMetadata {
    id: number | string; // Numeric for EVM, string identifier for Solana/Sui
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorers?: {
        name: string;
        url: string;
        apiUrl?: string;
    }[];
    contracts?: {
        wrappedNative?: string;
        multicall?: string;
        usdc?: string;
        usdt?: string;
    };
    testnet: boolean;
}

export const CHAIN_METADATA: Record<string, ChainMetadata> = {
    'ethereum': {
        id: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://eth.llamarpc.com', 'https://cloudflare-eth.com'],
        blockExplorers: [{ name: 'Etherscan', url: 'https://etherscan.io', apiUrl: 'https://api.etherscan.io/api' }],
        contracts: {
            wrappedNative: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'sepolia': {
        id: 11155111,
        name: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorers: [{ name: 'Etherscan', url: 'https://sepolia.etherscan.io', apiUrl: 'https://api-sepolia.etherscan.io/api' }],
        contracts: {
            wrappedNative: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: true,
    },
    'bsc': {
        id: 56,
        name: 'BNB Smart Chain Mainnet',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed1.binance.org', 'https://bsc-rpc.publicnode.com'],
        blockExplorers: [{ name: 'BscScan', url: 'https://bscscan.com', apiUrl: 'https://api.bscscan.com/api' }],
        contracts: {
            wrappedNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            usdt: '0x55d398326f99059fF775485246999027B3197955',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'bsc-testnet': {
        id: 97,
        name: 'BNB Smart Chain Testnet',
        nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        blockExplorers: [{ name: 'BscScan Testnet', url: 'https://testnet.bscscan.com', apiUrl: 'https://api-testnet.bscscan.com/api' }],
        contracts: {
            wrappedNative: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: true,
    },
    'arbitrum': {
        id: 42161,
        name: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com'],
        blockExplorers: [{ name: 'Arbiscan', url: 'https://arbiscan.io', apiUrl: 'https://api.arbiscan.io/api' }],
        contracts: {
            wrappedNative: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'base': {
        id: 8453,
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org', 'https://base.llamarpc.com'],
        blockExplorers: [{ name: 'Basescan', url: 'https://basescan.org', apiUrl: 'https://api.basescan.org/api' }],
        contracts: {
            wrappedNative: '0x4200000000000000000000000000000000000006',
            usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'solana': {
        id: 'mainnet-beta',
        name: 'Solana Mainnet',
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: ['https://api.mainnet-beta.solana.com'],
        blockExplorers: [{ name: 'Solscan', url: 'https://solscan.io' }],
        contracts: {
            wrappedNative: 'So11111111111111111111111111111111111111112',
            usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        },
        testnet: false,
    },
    'solana-devnet': {
        id: 'devnet',
        name: 'Solana Devnet',
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: ['https://api.devnet.solana.com'],
        blockExplorers: [{ name: 'Solscan Devnet', url: 'https://devnet.solscan.io' }],
        contracts: {
            wrappedNative: 'So11111111111111111111111111111111111111112'
        },
        testnet: true,
    },
    'sui': {
        id: 'mainnet',
        name: 'Sui Mainnet',
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
        rpcUrls: ['https://fullnode.mainnet.sui.io:443'],
        blockExplorers: [{ name: 'Suiscan', url: 'https://suiscan.xyz/mainnet' }],
        testnet: false,
    },
    'sui-testnet': {
        id: 'testnet',
        name: 'Sui Testnet',
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
        rpcUrls: ['https://fullnode.testnet.sui.io:443'],
        blockExplorers: [{ name: 'Suiscan Testnet', url: 'https://suiscan.xyz/testnet' }],
        testnet: true,
    },
    'polygon': {
        id: 137,
        name: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com', 'https://polygon.llamarpc.com'],
        blockExplorers: [{ name: 'PolygonScan', url: 'https://polygonscan.com', apiUrl: 'https://api.polygonscan.com/api' }],
        contracts: {
            wrappedNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
            usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Bridged USDC
            usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'optimism': {
        id: 10,
        name: 'OP Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.optimism.io', 'https://optimism.llamarpc.com'],
        blockExplorers: [{ name: 'OPScan', url: 'https://optimistic.etherscan.io', apiUrl: 'https://api-optimistic.etherscan.io/api' }],
        contracts: {
            wrappedNative: '0x4200000000000000000000000000000000000006', // WETH on OP
            usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'avalanche': {
        id: 43114,
        name: 'Avalanche C-Chain',
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
        blockExplorers: [{ name: 'Snowtrace', url: 'https://snowtrace.io', apiUrl: 'https://api.snowtrace.io/api' }],
        contracts: {
            wrappedNative: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
            usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            usdt: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11'
        },
        testnet: false,
    },
    'somnia': {
        id: 5031,
        name: 'Somnia Mainnet',
        nativeCurrency: { name: 'Somnia', symbol: 'SOMI', decimals: 18 },
        rpcUrls: ['https://api.infra.mainnet.somnia.network/'],
        blockExplorers: [{ name: 'Somnia Explorer', url: 'https://explorer.somnia.network' }],
        testnet: false,
    },
    'somnia-testnet': {
        id: 50312,
        name: 'Somnia Testnet (Shannon)',
        nativeCurrency: { name: 'Somnia Test Token', symbol: 'STT', decimals: 18 },
        rpcUrls: ['https://dream-rpc.somnia.network/'],
        blockExplorers: [{ name: 'Shannon Explorer', url: 'https://shannon-explorer.somnia.network' }],
        testnet: true,
    },
};
