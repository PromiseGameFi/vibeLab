import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { scanDirectory } from './scanner';
import { analyzeForExploits } from './auditor';
import { fetchContract } from './onchain';
import { runAllExploits } from './exploit-runner';
import { scanForMev } from './mev-scanner';
import { generateAttackReport, generateMevReport } from './reporter';
import { requireFoundry, getDefaultRpc, checkFoundryInstalled } from './utils';
import { evmbenchDetect, evmbenchAttack, saveEVMbenchReport, EVMbenchReport } from './evmbench';
import { runPipeline, generatePipelineReport } from './pipeline/index';
import { VibeAuditAgent } from './agent/agent';
import { DEFAULT_CHAINS } from './agent/watcher';
import { gatherIntel, getAnalyzableCode } from './agent/intel-gatherer';
import { extractFindings, simulateExploits } from './agent/exploit-simulator';
import { LearningEngine } from './agent/learning';
import { analyzeContractDeep } from './agent/analyzers/contract-deep';
import { analyzeProcessFlow } from './agent/analyzers/process-flow';
import { analyzeFrontendInteraction } from './agent/analyzers/frontend-interaction';
import { analyzeBridgeSecurity } from './agent/analyzers/bridge-security';
import { generateSecurityReport, saveReport } from './agent/analyzers/report-generator';
import { startTestingUI } from './ui/testing-server';

dotenv.config();

const program = new Command();

program
    .name('vibeAudit')
    .description('🏴‍☠️ Offensive Smart Contract Attack Tool')
    .version('1.0.0');

// ─── Command: attack ────────────────────────────────────────────────
// Paste an on-chain address → fetch source → AI generates exploits → run via Foundry

program
    .command('attack')
    .description('Attack a deployed contract by address (full 6-stage pipeline)')
    .requiredOption('-a, --address <address>', 'Target contract address (0x...)')
    .option('-r, --rpc <url>', 'RPC URL', getDefaultRpc())
    .option('--no-run', 'Skip running Foundry tests (just generate exploits)')
    .option('--retries <n>', 'Self-healing retry attempts per exploit', '3')
    .option('--max-exploits <n>', 'Max exploits to generate', '10')
    .option('--simple', 'Use simple single-pass mode instead of pipeline')
    .action(async (opts) => {
        console.log(chalk.red('\n\ud83c\udff4\u200d\u2620\ufe0f VibeAudit \u2014 On-Chain Attack Mode'));
        console.log(chalk.red('\u2501'.repeat(50)));

        if (opts.run !== false) requireFoundry();

        try {
            // Step 1: Fetch contract from chain
            const contract = await fetchContract(opts.address, opts.rpc);
            const codeToAnalyze = contract.source || `// Bytecode-only contract at ${contract.address}\n// Size: ${(contract.bytecode.length - 2) / 2} bytes\n// Balance: ${contract.balance} ETH\n// Bytecode: ${contract.bytecode.substring(0, 500)}...`;
            const targetName = contract.name || 'UnknownContract';

            if (opts.simple) {
                // ─── Simple mode (old behavior) ─────────────────
                console.log(chalk.cyan(`\n\ud83e\udde0 AI analyzing ${targetName} (simple mode)...`));
                const findings = await analyzeForExploits(codeToAnalyze, targetName, {
                    address: contract.address,
                    balance: contract.balance,
                });
                console.log(chalk.yellow(`\n\ud83d\udccb Found ${findings.length} potential exploit(s).`));

                let exploitResults;
                if (opts.run !== false && findings.length > 0) {
                    exploitResults = await runAllExploits(
                        findings.filter(f => f.exploit_test_code?.length > 10).map(f => ({
                            code: f.exploit_test_code, name: f.title, rpcUrl: opts.rpc,
                            targetSourceCode: contract.source || undefined,
                            targetSourceName: `${targetName}.sol`,
                        }))
                    );
                }

                const reportPath = await generateAttackReport([{
                    target: `${targetName} (${contract.address})`, findings, exploitResults,
                }]);
                printSummary(findings, exploitResults);
                console.log(chalk.green(`\n\ud83d\udcc4 Full report: ${reportPath}`));
            } else {
                // ─── Full pipeline mode ─────────────────────────
                const result = await runPipeline(codeToAnalyze, `${targetName}.sol`, `${targetName}.sol`, {
                    rpcUrl: opts.rpc,
                    skipExecution: opts.run === false,
                    maxRetries: parseInt(opts.retries),
                    maxExploits: parseInt(opts.maxExploits),
                    onChainContext: { address: contract.address, balance: contract.balance },
                });
                const reportPath = await generatePipelineReport([result]);
                console.log(chalk.green(`\ud83d\udcc4 Full report: ${reportPath}`));
            }

        } catch (error) {
            console.error(chalk.red('\u274c Attack failed:'), (error as Error).message);
            process.exit(1);
        }
    });

