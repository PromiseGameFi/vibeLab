/**
 * Pipeline Orchestrator
 * Runs the full 6-stage attack pipeline against a target contract.
 */

import chalk from 'chalk';
import { reconContract, ContractRecon, formatReconForAI } from './recon';
import { staticAnalysis, StaticFinding, formatStaticForAI } from './static-analysis';
import { multiVectorAnalysis, AnalysisPassResult } from './ai-analysis';
import { buildStrategies, AttackStrategy, StrategyReport, formatStrategySummary } from './strategy';
import { generateExploits, GeneratedExploit } from './exploit-gen';
import { executeWithHealing, ExploitResult } from './executor';
import { checkFoundryInstalled } from '../utils';
import fs from 'fs/promises';
import path from 'path';

// ─── Pipeline Options ───────────────────────────────────────────────

export interface PipelineOptions {
    rpcUrl?: string;
    forkBlock?: string;
    maxExploits?: number;       // How many strategies to generate exploits for
    maxRetries?: number;        // Self-healing retry attempts
    skipExecution?: boolean;    // Skip Foundry execution
    onChainContext?: {          // Extra on-chain info
        address?: string;
        balance?: string;
        bytecode?: string;
    };
}

// ─── Pipeline Result ────────────────────────────────────────────────

export interface PipelineResult {
    target: string;
    recon: ContractRecon;
    staticFindings: StaticFinding[];
    aiResults: AnalysisPassResult[];
    strategyReport: StrategyReport;
    exploits: GeneratedExploit[];
    executionResults: ExploitResult[];
    confirmedExploits: number;
    totalDuration: number;
}

// ─── Run Full Pipeline ──────────────────────────────────────────────

/**
 * Execute the full 6-stage attack pipeline against a single contract.
 */
export async function runPipeline(
    code: string,
    filename: string,
    filePath: string,
    options: PipelineOptions = {},
): Promise<PipelineResult> {
    const startTime = Date.now();

    console.log(chalk.red(`\n${'━'.repeat(60)}`));
    console.log(chalk.red(`  🏴‍☠️  ATTACK PIPELINE: ${filename}`));
    console.log(chalk.red(`${'━'.repeat(60)}\n`));

    // ─── Stage 1: Reconnaissance ────────────────────────────────
    console.log(chalk.magenta('📡 Stage 1/6: Reconnaissance'));
    const recon = reconContract(code, filename);
    console.log(chalk.gray(`   Contract: ${recon.name}`));
    console.log(chalk.gray(`   Functions: ${recon.functions.length} | State vars: ${recon.stateVariables.length}`));
    console.log(chalk.gray(`   External calls: ${recon.externalCalls.length}`));
    for (const s of recon.attackSurface) {
        console.log(chalk.yellow(`   ${s}`));
    }

    // ─── Stage 2: Static Analysis ───────────────────────────────
    console.log(chalk.magenta('\n🔍 Stage 2/6: Static Analysis'));
    const staticFindings = staticAnalysis(code, recon);
    console.log(chalk.yellow(`   ${staticFindings.length} issue(s) found`));
    for (const f of staticFindings) {
        console.log(chalk.gray(`   [${f.severity}] ${f.title}`));
    }

    // ─── Stage 3: Multi-Vector AI Analysis ──────────────────────
    console.log(chalk.magenta('\n🧠 Stage 3/6: Multi-Vector AI Analysis'));
    const aiResults = await multiVectorAnalysis(code, filename, recon, staticFindings);

    let totalAIFindings = 0;
    for (const r of aiResults) totalAIFindings += r.findings.length;
    console.log(chalk.yellow(`\n   Total AI findings: ${totalAIFindings} across ${aiResults.length} pass(es)`));

    // ─── Stage 4: Strategy Builder ──────────────────────────────
    console.log(chalk.magenta('\n📋 Stage 4/6: Building Attack Strategies'));
    const strategyReport = buildStrategies(aiResults, staticFindings);
    console.log(chalk.yellow(`   ${strategyReport.strategies.length} unique strategies (from ${strategyReport.totalFindings} raw findings)`));
    if (strategyReport.strategies.length > 0) {
        console.log(chalk.red(`   🎯 Top threat: ${strategyReport.topThreat}`));
        // Show top 5
        for (const s of strategyReport.strategies.slice(0, 5)) {
            const hasCode = s.exploitCode.length > 50 ? '✓ code' : '⚠ no code';
            console.log(chalk.gray(`   [${s.id}] score:${s.score} ${s.severity} — ${s.title} (${hasCode})`));
        }
    }

    // ─── Stage 5: Exploit Generation ────────────────────────────
    console.log(chalk.magenta('\n⚔️  Stage 5/6: Generating Exploits'));
    const maxExploits = options.maxExploits ?? 10;
    const exploits = await generateExploits(
        strategyReport.strategies,
        code,
        recon,
        maxExploits,
    );
    console.log(chalk.yellow(`   Generated ${exploits.length} exploit(s)`));

    // ─── Stage 6: Self-Healing Execution ────────────────────────
    let executionResults: ExploitResult[] = [];
    let confirmedExploits = 0;

    if (!options.skipExecution && checkFoundryInstalled()) {
        console.log(chalk.magenta('\n🔬 Stage 6/6: Self-Healing Execution'));
        console.log(chalk.gray(`   Max retries per exploit: ${options.maxRetries ?? 3}`));

        executionResults = await executeWithHealing(exploits, code, filePath, {
            rpcUrl: options.rpcUrl,
            maxRetries: options.maxRetries ?? 3,
            forkBlock: options.forkBlock,
        });

        confirmedExploits = executionResults.filter(r => r.passed).length;
    } else if (options.skipExecution) {
        console.log(chalk.yellow('\n⏭️  Stage 6/6: Skipped (--no-run)'));
    } else {
        console.log(chalk.yellow('\n⏭️  Stage 6/6: Skipped (Foundry not installed)'));
    }

    // ─── Summary ────────────────────────────────────────────────
    const totalDuration = Date.now() - startTime;
    console.log(chalk.red(`\n${'━'.repeat(60)}`));
    console.log(chalk.red(`  PIPELINE COMPLETE: ${filename}`));
    console.log(chalk.red(`${'━'.repeat(60)}`));
    console.log(`   Static findings:      ${staticFindings.length}`);
    console.log(`   AI findings:           ${totalAIFindings}`);
    console.log(`   Attack strategies:     ${strategyReport.strategies.length}`);
    console.log(`   Exploits generated:    ${exploits.length}`);
    if (executionResults.length > 0) {
        console.log(`   ${chalk.red(`💀 CONFIRMED EXPLOITS:    ${confirmedExploits}`)}`);
        console.log(`   Failed attempts:       ${executionResults.length - confirmedExploits}`);
    }
    console.log(`   Duration:              ${(totalDuration / 1000).toFixed(1)}s\n`);

    return {
        target: filename,
        recon,
        staticFindings,
        aiResults,
        strategyReport,
        exploits,
        executionResults,
        confirmedExploits,
        totalDuration,
    };
}

