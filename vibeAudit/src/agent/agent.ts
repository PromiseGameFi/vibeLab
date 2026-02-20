/**
 * Autonomous Security Intelligence Agent — The main loop
 * Discovers, gathers intel, analyzes, simulates, and learns.
 */

import chalk from 'chalk';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { AgentMemory } from './memory';
import { TargetQueue, QueueTarget } from './queue';
import { BlockWatcher, DEFAULT_CHAINS, ChainConfig } from './watcher';
import { MempoolMonitor } from './mempool';
import { triageTarget, TriageResult } from './triage';
import { Notifier } from './notify';
import { startDashboard, AgentStatus } from './dashboard';
import { checkFoundryInstalled } from '../utils';
import { ReActEngine } from './react/loop';

dotenv.config();

// ─── Agent Configuration ────────────────────────────────────────────

export interface AgentConfig {
    chains: ChainConfig[];          // Which chains to watch
    pollInterval: number;           // Block poll interval (ms)
    loopInterval: number;           // Main loop sleep (ms)
    maxExploitsPerTarget: number;   // Max exploits per contract
    maxRetries: number;             // Self-healing retry attempts
    dashboardPort: number;          // Dashboard web server port
    enableMempool: boolean;         // Watch the mempool?
    enableDashboard: boolean;       // Start dashboard?
    skipExecution: boolean;         // Skip Foundry execution?
}

