import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { checkFoundryInstalled, getDefaultRpc } from './utils';
import { VibeAuditAgent } from './agent/agent';
import { DEFAULT_CHAINS } from './agent/watcher';
import { gatherIntel, getAnalyzableCode } from './agent/intel-gatherer';
import { startTestingUI } from './ui/testing-server';

dotenv.config();

const program = new Command();

program
    .name('vibeAudit')
    .description('🏴‍☠️ Offensive Smart Contract Attack Tool')
    .version('1.0.0');


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