// ─── Command: exploit ───────────────────────────────────────────────
// Point at a .sol file → AI generates Foundry exploit tests → runs them automatically

program
    .command('exploit')
    .description('Generate and run exploits against a local .sol file or directory (full 6-stage pipeline)')
    .argument('<path>', 'Path to a .sol file or directory')
    .option('-r, --rpc <url>', 'RPC URL for fork tests (use "none" for no fork)', getDefaultRpc())
    .option('--no-run', 'Skip running Foundry tests (just generate exploits)')
    .option('--retries <n>', 'Self-healing retry attempts per exploit', '3')
    .option('--max-exploits <n>', 'Max exploits to generate per contract', '10')
    .option('--simple', 'Use simple single-pass mode instead of pipeline')
    .action(async (targetPath, opts) => {
        console.log(chalk.red('\n\ud83c\udff4\u200d\u2620\ufe0f VibeAudit \u2014 Local Exploit Mode'));
        console.log(chalk.red('\u2501'.repeat(50)));

        if (opts.run !== false) requireFoundry();

        try {
            const files = await scanDirectory(targetPath);
            if (files.length === 0) {
                console.log(chalk.yellow('\u26a0\ufe0f  No .sol files found.'));
                return;
            }

            console.log(chalk.cyan(`Found ${files.length} contract(s).`));

            if (opts.simple) {
                // ─── Simple mode (old behavior) ─────────────────
                const reportData = [];
                for (const file of files) {
                    console.log(chalk.blue(`\n\u2501\u2501\u2501 Targeting: ${file.name} \u2501\u2501\u2501`));
                    const findings = await analyzeForExploits(file.content, file.name);
                    console.log(chalk.yellow(`   Found ${findings.length} potential exploit(s).`));

                    let exploitResults;
                    if (opts.run !== false && findings.length > 0) {
                        exploitResults = await runAllExploits(
                            findings.filter(f => f.exploit_test_code?.length > 10).map(f => ({
                                code: f.exploit_test_code, name: f.title, rpcUrl: opts.rpc,
                                targetSourcePath: file.path,
                            }))
                        );
                    }
                    reportData.push({ target: file.name, findings, exploitResults });
                }
                const reportPath = await generateAttackReport(reportData);
                for (const entry of reportData) printSummary(entry.findings, entry.exploitResults);
                console.log(chalk.green(`\n\ud83d\udcc4 Full report: ${reportPath}`));
            } else {
                // ─── Full pipeline mode ─────────────────────────
                const pipelineResults = [];
                for (const file of files) {
                    const result = await runPipeline(file.content, file.name, file.path, {
                        rpcUrl: opts.rpc,
                        skipExecution: opts.run === false,
                        maxRetries: parseInt(opts.retries),
                        maxExploits: parseInt(opts.maxExploits),
                    });
                    pipelineResults.push(result);
                }
                const reportPath = await generatePipelineReport(pipelineResults);
                console.log(chalk.green(`\ud83d\udcc4 Full report: ${reportPath}`));
            }

        } catch (error) {
            console.error(chalk.red('\u274c Exploit failed:'), (error as Error).message);
            process.exit(1);
        }
    });

// ─── Command: mev ───────────────────────────────────────────────────
// Scan on-chain for MEV and profitable exploit opportunities

