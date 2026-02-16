import fs from 'fs/promises';
import path from 'path';
import { AuditFinding } from './auditor';
import chalk from 'chalk';

interface AuditResult {
    file: string;
    findings: AuditFinding[];
}

export async function generateReport(results: AuditResult[]): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const reportDir = path.join(process.cwd(), 'audit_reports');

    await fs.mkdir(reportDir, { recursive: true });

    const reportPath = path.join(reportDir, `audit_report_${date}.md`);

    let markdown = `# 🛡️ VibeAudit Report - ${date}\n\n`;
    markdown += `**Scan Summary**\n\n`;

    let totalIssues = 0;
    let criticals = 0;

    for (const res of results) {
        totalIssues += res.findings.length;
        criticals += res.findings.filter(f => f.severity === 'Critical' || f.severity === 'High').length;
    }

    markdown += `- **Contracts Scanned**: ${results.length}\n`;
    markdown += `- **Total Issues**: ${totalIssues}\n`;
    markdown += `- **Critical/High**: ${criticals}\n\n`;
    markdown += `---\n\n`;

    for (const res of results) {
        markdown += `## 📄 ${res.file}\n`;

        if (res.findings.length === 0) {
            markdown += `✅ **No vulnerabilities found.**\n\n`;
            continue;
        }

        for (const finding of res.findings) {
            const color =
                finding.severity === 'Critical' ? '🔴' :
                    finding.severity === 'High' ? '🟠' :
                        finding.severity === 'Medium' ? '🟡' : '🔵';

            markdown += `<h3>${color} [${finding.severity}] ${finding.title}</h3>\n`;
            if (finding.line) markdown += `**Line**: ${finding.line}\n\n`;
            markdown += `**Description**: ${finding.description}\n\n`;
            if ((finding as any).exploit_poc) {
                markdown += `**💥 Exploit PoC (Test Case)**:\n\`\`\`solidity\n${(finding as any).exploit_poc}\n\`\`\`\n\n`;
            }
            markdown += `**Fix**: ${finding.recommendation}\n\n`;
            markdown += `---\n`;
        }
    }

    await fs.writeFile(reportPath, markdown, 'utf-8');
    return reportPath;
}
