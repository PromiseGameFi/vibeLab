/**
 * Block Watcher — Discover new contract deployments in real-time
 * Subscribes to new blocks and finds contract creation transactions.
 */

import { ethers } from 'ethers';
import chalk from 'chalk';
import crypto from 'crypto';
import { TargetQueue, QueueTarget, calculatePriority } from './queue';
import { AgentMemory } from './memory';

export interface ChainConfig {
    name: string;
    rpcUrl: string;
    wsUrl?: string;
    explorerApiUrl?: string;
    explorerApiKey?: string;
    minBalance: number;     // Min ETH to be worth attacking
}

export const DEFAULT_CHAINS: ChainConfig[] = [
    {
        name: 'ethereum',
        rpcUrl: process.env.ETH_RPC || 'https://eth.llamarpc.com',
        wsUrl: process.env.ETH_WS || undefined,
        explorerApiUrl: 'https://api.etherscan.io/api',
        explorerApiKey: process.env.ETHERSCAN_API_KEY,
        minBalance: 0.1,
    },
    {
        name: 'bsc',
        rpcUrl: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
        explorerApiUrl: 'https://api.bscscan.com/api',
        explorerApiKey: process.env.BSCSCAN_API_KEY,
        minBalance: 0.5,
    },
    {
        name: 'arbitrum',
        rpcUrl: process.env.ARB_RPC || 'https://arb1.arbitrum.io/rpc',
        explorerApiUrl: 'https://api.arbiscan.io/api',
        explorerApiKey: process.env.ARBISCAN_API_KEY,
        minBalance: 0.05,
    },
    {
        name: 'base',
        rpcUrl: process.env.BASE_RPC || 'https://mainnet.base.org',
        explorerApiUrl: 'https://api.basescan.org/api',
        explorerApiKey: process.env.BASESCAN_API_KEY,
        minBalance: 0.05,
    },
    {
        name: 'somnia',
        rpcUrl: process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network',
        minBalance: 0,
    },
    // ─── Testnets ───────────────────────────────────────────────────
    {
        name: 'sepolia',
        rpcUrl: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
        wsUrl: process.env.SEPOLIA_WS || undefined,
        explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
        explorerApiKey: process.env.ETHERSCAN_API_KEY,
        minBalance: 0,   // Testnet — accept everything
    },
    {
        name: 'bsc-testnet',
        rpcUrl: process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545',
        explorerApiUrl: 'https://api-testnet.bscscan.com/api',
        explorerApiKey: process.env.BSCSCAN_API_KEY,
        minBalance: 0,
    },
    {
        name: 'somnia-testnet',
        rpcUrl: process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network',
        minBalance: 0,
    },
];

// ─── Block Watcher ──────────────────────────────────────────────────