program
    .command('mev')
    .description('Scan on-chain for MEV and profitable exploit opportunities')
    .option('-r, --rpc <url>', 'RPC URL', getDefaultRpc())
    .option('-b, --blocks <count>', 'Number of recent blocks to scan', '50')
    .option('--min-balance <eth>', 'Minimum contract balance in ETH', '0')
    .action(async (opts) => {
        console.log(chalk.red('\n🏴‍☠️ VibeAudit — MEV Scanner'));
        console.log(chalk.red('━'.repeat(50)));

        try {
            const results = await scanForMev(
                opts.rpc,
                parseInt(opts.blocks),
                parseFloat(opts.minBalance),
            );

            if (results.length === 0) {
                console.log(chalk.yellow('\n⚠️  No MEV opportunities found.'));
                return;
            }

            const reportPath = await generateMevReport(results);

            let totalOpps = 0;
            for (const r of results) totalOpps += r.opportunities.length;

            console.log(chalk.green(`\n💰 Found ${totalOpps} MEV opportunities across ${results.length} contracts.`));
            console.log(chalk.green(`📄 Full report: ${reportPath}`));

        } catch (error) {
            console.error(chalk.red('❌ MEV scan failed:'), (error as Error).message);
            process.exit(1);
        }
    });

// ─── Command: evmbench ──────────────────────────────────────────────
// EVMbench-compatible vulnerability detection (Paradigm/OpenAI format)

program
    .command('evmbench')
    .description('Run EVMbench-compatible vulnerability scan (Paradigm/OpenAI format)')
    .argument('<path>', 'Path to a .sol file or directory')
    .option('-m, --mode <mode>', 'Analysis mode: detect (standard) or attack (offensive with PoCs)', 'attack')
    .option('-a, --address <address>', 'Optional: on-chain contract address for context')
    .option('-r, --rpc <url>', 'RPC URL for on-chain context', getDefaultRpc())
    .option('--run-exploits', 'Auto-run exploit PoCs via Foundry (attack mode only)')
    .action(async (targetPath, opts) => {
        console.log(chalk.magenta('\n🏴‍☠️ VibeAudit × EVMbench'));
        console.log(chalk.magenta('━'.repeat(50)));
        console.log(chalk.gray(`Mode: ${opts.mode} | Format: EVMbench-compatible JSON\n`));

        if (opts.runExploits) requireFoundry();

        try {
            const files = await scanDirectory(targetPath);
            if (files.length === 0) {
                console.log(chalk.yellow('⚠️  No .sol files found.'));
                return;
            }

            console.log(chalk.cyan(`Found ${files.length} contract(s). Analyzing with EVMbench ${opts.mode} mode...`));

            // Collect all vulnerabilities across all files
            const allVulns: EVMbenchReport = { vulnerabilities: [] };

            // Optionally fetch on-chain context
            let context: { address?: string; balance?: string } | undefined;
            if (opts.address) {
                try {
                    const contract = await fetchContract(opts.address, opts.rpc);
                    context = { address: contract.address, balance: contract.balance };
                } catch (e) {
                    console.log(chalk.yellow(`⚠️  Could not fetch on-chain context: ${(e as Error).message}`));
                }
            }

            for (const file of files) {
                console.log(chalk.blue(`\n━━━ Scanning: ${file.name} ━━━`));

                const analyze = opts.mode === 'detect' ? evmbenchDetect : evmbenchAttack;
                const report = await analyze(file.content, file.name, context);

                console.log(chalk.yellow(`   Found ${report.vulnerabilities.length} high-severity vulnerability(s).`));
                allVulns.vulnerabilities.push(...report.vulnerabilities);

                // Optionally run exploit PoCs via Foundry
                if (opts.runExploits && opts.mode === 'attack') {
                    const exploitsToRun = report.vulnerabilities
                        .filter(v => v.proof_of_concept && v.proof_of_concept.length > 20)
                        .map(v => ({
                            code: v.proof_of_concept,
                            name: v.title,
                            rpcUrl: opts.rpc,
                            targetSourcePath: file.path,
                        }));

                    if (exploitsToRun.length > 0) {
                        console.log(chalk.cyan(`\n⚔️  Running ${exploitsToRun.length} exploit(s) via Foundry...`));
                        const results = await runAllExploits(exploitsToRun);
                        for (const r of results) {
                            for (const res of r.results) {
                                if (res.passed) {
                                    console.log(chalk.red(`   💀 CONFIRMED: ${r.name}`));
                                } else {
                                    console.log(chalk.gray(`   ❌ ${r.name} — did not pass`));
                                }
                            }
                        }
                    }
                }
            }

            // Save report
            const reportPath = await saveEVMbenchReport(allVulns);

            console.log(chalk.green(`\n━━━ EVMbench RESULTS ━━━`));
            console.log(`   Vulnerabilities: ${allVulns.vulnerabilities.length}`);
            console.log(chalk.green(`📄 Report (JSON + MD): ${reportPath}`));

        } catch (error) {
            console.error(chalk.red('❌ EVMbench scan failed:'), (error as Error).message);
            process.exit(1);
        }
    });

