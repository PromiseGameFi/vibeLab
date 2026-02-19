/**
 * Report Generator
 * Combines all 4 analysis modules into a unified Markdown security report
 * with risk scores, diagrams, and prioritized mitigations.
 */

import { ContractDeepAnalysis } from './contract-deep';
import { ProcessFlowAnalysis } from './process-flow';
import { FrontendInteractionAnalysis } from './frontend-interaction';
import { BridgeSecurityAnalysis } from './bridge-security';
import fs from 'fs';
import path from 'path';

// ─── Unified Report ─────────────────────────────────────────────────

export interface SecurityReport {
    address: string;
    chain: string;
    contractName: string;
    timestamp: string;
    overallRiskScore: number;
    contractAnalysis: ContractDeepAnalysis;
    processFlow: ProcessFlowAnalysis;
    frontendInteraction: FrontendInteractionAnalysis;
    bridgeSecurity: BridgeSecurityAnalysis;
    markdown: string;
}

// ─── Score Calculation ──────────────────────────────────────────────

function calculateOverallRisk(
    contract: ContractDeepAnalysis,
    process: ProcessFlowAnalysis,
    frontend: FrontendInteractionAnalysis,
    bridge: BridgeSecurityAnalysis,
): number {
    // Weighted average — bridge gets high weight if applicable
    const weights = bridge.isBridge
        ? { contract: 0.25, process: 0.20, frontend: 0.20, bridge: 0.35 }
        : { contract: 0.40, process: 0.30, frontend: 0.30, bridge: 0 };

    const score =
        contract.overallRiskScore * weights.contract +
        process.riskScore * weights.process +
        frontend.riskScore * weights.frontend +
        bridge.riskScore * weights.bridge;

    return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── Risk Level ─────────────────────────────────────────────────────

function riskLevel(score: number): string {
    if (score >= 80) return '🔴 CRITICAL';
    if (score >= 60) return '🟠 HIGH';
    if (score >= 40) return '🟡 MEDIUM';
    if (score >= 20) return '🟢 LOW';
    return '⚪ MINIMAL';
}

function riskEmoji(score: number): string {
    if (score >= 80) return '🔴';
    if (score >= 60) return '🟠';
    if (score >= 40) return '🟡';
    if (score >= 20) return '🟢';
    return '⚪';
}

function severityEmoji(sev: string): string {
    switch (sev.toUpperCase()) {
        case 'CRITICAL': return '🔴';
        case 'HIGH': return '🟠';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🟢';
        default: return '⚪';
    }
}

// ─── Markdown Generation ────────────────────────────────────────────

export function generateSecurityReport(
    address: string,
    chain: string,
    contract: ContractDeepAnalysis,
    process: ProcessFlowAnalysis,
    frontend: FrontendInteractionAnalysis,
    bridge: BridgeSecurityAnalysis,
): SecurityReport {
    const overallRisk = calculateOverallRisk(contract, process, frontend, bridge);
    const timestamp = new Date().toISOString();
    const contractName = contract.contractName || 'Unknown';

    const sections: string[] = [];

    // ── Header ──
    sections.push(`# 🛡️ Security Analysis: ${contractName}`);
    sections.push('');
    sections.push(`| | |`);
    sections.push(`|---|---|`);
    sections.push(`| **Address** | \`${address}\` |`);
    sections.push(`| **Chain** | ${chain} |`);
    sections.push(`| **Type** | ${contract.contractType} |`);
    sections.push(`| **Risk Score** | ${riskEmoji(overallRisk)} **${overallRisk}/100** — ${riskLevel(overallRisk)} |`);
    sections.push(`| **Analyzed** | ${new Date(timestamp).toLocaleString()} |`);
    sections.push('');

    // ── Executive Summary ──
    sections.push('## Executive Summary');
    sections.push('');
    sections.push(`| Layer | Score | Level |`);
    sections.push(`|-------|-------|-------|`);
    sections.push(`| Smart Contract | ${riskEmoji(contract.overallRiskScore)} ${contract.overallRiskScore}/100 | ${riskLevel(contract.overallRiskScore)} |`);
    sections.push(`| Process Flow | ${riskEmoji(process.riskScore)} ${process.riskScore}/100 | ${riskLevel(process.riskScore)} |`);
    sections.push(`| Frontend Interaction | ${riskEmoji(frontend.riskScore)} ${frontend.riskScore}/100 | ${riskLevel(frontend.riskScore)} |`);
    if (bridge.isBridge) {
        sections.push(`| Bridge Security | ${riskEmoji(bridge.riskScore)} ${bridge.riskScore}/100 | ${riskLevel(bridge.riskScore)} |`);
    }
    sections.push('');
    sections.push(`> ${contract.summary}`);
    sections.push('');

    // ── 1. Contract Deep Analysis ──
    sections.push('---');
    sections.push('## 1. Smart Contract Analysis');
    sections.push('');

    // Token Compliance
    if (contract.tokenCompliance.standard !== 'none') {
        sections.push(`### Token Compliance: ${contract.tokenCompliance.standard}`);
        if (contract.tokenCompliance.deviations.length > 0) {
            sections.push('**Deviations:**');
            contract.tokenCompliance.deviations.forEach(d => sections.push(`- ⚠️ ${d}`));
        }
        if (contract.tokenCompliance.missingEvents.length > 0) {
            sections.push('**Missing Events:**');
            contract.tokenCompliance.missingEvents.forEach(e => sections.push(`- ❌ ${e}`));
        }
        if (contract.tokenCompliance.edgeCaseRisks.length > 0) {
            sections.push('**Edge Case Risks:**');
            contract.tokenCompliance.edgeCaseRisks.forEach(r => sections.push(`- 🔸 ${r}`));
        }
        sections.push('');
    }

    // Upgrade Mechanics
    sections.push(`### Upgrade Mechanics`);
    if (contract.upgradeMechanics.isUpgradeable) {
        sections.push(`- **Pattern:** ${contract.upgradeMechanics.proxyPattern}`);
        sections.push(`- **Admin:** ${contract.upgradeMechanics.adminControl}`);
        if (contract.upgradeMechanics.storageRisks.length > 0) {
            sections.push('- **Storage Risks:**');
            contract.upgradeMechanics.storageRisks.forEach(r => sections.push(`  - ⚠️ ${r}`));
        }
    } else {
        sections.push('- Not upgradeable (immutable)');
    }
    sections.push('');

    // Access Control
    sections.push('### Access Control');
    sections.push(`- **Ownership:** ${contract.accessControl.ownershipTransfer}`);
    if (contract.accessControl.roles.length > 0) {
        sections.push('');
        sections.push('| Role | Functions | Holder |');
        sections.push('|------|-----------|--------|');
        contract.accessControl.roles.forEach(r => {
            sections.push(`| ${r.name} | ${r.functions.join(', ')} | ${r.holder} |`);
        });
    }
    if (contract.accessControl.unprotectedFunctions.length > 0) {
        sections.push('');
        sections.push('**⚠️ Unprotected State-Changing Functions:**');
        contract.accessControl.unprotectedFunctions.forEach(f => sections.push(`- \`${f}\``));
    }
    sections.push('');

    // Fund Flow
    sections.push('### Fund Flow');
    if (contract.fundFlow.entryPoints.length > 0) {
        sections.push('**Entry Points (money in):**');
        contract.fundFlow.entryPoints.forEach(e =>
            sections.push(`- \`${e.function}\` — ${e.tokenType} via ${e.mechanism}`)
        );
    }
    if (contract.fundFlow.exitPoints.length > 0) {
        sections.push('**Exit Points (money out):**');
        contract.fundFlow.exitPoints.forEach(e =>
            sections.push(`- \`${e.function}\` — ${e.tokenType} to ${e.recipient}`)
        );
    }
    sections.push(`- **Fee Structure:** ${contract.fundFlow.feeStructure}`);
    sections.push(`- **Emergency Withdraw:** ${contract.fundFlow.emergencyWithdraw ? '✅ Yes' : '❌ No'}`);
    sections.push('');

    // Dependencies
    if (contract.dependencies.externalContracts.length > 0 || contract.dependencies.oracleReliance.length > 0) {
        sections.push('### External Dependencies');
        if (contract.dependencies.externalContracts.length > 0) {
            sections.push('| Contract | Purpose | Trust Level |');
            sections.push('|----------|---------|-------------|');
            contract.dependencies.externalContracts.forEach(c =>
                sections.push(`| ${c.address} | ${c.purpose} | ${c.trustLevel} |`)
            );
        }
        if (contract.dependencies.oracleReliance.length > 0) {
            sections.push('');
            sections.push('**Oracle Dependencies:**');
            contract.dependencies.oracleReliance.forEach(o =>
                sections.push(`- ${o.oracle}: ${o.dataUsed} (manipulation risk: ${o.manipulationRisk})`)
            );
        }
        sections.push('');
    }

    // ── 2. Process Flow ──
    sections.push('---');
    sections.push('## 2. Process Flow Analysis');
    sections.push('');

    // Mermaid diagram
    if (process.mermaidDiagram) {
        sections.push('### State Diagram');
        sections.push('```mermaid');
        sections.push(process.mermaidDiagram.replace(/\\n/g, '\n'));
        sections.push('```');
        sections.push('');
    }

    // User Journeys
    if (process.userJourneys.length > 0) {
        sections.push('### User Journeys');
        process.userJourneys.forEach(j => {
            sections.push(`#### ${j.happyPath ? '✅' : '⚠️'} ${j.persona}`);
            sections.push(`**Steps:** ${j.steps.join(' → ')}`);
            if (j.risks.length > 0) {
                sections.push('**Risks:**');
                j.risks.forEach(r => sections.push(`- ⚠️ ${r}`));
            }
            sections.push('');
        });
    }

    // Ordering Risks
    if (process.orderingRisks.length > 0) {
        sections.push('### Transaction Ordering Risks');
        process.orderingRisks.forEach(r => {
            sections.push(`- ${severityEmoji(r.severity)} **${r.riskType.toUpperCase()}**: ${r.description}`);
            sections.push(`  - Functions: ${r.functions.map(f => `\`${f}\``).join(', ')}`);
            sections.push(`  - Mitigation: ${r.mitigation}`);
        });
        sections.push('');
    }

    // Time Dependencies
    if (process.timeDependencies.length > 0) {
        sections.push('### Time Dependencies');
        sections.push('| Function | Mechanism | Purpose | Risk |');
        sections.push('|----------|-----------|---------|------|');
        process.timeDependencies.forEach(t =>
            sections.push(`| \`${t.function}\` | ${t.mechanism} | ${t.purpose} | ${t.risk} |`)
        );
        sections.push('');
    }

    // Economic Flows
    if (process.economicFlows.length > 0) {
        sections.push('### Economic Flows');
        process.economicFlows.forEach(e => {
            sections.push(`#### ${e.pattern}`);
            sections.push(`**Steps:** ${e.steps.join(' → ')}`);
            sections.push(`**MEV Exposure:** ${e.mevExposure}`);
            if (e.slippageRisks.length > 0) {
                e.slippageRisks.forEach(s => sections.push(`- ⚠️ ${s}`));
            }
            sections.push('');
        });
    }

    // ── 3. Frontend Interaction ──
    sections.push('---');
    sections.push('## 3. Frontend Interaction Analysis');
    sections.push('');

    // ABI Surface overview
    sections.push(`### ABI Surface`);
    sections.push(`- **Total Functions:** ${frontend.abiSurface.totalFunctions}`);
    sections.push(`- **Read:** ${frontend.abiSurface.readFunctions.length} | **Write:** ${frontend.abiSurface.writeFunctions.length} | **Admin:** ${frontend.abiSurface.adminFunctions.length}`);
    sections.push(`- **Complexity Score:** ${frontend.abiSurface.complexityScore}/100`);
    sections.push('');

    // Approval Chains
    if (frontend.approvalChains.length > 0) {
        sections.push('### Approval Chains');
        frontend.approvalChains.forEach(a => {
            sections.push(`- **${a.tokenType}**: ${a.flow.join(' → ')}`);
            sections.push(`  - Infinite approval: ${a.infiniteApproval ? '⚠️ YES' : '✅ No'}`);
            sections.push(`  - Permit2: ${a.permit2Support ? '✅ Yes' : '❌ No'}`);
            sections.push(`  - Risk: ${a.risk}`);
        });
        sections.push('');
    }

    // TX Ordering Risks
    if (frontend.txOrderingRisks.length > 0) {
        sections.push('### MEV / Front-Running Risks');
        frontend.txOrderingRisks.forEach(r => {
            sections.push(`- ${severityEmoji(r.severity)} **${r.attackType.toUpperCase()}** on \`${r.targetFunction}\``);
            sections.push(`  - ${r.scenario}`);
            sections.push(`  - Protection: ${r.protection}`);
        });
        sections.push('');
    }

    // Gas Cost Patterns
    if (frontend.gasCostPatterns.length > 0) {
        sections.push('### Gas Cost Patterns');
        sections.push('| Function | Gas | Variability | DoS Risk |');
        sections.push('|----------|-----|-------------|----------|');
        frontend.gasCostPatterns.forEach(g =>
            sections.push(`| \`${g.function}\` | ${g.estimatedGas} | ${g.variability} | ${g.dosRisk ? '⚠️ Yes' : '✅ No'} |`)
        );
        sections.push('');
    }

    // Phishing Vectors
    if (frontend.phishingVectors.length > 0) {
        sections.push('### Phishing Vectors');
        frontend.phishingVectors.forEach(p => {
            sections.push(`- ${severityEmoji(p.severity)} \`${p.function}\`: ${p.vector}`);
            sections.push(`  - Impact: ${p.userImpact}`);
            sections.push(`  - Mitigation: ${p.mitigation}`);
        });
        sections.push('');
    }

    // ── 4. Bridge Security (if applicable) ──
    if (bridge.isBridge) {
        sections.push('---');
        sections.push('## 4. Bridge Security Analysis');
        sections.push('');
        sections.push(`- **Bridge Type:** ${bridge.bridgeType}`);
        sections.push(`- **Message Verification:** ${bridge.messageVerification.mechanism}`);
        sections.push(`- **Validators:** ${bridge.messageVerification.validators}`);
        sections.push(`- **Threshold:** ${bridge.messageVerification.thresholdScheme}`);
        sections.push(`- **Replay Protection:** ${bridge.messageVerification.replayProtection ? '✅' : '❌'}`);
        sections.push('');

        if (bridge.messageVerification.risks.length > 0) {
            sections.push('**Verification Risks:**');
            bridge.messageVerification.risks.forEach(r => sections.push(`- ⚠️ ${r}`));
            sections.push('');
        }

        // Admin Key Risks
        if (bridge.adminKeyRisks.length > 0) {
            sections.push('### Admin Key Risks');
            sections.push('| Role | Key Type | SPOF | Risk |');
            sections.push('|------|----------|------|------|');
            bridge.adminKeyRisks.forEach(a =>
                sections.push(`| ${a.role} | ${a.keyType} | ${a.singlePointOfFailure ? '⚠️' : '✅'} | ${a.risk} |`)
            );
            sections.push('');
        }

        // Known Exploit Patterns
        if (bridge.knownExploitPatterns.length > 0) {
            sections.push('### Known Exploit Pattern Matching');
            bridge.knownExploitPatterns.forEach(p => {
                const icon = p.match ? '🔴' : '✅';
                sections.push(`- ${icon} **${p.pattern}**: ${p.match ? 'MATCH' : 'No match'} (${p.similarity})`);
                sections.push(`  - ${p.explanation}`);
            });
            sections.push('');
        }
    }

    // ── Footer ──
    sections.push('---');
    sections.push(`*Generated by VibeAudit Security Agent — ${new Date(timestamp).toLocaleString()}*`);

    const markdown = sections.join('\n');

    return {
        address,
        chain,
        contractName,
        timestamp,
        overallRiskScore: overallRisk,
        contractAnalysis: contract,
        processFlow: process,
        frontendInteraction: frontend,
        bridgeSecurity: bridge,
        markdown,
    };
}

// ─── Save to File ───────────────────────────────────────────────────

export function saveReport(report: SecurityReport, outputDir: string = 'reports'): string {
    const dir = path.resolve(outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${report.chain}_${report.address.substring(0, 10)}_${Date.now()}.md`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, report.markdown, 'utf-8');

    // Also save raw JSON
    const jsonPath = filepath.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
        address: report.address,
        chain: report.chain,
        contractName: report.contractName,
        timestamp: report.timestamp,
        overallRiskScore: report.overallRiskScore,
        contractAnalysis: report.contractAnalysis,
        processFlow: report.processFlow,
        frontendInteraction: report.frontendInteraction,
        bridgeSecurity: report.bridgeSecurity,
    }, null, 2), 'utf-8');

    return filepath;
}
