import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { ExploitFinding, MevOpportunity } from './auditor';
import { ExploitResult } from './exploit-runner';
import { MevScanResult } from './mev-scanner';

// ─── Attack Report (for `attack` and `exploit` modes) ──────────────

interface AttackReportData {
    target: string;
    findings: ExploitFinding[];
    exploitResults?: { name: string; results: ExploitResult[] }[];
}

export async function generateAttackReport(data: AttackReportData[]): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1]?.substring(0, 5) || '';
    const reportDir = path.join(process.cwd(), 'audit_reports');
    await fs.mkdir(reportDir, { recursive: true });

    const reportPath = path.join(reportDir, `attack_report_${date}_${time.replace(':', '')}.md`);

    let md = `# 🏴‍☠️ VibeAudit Attack Report\n`;
    md += `**Date**: ${date} ${time}\n\n`;

    // Summary
    let totalExploits = 0;
    let confirmedExploits = 0;

    for (const entry of data) {
        totalExploits += entry.findings.length;
        if (entry.exploitResults) {
            for (const er of entry.exploitResults) {
                confirmedExploits += er.results.filter(r => r.passed).length;
            }
        }
    }

    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Targets Scanned | ${data.length} |\n`;
    md += `| Exploits Found | ${totalExploits} |\n`;
    md += `| **Confirmed (Passed Forge)** | **${confirmedExploits}** |\n\n`;
    md += `---\n\n`;

    for (const entry of data) {
        md += `## 🎯 Target: ${entry.target}\n\n`;

        if (entry.findings.length === 0) {
            md += `🔒 No exploitable vulnerabilities found.\n\n`;
            continue;
        }

        for (let i = 0; i < entry.findings.length; i++) {
            const f = entry.findings[i];
            const icon = f.severity === 'Critical' ? '🔴' :
                f.severity === 'High' ? '🟠' :
                    f.severity === 'Medium' ? '🟡' : '🔵';

            md += `### ${icon} [${f.severity}] ${f.title}\n\n`;

            if (f.line) md += `**Vulnerable Line**: ${f.line}\n\n`;
            md += `**Exploit Mechanics**: ${f.description}\n\n`;
            md += `**💰 Profit Potential**: ${f.profit_potential}\n\n`;
            md += `**Prerequisites**: ${f.prerequisites}\n\n`;
            md += `**⚔️ Attack Vector**:\n${f.attack_vector}\n\n`;

            // Check if this exploit was tested
            if (entry.exploitResults && entry.exploitResults[i]) {
                const er = entry.exploitResults[i];
                for (const r of er.results) {
                    if (r.passed) {
                        md += `> **💀 EXPLOIT CONFIRMED** — \`${r.testName}\` PASSED (gas: ${r.gasUsed || 'N/A'})\n\n`;
                    } else {
                        md += `> ❌ \`${r.testName}\` — did not pass (may need adjustment)\n\n`;
                    }
                }
            }

            if (f.exploit_test_code) {
                md += `<details>\n<summary>💣 Weaponized PoC (Click to expand)</summary>\n\n`;
                md += `\`\`\`solidity\n${f.exploit_test_code}\n\`\`\`\n\n`;
                md += `</details>\n\n`;
            }

            md += `---\n\n`;
        }
    }

    await fs.writeFile(reportPath, md, 'utf-8');
    return reportPath;
}

// ─── MEV Report (for `mev` mode) ───────────────────────────────────

export async function generateMevReport(results: MevScanResult[]): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1]?.substring(0, 5) || '';
    const reportDir = path.join(process.cwd(), 'audit_reports');
    await fs.mkdir(reportDir, { recursive: true });

    const reportPath = path.join(reportDir, `mev_report_${date}_${time.replace(':', '')}.md`);

    let md = `# 💰 VibeAudit MEV Opportunity Report\n`;
    md += `**Date**: ${date} ${time}\n\n`;

    let totalOpps = 0;
    for (const r of results) totalOpps += r.opportunities.length;

    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Contracts Analyzed | ${results.length} |\n`;
    md += `| Opportunities Found | ${totalOpps} |\n\n`;
    md += `---\n\n`;

    for (const r of results) {
        md += `## 🎯 ${r.contractName || r.address}\n`;
        md += `**Address**: \`${r.address}\`\n`;
        md += `**Balance**: ${r.balance} ETH\n\n`;

        for (const opp of r.opportunities) {
            const typeIcons: Record<string, string> = {
                flash_loan: '⚡',
                sandwich: '🥪',
                oracle_manipulation: '🔮',
                arbitrage: '📊',
                liquidation: '💧',
                access_control: '🔓',
            };
            const icon = typeIcons[opp.type] || '💰';

            md += `### ${icon} [${opp.type.toUpperCase()}] ${opp.title}\n\n`;
            md += `**Description**: ${opp.description}\n\n`;
            md += `**Estimated Profit**: ${opp.estimated_profit}\n\n`;
            md += `**Risk**: ${opp.risk_level}\n\n`;

            if (opp.exploit_code) {
                md += `<details>\n<summary>💣 Exploit Code</summary>\n\n`;
                md += `\`\`\`solidity\n${opp.exploit_code}\n\`\`\`\n\n`;
                md += `</details>\n\n`;
            }

            md += `---\n\n`;
        }
    }

    await fs.writeFile(reportPath, md, 'utf-8');
    return reportPath;
}
