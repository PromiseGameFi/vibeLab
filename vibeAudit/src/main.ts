import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import { checkFoundryInstalled, getDefaultRpc } from './utils';
import { VibeAuditAgent } from './agent/agent';
import { DEFAULT_CHAINS } from './agent/watcher';
import { gatherIntel } from './agent/intel-gatherer';
import { startTestingUI } from './ui/testing-server';
import { ReActEngine } from './agent/react/loop';
import { AttackStrategist } from './agent/react/strategist';
import { approvalService } from './agent/approval';
import { createEngagement } from './agent/engagement';

dotenv.config();

const program = new Command();

program
    .name('vibeAudit')
    .description('Authorized defensive autonomous smart contract security platform')
    .version('2.0.0');

async function runAnalyze(target: string, opts: any): Promise<void> {
    const chain = (opts.chain || 'ethereum').toLowerCase();
    const rpcUrl = opts.rpc || getDefaultRpc();
    const mode = (opts.mode || 'validate') as 'recon' | 'validate' | 'exploit';
    const targetExistsLocally = fs.existsSync(target);
    const isProject = !!opts.project || targetExistsLocally || target.includes('github.com');
    const runId = `cli_${chain}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    createEngagement({
        runId,
        target,
        targetType: isProject ? 'project' : 'contract',
        chain,
        rpcUrl,
        mode,
        approvalRequired: true,
        project: isProject ? { path: target } : undefined,
    });

    if (opts.approve) {
        const grant = approvalService.grantApproval({
            runId,
            scopes: ['all'],
            approvedBy: 'cli-operator',
        });
        console.log(chalk.yellow(`🔐 Execution approved for run ${runId}. Token: ${grant.token}`));
    } else {
        console.log(chalk.yellow(`🔐 Run ${runId} starts without execution approval.`));
        console.log(chalk.gray('    Use --approve to allow exploit/fuzz execution in defensive mode.'));
    }

    console.log(chalk.cyan(`\n🎯 Target: ${target}`));
    console.log(chalk.cyan(`🔗 Chain: ${chain}`));
    console.log(chalk.cyan(`🧭 Mode: ${mode}`));
    console.log(chalk.cyan(`🆔 Run ID: ${runId}`));

    if (!isProject) {
        const intel = await gatherIntel(target, chain, rpcUrl);
        console.log(chalk.green(`\n📡 Intel:`));
        console.log(`   Contract: ${intel.contractName}`);
        console.log(`   Language: ${intel.language}`);
        console.log(`   Source: ${intel.sourceCode ? 'YES' : 'NO'}`);
        console.log(`   Tx Count: ${intel.totalTxCount || 0}`);
    }

    const strategist = new AttackStrategist();
    const plan = await strategist.generateInitialPlan(target, chain, isProject);
    console.log(chalk.green(`\n🗺️ Initial Attack Vectors (${plan.prioritizedVectors.length})`));
    plan.prioritizedVectors.slice(0, 5).forEach((vector, idx) => {
        console.log(`   ${idx + 1}. ${vector.vector}`);
    });

    const engine = new ReActEngine(runId);
    const result = await engine.run(target, chain, isProject);

    console.log(chalk.cyan('\n━━━ RESULT ━━━'));
    console.log(`Status: ${result.status}`);
    console.log(`Details: ${result.details}`);
    if (result.exportPath) {
        console.log(`Export: ${result.exportPath}`);
    }
}

program
    .command('analyze')
    .description('Analyze a single contract/program or project path using autonomous ReAct engine')
    .argument('<target>', 'Address/program id or project path/repository URL')
    .option('--chain <name>', 'Chain name', 'ethereum')
    .option('--project', 'Treat target as local project path or git repository')
    .option('--rpc <url>', 'RPC URL override')
    .option('--mode <mode>', 'Engagement mode: recon|validate|exploit', 'validate')
    .option('--approve', 'Grant execution approval for this run')
    .action(async (target, opts) => {
        await runAnalyze(target, opts);
    });

program
    .command('exploit')
    .description('Compatibility shim for analyze --mode exploit')
    .argument('<target>', 'Address/program id or project path/repository URL')
    .option('--chain <name>', 'Chain name', 'ethereum')
    .option('--project', 'Treat target as local project path or git repository')
    .option('--rpc <url>', 'RPC URL override')
    .option('--approve', 'Grant execution approval for this run')
    .action(async (target, opts) => {
        await runAnalyze(target, { ...opts, mode: 'exploit' });
    });

program
    .command('attack')
    .description('Compatibility shim for guarded exploit mode')
    .argument('<target>', 'Target address/program/project')
    .option('--chain <name>', 'Chain name', 'ethereum')
    .option('--project', 'Treat target as local project path or git repository')
    .option('--rpc <url>', 'RPC URL override')
    .option('--approve', 'Grant execution approval for this run')
    .action(async (target, opts) => {
        await runAnalyze(target, { ...opts, mode: 'exploit' });
    });

program
    .command('mev')
    .description('Explicit command placeholder in defensive mode')
    .action(() => {
        console.log(chalk.yellow('MEV scanning is intentionally constrained in authorized defensive mode.'));
        console.log(chalk.gray('Use `analyze` with approved test targets to validate hypotheses.'));
    });

program
    .command('evmbench')
    .description('Explicit command placeholder in defensive mode')
    .action(() => {
        console.log(chalk.yellow('EVM benchmark mode is intentionally constrained in authorized defensive mode.'));
        console.log(chalk.gray('Use `analyze --mode recon` for low-impact benchmark-style runs.'));
    });

program
    .command('scan')
    .description('Legacy shim for analyze')
    .argument('<target>')
    .action(async (targetPath) => {
        console.log(chalk.yellow('⚠️  "scan" is deprecated. Use "analyze" instead.\n'));
        await runAnalyze(targetPath, { chain: 'ethereum', mode: 'validate' });
    });

program
    .command('agent')
    .description('Start autonomous watcher + queue agent (EVM deployment discovery)')
    .option('--chains <names>', 'Comma-separated chain names', 'ethereum,bsc,arbitrum,base,somnia')
    .option('--poll <ms>', 'Block poll interval in ms', '12000')
    .option('--loop <ms>', 'Main loop interval in ms', '5000')
    .option('--port <port>', 'Dashboard port', '4040')
    .option('--max-exploits <n>', 'Max exploits per target', '10')
    .option('--retries <n>', 'Self-healing retry attempts', '3')
    .option('--no-dashboard', 'Disable web dashboard')
    .option('--mempool', 'Enable mempool monitoring (requires WebSocket RPC)')
    .option('--no-exec', 'Skip execution/simulation')
    .action(async (opts) => {
        const chainNames = opts.chains.split(',').map((c: string) => c.trim().toLowerCase());
        const selectedChains = DEFAULT_CHAINS.filter((chain) => chainNames.includes(chain.name));

        if (selectedChains.length === 0) {
            console.error(chalk.red(`❌ No valid chains: ${opts.chains}`));
            console.error(chalk.yellow(`   Available: ${DEFAULT_CHAINS.map((c) => c.name).join(', ')}`));
            process.exit(1);
        }

        const agent = new VibeAuditAgent({
            chains: selectedChains,
            pollInterval: parseInt(opts.poll, 10),
            loopInterval: parseInt(opts.loop, 10),
            dashboardPort: parseInt(opts.port, 10),
            maxExploitsPerTarget: parseInt(opts.maxExploits, 10),
            maxRetries: parseInt(opts.retries, 10),
            enableDashboard: opts.dashboard !== false,
            enableMempool: !!opts.mempool,
            skipExecution: opts.exec === false || !checkFoundryInstalled(),
        });

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

program
    .command('ui')
    .description('Launch interactive testing UI')
    .option('-p, --port <number>', 'Port to serve on', '4041')
    .action(async (opts: any) => {
        console.log(chalk.cyan('\n🛡️  VibeAudit — Starting Testing UI...'));
        startTestingUI(parseInt(opts.port, 10));
    });

program.parse();