// ─── Legacy: scan (backward compat) ────────────────────────────────

program
    .command('scan')
    .description('(Legacy) Scan a file or directory — redirects to exploit')
    .argument('<path>')
    .action(async (targetPath) => {
        console.log(chalk.yellow('⚠️  "scan" is deprecated. Use "exploit" instead.\n'));
        await program.parseAsync(['node', 'vibeaudit', 'exploit', targetPath]);
    });

// ─── Helpers ────────────────────────────────────────────────────────

function printSummary(
    findings: any[],
    exploitResults?: { name: string; results: { passed: boolean }[] }[]
) {
    const confirmed = exploitResults
        ? exploitResults.reduce((acc, er) => acc + er.results.filter(r => r.passed).length, 0)
        : 0;

    console.log(chalk.red(`\n━━━ RESULTS ━━━`));
    console.log(`   Exploits found:     ${findings.length}`);
    if (exploitResults) {
        console.log(`   Confirmed (PASS):   ${chalk.red(confirmed.toString())}`);
        console.log(`   Unconfirmed (FAIL): ${findings.length - confirmed}`);
    }
}

// ─── Command: agent ─────────────────────────────────────────────────
// Start the autonomous security analysis agent

program
    .command('agent')
    .description('🛡️ Start the autonomous security analysis agent — discovers & analyzes smart contracts')
    .option('--chains <names>', 'Comma-separated chain names (ethereum,bsc,arbitrum,base,somnia)', 'ethereum,bsc,arbitrum,base,somnia')
    .option('--poll <ms>', 'Block poll interval in ms', '12000')
    .option('--loop <ms>', 'Main loop interval in ms', '5000')
    .option('--port <port>', 'Dashboard port', '4040')
    .option('--max-exploits <n>', 'Max exploits per target', '10')
    .option('--retries <n>', 'Self-healing retries', '3')
    .option('--no-dashboard', 'Disable web dashboard')
    .option('--mempool', 'Enable mempool monitoring (requires WebSocket RPC)')
    .option('--no-exec', 'Skip Foundry execution (generate only)')
    .action(async (opts) => {
        const chainNames = opts.chains.split(',').map((c: string) => c.trim().toLowerCase());
        const selectedChains = DEFAULT_CHAINS.filter(c => chainNames.includes(c.name));

        if (selectedChains.length === 0) {
            console.error(chalk.red(`❌ No valid chains: ${opts.chains}`));
            console.error(chalk.yellow(`   Available: ${DEFAULT_CHAINS.map(c => c.name).join(', ')}`));
            process.exit(1);
        }

        const agent = new VibeAuditAgent({
            chains: selectedChains,
            pollInterval: parseInt(opts.poll),
            loopInterval: parseInt(opts.loop),
            dashboardPort: parseInt(opts.port),
            maxExploitsPerTarget: parseInt(opts.maxExploits),
            maxRetries: parseInt(opts.retries),
            enableDashboard: opts.dashboard !== false,
            enableMempool: !!opts.mempool,
            skipExecution: opts.exec === false || !checkFoundryInstalled(),
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await agent.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await agent.stop();
            process.exit(0);
        });

        await agent.start();
    });

