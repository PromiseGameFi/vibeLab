"use server";

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY || "");

const SYSTEM_PROMPT = `You are an expert Smart Contract Auditor and Red Teamer. 
Your task is to analyze Solidity code for security vulnerabilities, including KOWN patterns (Reentrancy, etc.) and NOVEL logic errors.

For every vulnerability found, you MUST provide a "Proof of Concept" (PoC) attack scenario.

FORMAT YOUR RESPONSE AS JSON ONLY.
Structure:
[
  {
    "severity": "Critical/High/Medium/Low",
    "title": "Short Title",
    "description": "Detailed explanation of the exploit",
    "exploit_poc": "// Solidity/Foundry test code snippet demonstrating the attack",
    "line": 10,
    "recommendation": "How to fix it"
  }
]
If no issues are found, return an empty JSON array [].`;

export async function auditDirectory(targetPath: string) {
    try {
        // 1. Validate Path
        const stats = await fs.stat(targetPath);
        let files: string[] = [];

        if (stats.isFile()) {
            if (targetPath.endsWith('.sol')) files.push(targetPath);
        } else {
            // Find all .sol files
            // We need to use glob but fs/promises doesn't have it built-in like this
            // We'll use a simple recursive finder or the glob package if available in context
            // aiming for simplicity: just read dir if strictly needed, but glob is better
            // For now, let's assume we can use 'glob' package as we saw it in package.json devDeps?
            // Wait, package.json had @google/generative-ai but maybe not glob.
            // Let's implement a simple recursive walker to be safe without extra deps if possible,
            // OR just use the 'glob' we likely need to install or is present.
            // Actually, let's just stick to fs.readdir recursive for Node 20+
            files = await findSolFiles(targetPath);
        }

        if (files.length === 0) return "No .sol files found in that directory.";

        let report = `# 🛡️ VibeAudit Report\n\n`;
        report += `**Scanned**: ${targetPath}\n`;
        report += `**Files Found**: ${files.length}\n\n---\n\n`;

        // 2. Audit each file
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        for (const filePath of files) {
            const code = await fs.readFile(filePath, 'utf-8');
            const filename = path.basename(filePath);

            report += `## 📄 ${filename}\n\n`;

            try {
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + `\n\nAnalyze this:\n${code}` }] }],
                    generationConfig: { responseMimeType: "application/json" }
                });

                const responseText = result.response.text();
                const findings = JSON.parse(responseText);

                if (findings.length === 0) {
                    report += `✅ **No vulnerabilities found.**\n\n`;
                } else {
                    for (const finding of findings) {
                        const color =
                            finding.severity === 'Critical' ? '🔴' :
                                finding.severity === 'High' ? '🟠' :
                                    finding.severity === 'Medium' ? '🟡' : '🔵';

                        report += `### ${color} [${finding.severity}] ${finding.title}\n`;
                        report += `**Description**: ${finding.description}\n\n`;
                        if (finding.exploit_poc) {
                            report += `**💥 Exploit PoC**:\n\`\`\`solidity\n${finding.exploit_poc}\n\`\`\`\n\n`;
                        }
                        report += `**Fix**: ${finding.recommendation}\n\n---\n`;
                    }
                }

            } catch (err: any) {
                report += `❌ **AI Analysis Failed**: ${err.message}\n\n`;
            }
        }

        return report;

    } catch (error: any) {
        return `Error: ${error.message}`;
    }
}

async function findSolFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (file.name !== 'node_modules') {
                results = results.concat(await findSolFiles(fullPath));
            }
        } else if (file.name.endsWith('.sol')) {
            results.push(fullPath);
        }
    }
    return results;
}