// ─── Report Generation ──────────────────────────────────────────────

/**
 * Generate a comprehensive attack report from pipeline results.
 */
export async function generatePipelineReport(
    results: PipelineResult[]
): Promise<string> {
    const dir = path.join(process.cwd(), 'audit_reports');
    await fs.mkdir(dir, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1]?.substring(0, 5)?.replace(':', '') || '';
    const reportPath = path.join(dir, `pipeline_attack_${date}_${time}.md`);

    let md = `# 🏴‍☠️ VibeAudit Attack Pipeline Report\n\n`;
    md += `**Date**: ${new Date().toISOString()}\n`;
    md += `**Targets**: ${results.length}\n\n`;

    for (const result of results) {
        md += `---\n\n## 💀 Target: ${result.target}\n\n`;

        // Recon summary
        md += `### 📡 Reconnaissance\n`;
        md += `- Contract: **${result.recon.name}**\n`;
        md += `- Solidity: ${result.recon.solidityVersion}\n`;
        md += `- Functions: ${result.recon.functions.length} | State vars: ${result.recon.stateVariables.length}\n`;
        md += `- ETH Flow: ${result.recon.ethFlowSummary}\n\n`;

        md += `**Attack Surface:**\n`;
        for (const s of result.recon.attackSurface) {
            md += `- ${s}\n`;
        }
        md += '\n';

        // Static findings
        if (result.staticFindings.length > 0) {
            md += `### 🔍 Static Analysis (${result.staticFindings.length} issues)\n`;
            for (const f of result.staticFindings) {
                md += `- **[${f.severity}]** ${f.title} (L${f.line}, ${(f.confidence * 100).toFixed(0)}% confidence)\n`;
            }
            md += '\n';
        }

        // Attack strategies
        if (result.strategyReport.strategies.length > 0) {
            md += `### ⚔️ Attack Strategies (${result.strategyReport.strategies.length})\n\n`;
            for (const s of result.strategyReport.strategies) {
                const status = result.executionResults.find(e => e.strategyId === s.id);
                const icon = status?.passed ? '💀 CONFIRMED' : '⚠️';
                md += `#### ${icon} ${s.id}: ${s.title}\n`;
                md += `**Score**: ${s.score}/100 | **Severity**: ${s.severity} | **Category**: ${s.category}\n\n`;
                md += `**Profit Potential**: ${s.profitPotential}\n\n`;

                if (s.steps.length > 0) {
                    md += `**Attack Steps:**\n`;
                    s.steps.forEach((step, i) => { md += `${i + 1}. ${step}\n`; });
                    md += '\n';
                }

                if (status) {
                    md += `**Execution**: ${status.passed ? '✅ PASSED' : '❌ FAILED'} (${status.attempts}/${status.maxAttempts} attempts)\n\n`;
                }

                if (s.exploitCode && s.exploitCode.length > 50) {
                    md += `**Exploit Code:**\n\`\`\`solidity\n${s.exploitCode}\n\`\`\`\n\n`;
                }
            }
        }

        // Summary
        md += `### 📊 Summary\n`;
        md += `| Metric | Value |\n|--------|-------|\n`;
        md += `| Static findings | ${result.staticFindings.length} |\n`;
        md += `| AI findings | ${result.aiResults.reduce((a, r) => a + r.findings.length, 0)} |\n`;
        md += `| Attack strategies | ${result.strategyReport.strategies.length} |\n`;
        md += `| Exploits generated | ${result.exploits.length} |\n`;
        md += `| **Confirmed exploits** | **${result.confirmedExploits}** |\n`;
        md += `| Duration | ${(result.totalDuration / 1000).toFixed(1)}s |\n\n`;
    }

    await fs.writeFile(reportPath, md, 'utf-8');
    return reportPath;
}
