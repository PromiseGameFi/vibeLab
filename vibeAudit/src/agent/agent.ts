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
import { gatherIntel, getAnalyzableCode, ContractIntel } from './intel-gatherer';
import { simulateExploits, extractFindings, VulnerabilityFinding, SimulationReport } from './exploit-simulator';
import { LearningEngine } from './learning';
import { analyzeContractDeep } from './analyzers/contract-deep';
import { analyzeProcessFlow } from './analyzers/process-flow';
import { analyzeFrontendInteraction } from './analyzers/frontend-interaction';
import { analyzeBridgeSecurity } from './analyzers/bridge-security';
import { generateSecurityReport, saveReport, SecurityReport } from './analyzers/report-generator';

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
    private learning: LearningEngine;
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
        this.learning = new LearningEngine();
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
        const learningStats = this.learning.getStats();
        this.memory.log('info', 'Agent stopped', {
            targetsProcessed: this.targetsProcessed,
            confirmedVulns: this.confirmedVulns,
            learningAccuracy: learningStats.overallAccuracy,
            uptime: Date.now() - this.startTime,
        });

        if (this.notifier.isConfigured()) {
            await this.notifier.alertStatus(
                `🔴 Agent stopped\nTargets: ${this.targetsProcessed}\n` +
                `Confirmed Vulns: ${this.confirmedVulns}\n` +
                `Learning Accuracy: ${(learningStats.overallAccuracy * 100).toFixed(1)}%\n` +
                `Uptime: ${this.formatUptime()}`
            );
        }

        this.learning.close();
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

                const report = await this.analyzeTarget(target, triageResult);

                // Store results
                if (report) {
                    this.targetsProcessed++;
                    this.storeReport(target, report.securityReport);

                    // Notify on high-risk findings
                    if (report.securityReport.overallRiskScore >= 60) {
                        this.confirmedVulns += report.simulationReport?.confirmedVulnerabilities || 0;
                        await this.notifyHighRisk(target, report.securityReport, report.simulationReport);
                    }
                }

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
    ): Promise<{ securityReport: SecurityReport; simulationReport?: SimulationReport } | null> {

        // ─── Step 1: Gather Intelligence ────────────────────────
        console.log(chalk.cyan(`   🔍 Step 1: Gathering intelligence...`));
        let intel: ContractIntel;
        try {
            intel = await gatherIntel(target.address, target.chain, target.rpcUrl);
        } catch (error) {
            console.log(chalk.red(`   ✗ Intel gathering failed: ${(error as Error).message}`));
            return null;
        }

        // Check cross-contract learning for known bytecode
        const bytecodeHash = crypto.createHash('sha256').update(intel.bytecode).digest('hex');
        const knownPatterns = this.learning.checkBytecodeMatch(bytecodeHash);
        if (knownPatterns.length > 0) {
            console.log(chalk.yellow(`   ⚡ Known vulnerable bytecode! Previously found: ${knownPatterns.map(p => p.category).join(', ')}`));
        }

        const code = getAnalyzableCode(intel);
        const contractName = intel.contractName;
        const ctx = { address: target.address, balance: intel.balance, chain: target.chain };

        // ─── Step 2: Run 4 Analysis Modules ─────────────────────
        console.log(chalk.cyan(`   📊 Step 2: Running deep analysis on ${contractName}...`));

        // Get calibration context from learning DB to improve AI accuracy
        const calCtx = this.learning.getCalibrationContext('reentrancy') +
            this.learning.getCalibrationContext('access-control') +
            this.learning.getCalibrationContext('integer-overflow');

        const [contractAnalysis, processFlow, frontendInteraction, bridgeSecurity] = await Promise.all([
            analyzeContractDeep(code, contractName, ctx).catch(err => {
                console.log(chalk.yellow(`   ⚠ Contract deep analysis failed: ${err.message}`));
                return null;
            }),
            analyzeProcessFlow(code, contractName, ctx).catch(err => {
                console.log(chalk.yellow(`   ⚠ Process flow analysis failed: ${err.message}`));
                return null;
            }),
            analyzeFrontendInteraction(code, contractName, ctx).catch(err => {
                console.log(chalk.yellow(`   ⚠ Frontend interaction analysis failed: ${err.message}`));
                return null;
            }),
            analyzeBridgeSecurity(code, contractName, ctx).catch(err => {
                console.log(chalk.yellow(`   ⚠ Bridge security analysis failed: ${err.message}`));
                return null;
            }),
        ]);

        // ─── Step 3: Extract Testable Findings ──────────────────
        console.log(chalk.cyan(`   🧪 Step 3: Extracting vulnerability findings...`));
        const findings = await extractFindings(code, contractName, intel);
        console.log(chalk.gray(`     ${findings.length} findings extracted`));

        // ─── Step 4: Simulate Exploits on Fork ──────────────────
        let simulationReport: SimulationReport | undefined;
        if (findings.length > 0 && !this.config.skipExecution) {
            console.log(chalk.cyan(`   ⚔️  Step 4: Simulating exploits on fork...`));
            simulationReport = await simulateExploits(intel, findings, target.rpcUrl);
        } else if (findings.length > 0) {
            console.log(chalk.yellow(`   ⚠ Step 4: Skipped (Foundry not available)`));
        }

        // ─── Step 5: Learn from Results ──────────────────────────
        console.log(chalk.cyan(`   🧠 Step 5: Recording learning...`));

        // Determine contract type for pattern learning
        const contractType = intel.tokenInfo?.standard ||
            (intel.isProxy ? 'Proxy' : (contractAnalysis?.contractType || 'Other'));

        const triageFeatures: Record<string, number> = {
            balance_eth: parseFloat(intel.balance) || 0,
            bytecode_size: intel.bytecodeSize / 10000,
            has_source: intel.sourceCode ? 1 : 0,
            is_proxy: intel.isProxy ? 1 : 0,
            is_token: intel.tokenInfo ? 1 : 0,
            tx_count: Math.min((intel.totalTxCount || 0) / 100, 1),
            unique_callers: Math.min(intel.topCallers.length / 10, 1),
            has_owner: intel.owner ? 1 : 0,
        };

        if (simulationReport) {
            for (const sim of simulationReport.simulations) {
                this.learning.recordOutcome({
                    category: sim.finding.category,
                    contractType,
                    wasConfirmed: sim.passed,
                    predictedSeverity: sim.finding.severity,
                    contractAddress: target.address,
                    chain: target.chain,
                    reason: sim.passed
                        ? 'Exploit simulation succeeded on fork'
                        : (sim.error || 'Exploit simulation failed on fork'),
                    features: triageFeatures,
                });
            }

            // Record bytecode pattern if vulnerabilities were confirmed
            if (simulationReport.confirmedVulnerabilities > 0) {
                const confirmedCategories = simulationReport.simulations
                    .filter(s => s.passed)
                    .map(s => s.finding.category);

                this.learning.recordBytecodePattern(
                    bytecodeHash,
                    intel.bytecode.substring(0, 100), // First 100 chars as pattern
                    target.address,
                    target.chain,
                    confirmedCategories,
                    contractAnalysis?.overallRiskScore || 0,
                );
            }
        }

        // ─── Step 6: Generate Report ────────────────────────────
        const securityReport = generateSecurityReport(
            target.address,
            target.chain,
            contractAnalysis || { contractName, contractType: 'Other', tokenCompliance: { standard: 'none', deviations: [], missingEvents: [], edgeCaseRisks: [] }, upgradeMechanics: { isUpgradeable: false, proxyPattern: 'none', storageRisks: [], initGuards: [], adminControl: 'unknown' }, accessControl: { roles: [], ownershipTransfer: 'none', timelocks: [], unprotectedFunctions: [] }, fundFlow: { entryPoints: [], exitPoints: [], internalTransfers: [], feeStructure: 'unknown', emergencyWithdraw: false }, dependencies: { externalContracts: [], oracleReliance: [], approvalPatterns: [], libraryUsage: [] }, overallRiskScore: 0, summary: 'Analysis incomplete' },
            processFlow || { contractName, states: [], transitions: [], userJourneys: [], orderingRisks: [], timeDependencies: [], economicFlows: [], mermaidDiagram: '', riskScore: 0, summary: 'Analysis incomplete' },
            frontendInteraction || { contractName, abiSurface: { readFunctions: [], writeFunctions: [], adminFunctions: [], totalFunctions: 0, complexityScore: 0 }, approvalChains: [], txOrderingRisks: [], gasCostPatterns: [], phishingVectors: [], eventReliance: [], riskScore: 0, summary: 'Analysis incomplete' },
            bridgeSecurity || { contractName, isBridge: false, bridgeType: 'none', messageVerification: { mechanism: 'N/A', validators: 'N/A', thresholdScheme: 'N/A', replayProtection: false, risks: [] }, lockMintMechanics: { lockFunction: '', mintFunction: '', burnFunction: '', unlockFunction: '', atomicity: 'N/A', drainRisks: [], spoofRisks: [] }, finalityRisks: [], adminKeyRisks: [], liquidityPoolRisks: [], knownExploitPatterns: [], riskScore: 0, summary: 'Not a bridge' },
        );

        // Print summary
        const riskLabel = securityReport.overallRiskScore >= 80 ? '🔴 CRITICAL' :
            securityReport.overallRiskScore >= 60 ? '🟠 HIGH' :
                securityReport.overallRiskScore >= 40 ? '🟡 MEDIUM' :
                    securityReport.overallRiskScore >= 20 ? '🟢 LOW' : '⚪ MINIMAL';

        console.log(chalk.bold(`\n   ${riskLabel} — Risk Score: ${securityReport.overallRiskScore}/100`));
        if (simulationReport) {
            console.log(chalk.gray(`   Simulations: ${simulationReport.confirmedVulnerabilities} confirmed, ${simulationReport.deniedVulnerabilities} denied`));
        }
        console.log(chalk.gray(`   ${contractAnalysis?.summary || 'Analysis complete'}`));

        // Save to file
        const filepath = saveReport(securityReport);
        console.log(chalk.green(`   📄 Report saved: ${filepath}`));

        // Log learning stats
        const lStats = this.learning.getStats();
        console.log(chalk.gray(`   🧠 Learning: ${lStats.totalPredictions} predictions, ${(lStats.overallAccuracy * 100).toFixed(1)}% accuracy`));

        return { securityReport, simulationReport };
    }

    // ─── Results Storage ────────────────────────────────────────

    private storeReport(target: QueueTarget, report: SecurityReport): void {
        this.memory.updateContractResults(
            target.address, target.chain,
            report.overallRiskScore, report.overallRiskScore >= 60 ? 1 : 0,
        );

        this.memory.addReport(
            target.address,
            target.chain,
            report.contractName,
            report.overallRiskScore,
            JSON.stringify({
                contractAnalysis: report.contractAnalysis,
                processFlow: report.processFlow,
                frontendInteraction: report.frontendInteraction,
                bridgeSecurity: report.bridgeSecurity,
            }),
            report.markdown,
        );

        this.memory.log('info', `Analysis complete for ${target.address}`, {
            riskScore: report.overallRiskScore,
            contractType: report.contractAnalysis.contractType,
            isBridge: report.bridgeSecurity.isBridge,
        });
    }

    // ─── Notifications ──────────────────────────────────────────

    private async notifyHighRisk(
        target: QueueTarget,
        report: SecurityReport,
        simReport?: SimulationReport,
    ): Promise<void> {
        if (this.notifier.isConfigured()) {
            const simLine = simReport
                ? `Confirmed Vulns: ${simReport.confirmedVulnerabilities}\n`
                : '';

            await this.notifier.alertStatus(
                `🛡️ HIGH-RISK CONTRACT FOUND\n\n` +
                `Chain: ${target.chain}\n` +
                `Address: ${target.address}\n` +
                `Name: ${report.contractName}\n` +
                `Type: ${report.contractAnalysis.contractType}\n` +
                `Risk Score: ${report.overallRiskScore}/100\n` +
                simLine +
                `Bridge: ${report.bridgeSecurity.isBridge ? 'YES' : 'No'}\n\n` +
                `${report.contractAnalysis.summary}`
            );
        }

        this.memory.log('warn', `HIGH RISK: ${report.contractName} (${report.overallRiskScore}/100)`, {
            address: target.address,
            chain: target.chain,
            riskScore: report.overallRiskScore,
            confirmedVulns: simReport?.confirmedVulnerabilities || 0,
        });
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