// ─── Command: analyze ───────────────────────────────────────────────
// Single-shot: analyze one contract address and print security report

program
    .command('analyze')
    .description('🔍 Analyze a deployed contract — full autonomous security intelligence pipeline')
    .argument('<address>', 'Contract address to analyze (0x...)')
    .option('--rpc <url>', 'RPC endpoint', getDefaultRpc())
    .option('--chain <name>', 'Chain name for context', 'ethereum')
    .option('--output <dir>', 'Output directory for reports', 'reports')
    .option('--no-simulate', 'Skip fork-based exploit simulation')
    .action(async (address: string, opts: any) => {
        console.log(chalk.cyan(`\n🛡️  VibeAudit Security Intelligence Analysis\n`));
        const learning = new LearningEngine();

        // 1. Gather intelligence
        console.log(chalk.cyan(`📡 Step 1: Gathering intelligence on ${address}...`));
        let intel;
        try {
            intel = await gatherIntel(address, opts.chain, opts.rpc);
        } catch (error) {
            console.error(chalk.red(`❌ Intel gathering failed: ${(error as Error).message}`));
            process.exit(1);
        }

        const code = getAnalyzableCode(intel);
        const contractName = intel.contractName;
        const ctx = { address, chain: opts.chain, balance: intel.balance };

        // 2. Run all 4 analyses in parallel
        console.log(chalk.cyan(`\n📊 Step 2: Running 4-layer security analysis on ${contractName}...\n`));

        const [contractAnalysis, processFlow, frontendInteraction, bridgeSecurity] = await Promise.all([
            analyzeContractDeep(code, contractName, ctx)
                .then(r => { console.log(chalk.green('  ✓ Contract deep analysis complete')); return r; })
                .catch(err => { console.log(chalk.red(`  ✗ Contract analysis failed: ${err.message}`)); return null; }),
            analyzeProcessFlow(code, contractName, ctx)
                .then(r => { console.log(chalk.green('  ✓ Process flow analysis complete')); return r; })
                .catch(err => { console.log(chalk.red(`  ✗ Process flow failed: ${err.message}`)); return null; }),
            analyzeFrontendInteraction(code, contractName, ctx)
                .then(r => { console.log(chalk.green('  ✓ Frontend interaction analysis complete')); return r; })
                .catch(err => { console.log(chalk.red(`  ✗ Frontend analysis failed: ${err.message}`)); return null; }),
            analyzeBridgeSecurity(code, contractName, ctx)
                .then(r => { console.log(chalk.green('  ✓ Bridge security analysis complete')); return r; })
                .catch(err => { console.log(chalk.red(`  ✗ Bridge analysis failed: ${err.message}`)); return null; }),
        ]);

        // 3. Extract testable findings
        console.log(chalk.cyan(`\n🧪 Step 3: Extracting vulnerability findings...`));
        const findings = await extractFindings(code, contractName, intel);
        console.log(chalk.gray(`  ${findings.length} findings extracted`));

        // 4. Simulate exploits on fork
        let simReport;
        if (findings.length > 0 && opts.simulate !== false && checkFoundryInstalled()) {
            console.log(chalk.cyan(`\n⚔️  Step 4: Simulating exploits on fork...`));
            simReport = await simulateExploits(intel, findings, opts.rpc);
        } else if (findings.length > 0) {
            console.log(chalk.yellow(`\n⚠ Step 4: Skipped (Foundry not available or --no-simulate)`));
        }

        // 5. Learn from results
        if (simReport) {
            const contractType = intel.tokenInfo?.standard ||
                (intel.isProxy ? 'Proxy' : (contractAnalysis?.contractType || 'Other'));
            for (const sim of simReport.simulations) {
                learning.recordOutcome({
                    category: sim.finding.category,
                    contractType,
                    wasConfirmed: sim.passed,
                    predictedSeverity: sim.finding.severity,
                    contractAddress: address,
                    chain: opts.chain,
                    reason: sim.passed
                        ? 'Exploit simulation succeeded on fork'
                        : (sim.error || 'Exploit simulation failed on fork'),
                    features: {
                        balance_eth: parseFloat(intel.balance) || 0,
                        bytecode_size: intel.bytecodeSize / 10000,
                        has_source: intel.sourceCode ? 1 : 0,
                        is_proxy: intel.isProxy ? 1 : 0,
                    },
                });
            }
        }

        // 6. Generate unified report
        const report = generateSecurityReport(
            address,
            opts.chain,
            contractAnalysis || { contractName, contractType: 'Other', tokenCompliance: { standard: 'none', deviations: [], missingEvents: [], edgeCaseRisks: [] }, upgradeMechanics: { isUpgradeable: false, proxyPattern: 'none', storageRisks: [], initGuards: [], adminControl: 'unknown' }, accessControl: { roles: [], ownershipTransfer: 'none', timelocks: [], unprotectedFunctions: [] }, fundFlow: { entryPoints: [], exitPoints: [], internalTransfers: [], feeStructure: 'unknown', emergencyWithdraw: false }, dependencies: { externalContracts: [], oracleReliance: [], approvalPatterns: [], libraryUsage: [] }, overallRiskScore: 0, summary: 'Analysis incomplete' },
            processFlow || { contractName, states: [], transitions: [], userJourneys: [], orderingRisks: [], timeDependencies: [], economicFlows: [], mermaidDiagram: '', riskScore: 0, summary: 'Analysis incomplete' },
            frontendInteraction || { contractName, abiSurface: { readFunctions: [], writeFunctions: [], adminFunctions: [], totalFunctions: 0, complexityScore: 0 }, approvalChains: [], txOrderingRisks: [], gasCostPatterns: [], phishingVectors: [], eventReliance: [], riskScore: 0, summary: 'Analysis incomplete' },
            bridgeSecurity || { contractName, isBridge: false, bridgeType: 'none', messageVerification: { mechanism: 'N/A', validators: 'N/A', thresholdScheme: 'N/A', replayProtection: false, risks: [] }, lockMintMechanics: { lockFunction: '', mintFunction: '', burnFunction: '', unlockFunction: '', atomicity: 'N/A', drainRisks: [], spoofRisks: [] }, finalityRisks: [], adminKeyRisks: [], liquidityPoolRisks: [], knownExploitPatterns: [], riskScore: 0, summary: 'Not a bridge' },
        );

        // 7. Save and display
        const filepath = saveReport(report, opts.output);

        const riskLabel = report.overallRiskScore >= 80 ? '🔴 CRITICAL' :
            report.overallRiskScore >= 60 ? '🟠 HIGH' :
                report.overallRiskScore >= 40 ? '🟡 MEDIUM' :
                    report.overallRiskScore >= 20 ? '🟢 LOW' : '⚪ MINIMAL';

        console.log(chalk.bold(`\n${riskLabel} — Overall Risk Score: ${report.overallRiskScore}/100`));
        if (simReport) {
            console.log(chalk.gray(`Simulations: ${simReport.confirmedVulnerabilities} confirmed, ${simReport.deniedVulnerabilities} denied`));
        }
        console.log(chalk.gray(`${contractAnalysis?.summary || ''}\n`));

        const lStats = learning.getStats();
        console.log(chalk.gray(`🧠 Learning: ${lStats.totalPredictions} total predictions, ${(lStats.overallAccuracy * 100).toFixed(1)}% accuracy`));
        console.log(chalk.green(`📄 Full report saved: ${filepath}`));
        console.log(chalk.gray(`   JSON: ${filepath.replace('.md', '.json')}\n`));

        learning.close();
    });

// ─── Command: ui ────────────────────────────────────────────────────
// Launch the interactive testing UI

program
    .command('ui')
    .description('🧪 Launch the interactive testing UI (web interface)')
    .option('-p, --port <number>', 'Port to serve on', '4041')
    .action(async (opts: any) => {
        console.log(chalk.cyan('\n🛡️  VibeAudit — Starting Testing UI...'));
        startTestingUI(parseInt(opts.port));
    });

program.parse();
