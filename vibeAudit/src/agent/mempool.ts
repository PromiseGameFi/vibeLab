/**
 * Mempool Monitor — Watch pending transactions for opportunities
 * Catches contracts before they land on-chain.
 */

import { ethers } from 'ethers';
import chalk from 'chalk';
import { TargetQueue, QueueTarget, calculatePriority } from './queue';
import { AgentMemory } from './memory';

export class MempoolMonitor {
    private wsProvider: ethers.WebSocketProvider | null = null;
    private running: boolean = false;

    constructor(
        private queue: TargetQueue,
        private memory: AgentMemory,
    ) { }

    /**
     * Start monitoring the mempool via WebSocket.
     * Requires a WebSocket endpoint that supports pending tx subscriptions.
     */
    async start(wsUrl: string, chainName: string, rpcUrl: string): Promise<boolean> {
        try {
            this.wsProvider = new ethers.WebSocketProvider(wsUrl);
            this.running = true;

            // Subscribe to pending transactions
            this.wsProvider.on('pending', async (txHash: string) => {
                if (!this.running) return;
                await this.processPendingTx(txHash, chainName, rpcUrl);
            });

            this.memory.log('info', 'Mempool monitor started', { chain: chainName });
            console.log(chalk.green(`   ✓ Mempool monitor: Connected to ${chainName}`));
            return true;
        } catch (error) {
            console.log(chalk.yellow(`   ⚠ Mempool monitor: Failed — ${(error as Error).message}`));
            this.memory.log('warn', 'Mempool monitor failed to start', { error: (error as Error).message });
            return false;
        }
    }

    stop(): void {
        this.running = false;
        if (this.wsProvider) {
            this.wsProvider.destroy();
            this.wsProvider = null;
        }
        this.memory.log('info', 'Mempool monitor stopped');
    }

    private async processPendingTx(txHash: string, chainName: string, rpcUrl: string): Promise<void> {
        if (!this.wsProvider) return;

        try {
            const tx = await this.wsProvider.getTransaction(txHash);
            if (!tx) return;

            // We care about contract deployments (to === null)
            if (tx.to !== null) {
                // Also watch for interesting function calls on known contracts
                // e.g., initialize(), large approve(), addLiquidity()
                await this.checkInterestingCall(tx, chainName, rpcUrl);
                return;
            }

            // Contract deployment pending — flag it  
            const value = ethers.formatEther(tx.value);
            const dataSize = (tx.data.length - 2) / 2;

            console.log(chalk.magenta(
                `   ⏳ [${chainName}] Pending deployment from ${tx.from.substring(0, 10)}... ` +
                `(${value} ETH, ${dataSize} bytes)`
            ));

            this.memory.log('info', 'Pending deployment detected', {
                txHash, from: tx.from, value, dataSize, chain: chainName,
            });

            // We can't queue it yet (no address), but we log it
            // The block watcher will pick it up when it lands

        } catch {
            // Pending txs can disappear, that's normal
        }
    }

    /**
     * Check if a pending transaction is an interesting function call
     * that might signal opportunity.
     */
    private async checkInterestingCall(
        tx: ethers.TransactionResponse,
        chainName: string,
        rpcUrl: string,
    ): Promise<void> {
        if (!tx.to || !tx.data || tx.data.length < 10) return;

        const selector = tx.data.substring(0, 10);

        // Known interesting selectors
        const INTERESTING_SELECTORS: Record<string, string> = {
            '0x8129fc1c': 'initialize()',           // Protocol going live
            '0xc4d66de8': 'initialize(address)',    // Protocol going live
            '0xe8e33700': 'addLiquidity()',         // New liquidity
            '0xf305d719': 'addLiquidityETH()',      // New ETH liquidity
            '0x095ea7b3': 'approve(address,uint256)', // Big approval
        };

        const funcName = INTERESTING_SELECTORS[selector];
        if (!funcName) return;

        // For approve, only care about large amounts
        if (selector === '0x095ea7b3') {
            const value = BigInt('0x' + tx.data.substring(74, 138));
            // MaxUint256 approval or very large
            if (value < BigInt('1000000000000000000000')) return; // < 1000 tokens
        }

        // This contract just got interesting — check if we should queue it
        if (!this.memory.hasContract(tx.to, chainName) && !this.queue.has(tx.to, chainName)) {
            const priority = calculatePriority({
                balance: ethers.formatEther(tx.value),
                hasSource: false,
                bytecodeSize: 1000, // Estimate
                isNew: false,
                knownVulnPatterns: this.memory.getSuccessfulCategories(),
            });

            // Boost priority for interesting calls
            const boostedPriority = Math.min(priority + 20, 100);

            const target: QueueTarget = {
                address: tx.to,
                chain: chainName,
                rpcUrl,
                balance: ethers.formatEther(tx.value),
                priority: boostedPriority,
                addedAt: new Date().toISOString(),
                origin: 'mempool',
                metadata: { triggeredBy: funcName, txHash: tx.hash },
            };

            if (this.queue.add(target)) {
                console.log(chalk.magenta(
                    `   💡 [${chainName}] Interesting call: ${funcName} on ${tx.to.substring(0, 12)}...`
                ));
            }
        }
    }
}
