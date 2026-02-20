/**
 * Rich Metadata for supported blockchains.
 * Sourced from chainlist.org and respective network documentation.
 * Enriched with DeFi infrastructure and chain characteristics for the ReAct Strategist.
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
        // Standard Assets
        wrappedNative?: string;
        usdc?: string;
        usdt?: string;
        // Utilities
        multicall?: string;
        // DeFi Infrastructure (For Flash Loans & DEX routing)
        uniswapV2Router?: string;
        uniswapV3Router?: string;
        aaveV3Pool?: string;
        balancerVault?: string;
    };
    characteristics: {
        blockTimeSeconds: number;
        hasPublicMempool: boolean;
        supportsEip1559: boolean;
        // Seed the ReAct Attack Strategist with high-probability vectors
        attackPriors: string[];
    };
    testnet: boolean;
}

export const CHAIN_METADATA: Record<string, ChainMetadata> = {
    'ethereum': {
        id: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://cloudflare-eth.com', 'https://eth.llamarpc.com'],
        blockExplorers: [{ name: 'Etherscan', url: 'https://etherscan.io', apiUrl: 'https://api.etherscan.io/api' }],
        contracts: {
            wrappedNative: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            aaveV3Pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
            balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        },
        characteristics: {
            blockTimeSeconds: 12,
            hasPublicMempool: true,
            supportsEip1559: true,
            attackPriors: ['reentrancy', 'flash_loan_manipulation', 'sandwich_attack', 'frontrunning']
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV3Router: '0x3bFA4769FC45f478CE87cb114cf746F158cb11',
            aaveV3Pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
        },
        characteristics: {
            blockTimeSeconds: 12,
            hasPublicMempool: true,
            supportsEip1559: true,
            attackPriors: ['reentrancy']
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV2Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
            uniswapV3Router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', // PancakeSwap V3
        },
        characteristics: {
            blockTimeSeconds: 3,
            hasPublicMempool: true,
            supportsEip1559: false, // BSC is legacy Type 0 transactions mainly
            attackPriors: ['flash_loan_manipulation', 'reentrancy', 'price_oracle_manipulation']
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
        characteristics: {
            blockTimeSeconds: 3,
            hasPublicMempool: true,
            supportsEip1559: false,
            attackPriors: ['reentrancy']
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            aaveV3Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
            balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        },
        characteristics: {
            blockTimeSeconds: 0.25, // Very fast
            hasPublicMempool: false, // FCFS Sequencer
            supportsEip1559: true,
            attackPriors: ['flash_loan_manipulation', 'reentrancy', 'time_manipulation'] // No sandwiching on pure FCFS
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV3Router: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 on Base
            aaveV3Pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
        },
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: false, // OP Stack Sequencer
            supportsEip1559: true,
            attackPriors: ['flash_loan_manipulation', 'reentrancy', 'oracle_manipulation']
        },
        testnet: false,
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            aaveV3Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
            balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        },
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: true,
            supportsEip1559: true,
            attackPriors: ['flash_loan_manipulation', 'reentrancy', 'sandwich_attack']
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            aaveV3Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        },
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: false, // OP Stack Sequencer
            supportsEip1559: true,
            attackPriors: ['flash_loan_manipulation', 'reentrancy']
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
            multicall: '0xca11bde05977b3631167028862be2a173976ca11',
            uniswapV2Router: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', // TraderJoe V1
            aaveV3Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        },
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: true,
            supportsEip1559: true, // Type 2 txns supported
            attackPriors: ['flash_loan_manipulation', 'reentrancy', 'sandwich_attack']
        },
        testnet: false,
    },
    'somnia': {
        id: 5031,
        name: 'Somnia Mainnet',
        nativeCurrency: { name: 'Somnia', symbol: 'SOMI', decimals: 18 },
        rpcUrls: ['https://api.infra.mainnet.somnia.network/'],
        blockExplorers: [{ name: 'Somnia Explorer', url: 'https://explorer.somnia.network' }],
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: true,
            supportsEip1559: true,
            attackPriors: ['reentrancy', 'access_control']
        },
        testnet: false,
    },
    'somnia-testnet': {
        id: 50312,
        name: 'Somnia Testnet (Shannon)',
        nativeCurrency: { name: 'Somnia Test Token', symbol: 'STT', decimals: 18 },
        rpcUrls: ['https://dream-rpc.somnia.network/'],
        blockExplorers: [{ name: 'Shannon Explorer', url: 'https://shannon-explorer.somnia.network' }],
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: true,
            supportsEip1559: true,
            attackPriors: ['reentrancy']
        },
        testnet: true,
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
        characteristics: {
            blockTimeSeconds: 0.4, // Extremely fast
            hasPublicMempool: false, // Validating by Gulf Stream
            supportsEip1559: false, // Distinct fee market
            attackPriors: ['account_confusion', 'missing_signer_check', 'cpi_spoofing', 'pda_bump_seed_manipulation']
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
        characteristics: {
            blockTimeSeconds: 0.4,
            hasPublicMempool: false,
            supportsEip1559: false,
            attackPriors: ['account_confusion']
        },
        testnet: true,
    },
    'sui': {
        id: 'mainnet',
        name: 'Sui Mainnet',
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
        rpcUrls: ['https://fullnode.mainnet.sui.io:443'],
        blockExplorers: [{ name: 'Suiscan', url: 'https://suiscan.xyz/mainnet' }],
        characteristics: {
            blockTimeSeconds: 2, // Depends on consensus epoch
            hasPublicMempool: false,
            supportsEip1559: false,
            attackPriors: ['object_sharing_flaws', 'type_confusion', 'coin_splitting_bugs']
        },
        testnet: false,
    },
    'sui-testnet': {
        id: 'testnet',
        name: 'Sui Testnet',
        nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
        rpcUrls: ['https://fullnode.testnet.sui.io:443'],
        blockExplorers: [{ name: 'Suiscan Testnet', url: 'https://suiscan.xyz/testnet' }],
        characteristics: {
            blockTimeSeconds: 2,
            hasPublicMempool: false,
            supportsEip1559: false,
            attackPriors: ['object_sharing_flaws']
        },
        testnet: true,
    },
};