export class BlockWatcher {
    private providers: Map<string, ethers.JsonRpcProvider> = new Map();
    private wsProviders: Map<string, ethers.WebSocketProvider> = new Map();
    private running: boolean = false;
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private chains: ChainConfig[],
        private queue: TargetQueue,
        private memory: AgentMemory,
        private pollIntervalMs: number = 12000, // ~1 block on ETH
    ) { }

    /**
     * Start watching all configured chains.
     */
    async start(): Promise<void> {
        this.running = true;
        this.memory.log('info', 'Block watcher starting', { chains: this.chains.map(c => c.name) });

        for (const chain of this.chains) {
            try {
                // Set up HTTP provider for polling
                const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
                this.providers.set(chain.name, provider);

                // If WebSocket URL available, use it for real-time
                if (chain.wsUrl) {
                    try {
                        const wsProvider = new ethers.WebSocketProvider(chain.wsUrl);
                        this.wsProviders.set(chain.name, wsProvider);
                        this.watchViaWebSocket(chain, wsProvider);
                        console.log(chalk.green(`   ✓ ${chain.name}: WebSocket connected`));
                        continue;
                    } catch {
                        console.log(chalk.yellow(`   ⚠ ${chain.name}: WebSocket failed, falling back to polling`));
                    }
                }

                // Fallback: poll for new blocks
                this.watchViaPolling(chain, provider);
                console.log(chalk.green(`   ✓ ${chain.name}: Polling every ${this.pollIntervalMs / 1000}s`));

            } catch (error) {
                console.log(chalk.red(`   ✗ ${chain.name}: Failed to connect — ${(error as Error).message}`));
                this.memory.log('error', `Failed to connect to ${chain.name}`, { error: (error as Error).message });
            }
        }
    }

    /**
     * Stop watching all chains.
     */
    stop(): void {
        this.running = false;
        for (const [name, interval] of this.intervals) {
            clearInterval(interval);
        }
        this.intervals.clear();

        for (const [, ws] of this.wsProviders) {
            ws.destroy();
        }
        this.wsProviders.clear();
        this.providers.clear();

        this.memory.log('info', 'Block watcher stopped');
    }

    /**
     * Watch via WebSocket (real-time).
     */
    private watchViaWebSocket(chain: ChainConfig, provider: ethers.WebSocketProvider): void {
        provider.on('block', async (blockNumber: number) => {
            if (!this.running) return;
            await this.processBlock(chain, provider, blockNumber);
        });
    }

    /**
     * Watch via HTTP polling (fallback).
     */
    private watchViaPolling(chain: ChainConfig, provider: ethers.JsonRpcProvider): void {
        let lastBlock = 0;

        const interval = setInterval(async () => {
            if (!this.running) return;

            try {
                const currentBlock = await provider.getBlockNumber();
                if (currentBlock <= lastBlock) return;

                // Process all new blocks since last check
                for (let b = lastBlock + 1; b <= currentBlock; b++) {
                    await this.processBlock(chain, provider, b);
                }
                lastBlock = currentBlock;
            } catch {
                // Skip failed polls silently
            }
        }, this.pollIntervalMs);

        this.intervals.set(chain.name, interval);

        // Initialize lastBlock
        provider.getBlockNumber().then(n => { lastBlock = n; }).catch(() => { });
    }

    /**
     * Process a single block: find contract creations and queue them.
     */
    private async processBlock(
        chain: ChainConfig,
        provider: ethers.JsonRpcProvider | ethers.WebSocketProvider,
        blockNumber: number,
    ): Promise<void> {
        try {
            const block = await provider.getBlock(blockNumber, true);
            if (!block || !block.transactions) return;

            for (const txHash of block.transactions) {
                try {
                    const tx = await provider.getTransaction(txHash);
                    if (!tx || tx.to !== null) continue; // Not a contract creation

                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (!receipt || !receipt.contractAddress) continue;

                    const contractAddr = receipt.contractAddress;

                    // Skip if already known
                    if (this.memory.hasContract(contractAddr, chain.name)) continue;

                    // Get balance and bytecode
                    const [balance, bytecode] = await Promise.all([
                        provider.getBalance(contractAddr),
                        provider.getCode(contractAddr),
                    ]);

                    const balanceEth = ethers.formatEther(balance);
                    const balanceFloat = parseFloat(balanceEth);

                    // Skip if below minimum balance threshold
                    if (balanceFloat < chain.minBalance) continue;

                    const bytecodeHash = crypto.createHash('sha256')
                        .update(bytecode).digest('hex').substring(0, 16);

                    // Calculate priority
                    const priority = calculatePriority({
                        balance: balanceEth,
                        hasSource: false, // We don't have source yet
                        bytecodeSize: (bytecode.length - 2) / 2,
                        isNew: true,
                        knownVulnPatterns: this.memory.getSuccessfulCategories(),
                    });

                    const target: QueueTarget = {
                        address: contractAddr,
                        chain: chain.name,
                        rpcUrl: chain.rpcUrl,
                        bytecodeHash,
                        balance: balanceEth,
                        priority,
                        addedAt: new Date().toISOString(),
                        origin: 'watcher',
                        metadata: {
                            deployer: tx.from,
                            txHash: txHash,
                            blockNumber,
                        },
                    };

                    if (this.queue.add(target)) {
                        console.log(chalk.yellow(
                            `   🎯 [${chain.name}] New contract: ${contractAddr} ` +
                            `(${balanceEth} ETH, priority: ${priority})`
                        ));

                        this.memory.addContract({
                            address: contractAddr,
                            chain: chain.name,
                            bytecodeHash,
                            balance: balanceEth,
                            firstSeen: new Date().toISOString(),
                            totalFindings: 0,
                            confirmedExploits: 0,
                            status: 'queued',
                        });

                        this.memory.log('info', 'New target discovered', {
                            address: contractAddr,
                            chain: chain.name,
                            balance: balanceEth,
                            priority,
                        });
                    }
                } catch {
                    // Skip individual tx errors
                }
            }
        } catch {
            // Skip failed block processing
        }
    }

    /**
     * Get the status of all watched chains.
     */
    getStatus(): { chain: string; connected: boolean; type: string }[] {
        return this.chains.map(c => ({
            chain: c.name,
            connected: this.providers.has(c.name) || this.wsProviders.has(c.name),
            type: this.wsProviders.has(c.name) ? 'websocket' : 'polling',
        }));
    }
}