const DEFAULT_CONFIG: AgentConfig = {
    chains: DEFAULT_CHAINS,
    pollInterval: parseInt(process.env.POLL_INTERVAL || '12000'),
    loopInterval: parseInt(process.env.LOOP_INTERVAL || '5000'),
    maxExploitsPerTarget: parseInt(process.env.MAX_EXPLOITS || '10'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    dashboardPort: parseInt(process.env.DASHBOARD_PORT || '4040'),
    enableMempool: process.env.ENABLE_MEMPOOL === 'true',
    enableDashboard: process.env.ENABLE_DASHBOARD !== 'false',
    skipExecution: !checkFoundryInstalled(),
};

// ─── Agent Class ────────────────────────────────────────────────────

export class VibeAuditAgent {
    private memory: AgentMemory;
    private queue: TargetQueue;
    private watcher: BlockWatcher;
    private mempool: MempoolMonitor;
    private notifier: Notifier;
    private config: AgentConfig;

    private running: boolean = false;
    private startTime: number = 0;
    private currentTarget: string | null = null;
    private targetsProcessed: number = 0;
    private confirmedVulns: number = 0;

    constructor(config?: Partial<AgentConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.memory = new AgentMemory();
        this.queue = new TargetQueue(500);
        this.notifier = new Notifier(this.memory);
        this.watcher = new BlockWatcher(
            this.config.chains,
            this.queue,
            this.memory,
            this.config.pollInterval,
        );
        this.mempool = new MempoolMonitor(this.queue, this.memory);
    }

    /**
     * Start the autonomous agent.
     */
    async start(): Promise<void> {
        this.running = true;
        this.startTime = Date.now();

        console.log(chalk.cyan(`
╔══════════════════════════════════════════════════╗
║     🛡️  VibeAudit Security Analysis Agent  🛡️     ║
╚══════════════════════════════════════════════════╝
        `));

        this.memory.log('info', 'Agent started', {
            chains: this.config.chains.map(c => c.name),
            foundryInstalled: !this.config.skipExecution,
        });

        // 1. Start block watchers
        console.log(chalk.cyan('\n📡 Starting chain watchers...'));
        await this.watcher.start();

        // 2. Start mempool monitor (if enabled + has WebSocket)
        if (this.config.enableMempool) {
            const wsChain = this.config.chains.find(c => c.wsUrl);
            if (wsChain?.wsUrl) {
                console.log(chalk.cyan('\n⏳ Starting mempool monitor...'));
                await this.mempool.start(wsChain.wsUrl, wsChain.name, wsChain.rpcUrl);
            }
        }

        // 3. Start dashboard
        if (this.config.enableDashboard) {
            console.log(chalk.cyan('\n📊 Starting dashboard...'));
            startDashboard({
                memory: this.memory,
                queue: this.queue,
                watcher: this.watcher,
                notifier: this.notifier,
                getAgentStatus: () => this.getStatus(),
            }, this.config.dashboardPort);
        }

        // 4. Notify start
        if (this.notifier.isConfigured()) {
            await this.notifier.alertStatus(
                `🟢 Agent started\nChains: ${this.config.chains.map(c => c.name).join(', ')}\n` +
                `Foundry: ${this.config.skipExecution ? '❌' : '✅'}`
            );
        }

        // 5. Foundry info
        if (!checkFoundryInstalled()) {
            console.log(chalk.yellow('\n⚠️  Foundry not installed — some analysis features may be limited.'));
        }

        console.log(chalk.green('\n✅ Agent is running. Waiting for targets...\n'));

        // 6. Start main loop
        await this.mainLoop();
    }

    /**
     * Stop the agent gracefully.
     */
    async stop(): Promise<void> {
        console.log(chalk.yellow('\n⏹️  Stopping agent...'));
        this.running = false;
        this.watcher.stop();
        this.mempool.stop();

        const stats = this.memory.getStats();
        this.memory.log('info', 'Agent stopped', {
            targetsProcessed: this.targetsProcessed,
            confirmedVulns: this.confirmedVulns,
            uptime: Date.now() - this.startTime,
        });

        if (this.notifier.isConfigured()) {
            await this.notifier.alertStatus(
                `🔴 Agent stopped\nTargets: ${this.targetsProcessed}\n` +
                `Confirmed Vulns: ${this.confirmedVulns}\n` +
                `Uptime: ${this.formatUptime()}`
            );
        }


        this.memory.close();
        console.log(chalk.green('Agent stopped.'));
    }

    /**
     * Manually add a target to the queue.
     */
    addTarget(address: string, chain: string, rpcUrl: string): void {
        const target: QueueTarget = {
            address,
            chain,
            rpcUrl,
            balance: '0',
            priority: 80, // Manual targets get high priority
            addedAt: new Date().toISOString(),
            origin: 'manual',
        };
        this.queue.add(target);
        console.log(chalk.cyan(`   ➕ Manually queued: ${address} on ${chain}`));
    }

    // ─── Main Loop ──────────────────────────────────────────────

    private async mainLoop(): Promise<void> {
        while (this.running) {
            if (this.queue.isEmpty()) {
                await sleep(this.config.loopInterval);
                continue;
            }

            const target = this.queue.next();
            if (!target) continue;

            try {
                // Triage
                console.log(chalk.blue(`\n🔎 Triaging: ${target.address} [${target.chain}]`));
                this.memory.updateContractStatus(target.address, target.chain, 'triaged');

                const triageResult = await triageTarget(target, this.memory);

                if (!triageResult.shouldAttack) {
                    console.log(chalk.gray(`   ⏭️  Skipped: ${triageResult.reason}`));
                    this.memory.updateContractStatus(target.address, target.chain, 'skipped');
                    continue;
                }

                console.log(chalk.yellow(
                    `   ✓ Triage passed (priority: ${triageResult.adjustedPriority}, ` +
                    `source: ${triageResult.hasSource ? 'YES' : 'NO'})`
                ));

                // Analyze
                this.currentTarget = target.address;
                this.memory.updateContractStatus(target.address, target.chain, 'analyzing');

                await this.analyzeTarget(target, triageResult);
                this.targetsProcessed++;

                this.currentTarget = null;

            } catch (error) {
                console.error(chalk.red(`   ✗ Error: ${(error as Error).message}`));
                this.memory.log('error', `Analysis failed for ${target.address}`, {
                    error: (error as Error).message,
                });
                this.currentTarget = null;
            }

            // Pacing
            await sleep(this.config.loopInterval);
        }
    }

    // ─── Full Analysis Pipeline ────────────────────────────────

    private async analyzeTarget(
        target: QueueTarget,
        triageResult: TriageResult,
    ): Promise<void> {

        console.log(chalk.cyan(`   🤖 Starting ReAct Intelligence Engine...`));
        const runId = `agent_${target.chain}_${target.address}_${Date.now()}`;
        const reactEngine = new ReActEngine(runId);

        // Stream thoughts to UI (memory system can also pick this up if needed)
        reactEngine.onThought = (thought) => {
            // In the future: emit SSE to dashboard here
        };

        const result = await reactEngine.run(target.address, target.chain);

        let riskScore = 0;
        let isConfirmed = 0;

        if (result.status === 'exploited') {
            riskScore = 100;
            isConfirmed = 1;
            console.log(chalk.red(`\n   💀 EXPLOIT CONFIRMED:\n${result.details}`));
        } else if (result.status === 'secure') {
            riskScore = 10;
            console.log(chalk.green(`\n   🛡️ TARGET SECURE:\n${result.details}`));
        } else {
            riskScore = 50;
            console.log(chalk.yellow(`\n   ⏱️ RUN ENDED (${result.status}):\n${result.details}`));
        }

        // Store results in Agent Memory
        this.memory.updateContractResults(
            target.address, target.chain,
            riskScore, isConfirmed
        );

        this.memory.addReport(
            target.address,
            target.chain,
            `Target ${target.address.substring(0, 8)}`,
            riskScore,
            JSON.stringify({ reactStatus: result.status, details: result.details }),
            `# ReAct Security Report\n\n**Status:** ${result.status}\n\n**Details:**\n${result.details}`
        );

        this.memory.log('info', `ReAct Analysis complete for ${target.address}`, {
            status: result.status,
            riskScore: riskScore,
        });

        if (isConfirmed && this.notifier.isConfigured()) {
            this.confirmedVulns++;
            await this.notifier.alertStatus(
                `🛡️ HIGH-RISK CONTRACT EXPLOITED\n\n` +
                `Chain: ${target.chain}\n` +
                `Address: ${target.address}\n\n` +
                `Details:\n${result.details}`
            );
        }
    }

    // ─── Status ─────────────────────────────────────────────────

    getStatus(): AgentStatus {
        return {
            running: this.running,
            uptime: Date.now() - this.startTime,
            currentTarget: this.currentTarget || undefined,
            targetsProcessed: this.targetsProcessed,
            confirmedExploits: this.confirmedVulns,
        };
    }

    private formatUptime(): string {
        const ms = Date.now() - this.startTime;
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        return `${h}h ${m % 60}m`;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
