/**
 * Testing UI Server — Interactive web interface for running the
 * VibeAudit security intelligence pipeline on any contract.
 *
 * Features:
 * - Enter contract address + chain → runs full 6-step pipeline
 * - Real-time progress via Server-Sent Events
 * - Results rendered with risk badges, findings, simulation results
 * - Learning statistics panel
 * - Past analyses history
 */

import express from 'express';
import chalk from 'chalk';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { gatherIntel, getAnalyzableCode, ContractIntel } from '../agent/intel-gatherer';
import { extractFindings, simulateExploits, VulnerabilityFinding, SimulationReport } from '../agent/exploit-simulator';
import { LearningEngine } from '../agent/learning';
import { analyzeContractDeep } from '../agent/analyzers/contract-deep';
import { analyzeProcessFlow } from '../agent/analyzers/process-flow';
import { analyzeFrontendInteraction } from '../agent/analyzers/frontend-interaction';
import { analyzeBridgeSecurity } from '../agent/analyzers/bridge-security';
import { generateSecurityReport, saveReport, SecurityReport } from '../agent/analyzers/report-generator';
import { checkFoundryInstalled, getDefaultRpc } from '../utils';

dotenv.config();

// ─── State ──────────────────────────────────────────────────────────

interface AnalysisRun {
    id: string;
    address: string;
    chain: string;
    status: 'running' | 'complete' | 'error';
    startedAt: string;
    completedAt?: string;
    progress: string[];
    intel?: ContractIntel;
    findings?: VulnerabilityFinding[];
    simulationReport?: SimulationReport;
    securityReport?: SecurityReport;
    error?: string;
}

const analysisHistory: AnalysisRun[] = [];
const activeClients: Map<string, express.Response[]> = new Map(); // runId → SSE clients
const learning = new LearningEngine();

// ─── SSE Helpers ────────────────────────────────────────────────────

function sendEvent(runId: string, type: string, data: any): void {
    const clients = activeClients.get(runId) || [];
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => {
        try { res.write(payload); } catch { }
    });
}

function sendProgress(runId: string, step: number, total: number, label: string, detail?: string): void {
    sendEvent(runId, 'progress', { step, total, label, detail });
    // Also store in history
    const run = analysisHistory.find(r => r.id === runId);
    if (run) run.progress.push(`[${step}/${total}] ${label}${detail ? ': ' + detail : ''}`);
}

// ─── Server ─────────────────────────────────────────────────────────

export function startTestingUI(port: number = 4041): void {
    const app = express();
    app.use(express.json());

    // ─── Serve the Testing UI ───────────────────────────────────
    app.get('/', (_req, res) => {
        res.send(generateHTML());
    });

    // ─── SSE stream for a specific run ──────────────────────────
    app.get('/api/stream/:runId', (req, res) => {
        const { runId } = req.params;
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        res.write(':ok\n\n');

        if (!activeClients.has(runId)) activeClients.set(runId, []);
        activeClients.get(runId)!.push(res);

        req.on('close', () => {
            const clients = activeClients.get(runId) || [];
            activeClients.set(runId, clients.filter(c => c !== res));
        });
    });

    // ─── Start Analysis ─────────────────────────────────────────
    app.post('/api/analyze', async (req, res) => {
        const { address, chain, rpcUrl, simulate } = req.body;

        if (!address || !address.startsWith('0x')) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        const runId = crypto.randomUUID();
        const run: AnalysisRun = {
            id: runId,
            address,
            chain: chain || 'ethereum',
            status: 'running',
            startedAt: new Date().toISOString(),
            progress: [],
        };
        analysisHistory.unshift(run);

        // Return immediately with runId, analysis runs in background
        res.json({ runId });

        // Run the pipeline async
        runAnalysis(run, rpcUrl || getDefaultRpc(), simulate !== false).catch(err => {
            run.status = 'error';
            run.error = err.message;
            sendEvent(runId, 'error', { message: err.message });
        });
    });

    // ─── Get run result ─────────────────────────────────────────
    app.get('/api/run/:runId', (req, res) => {
        const run = analysisHistory.find(r => r.id === req.params.runId);
        if (!run) return res.status(404).json({ error: 'Not found' });
        res.json(run);
    });

    // ─── History ────────────────────────────────────────────────
    app.get('/api/history', (_req, res) => {
        res.json(analysisHistory.slice(0, 50).map(r => ({
            id: r.id,
            address: r.address,
            chain: r.chain,
            status: r.status,
            startedAt: r.startedAt,
            completedAt: r.completedAt,
            riskScore: r.securityReport?.overallRiskScore,
            contractName: r.intel?.contractName,
            confirmed: r.simulationReport?.confirmedVulnerabilities,
            denied: r.simulationReport?.deniedVulnerabilities,
        })));
    });

    // ─── Learning Stats ─────────────────────────────────────────
    app.get('/api/learning', (_req, res) => {
        res.json(learning.getStats());
    });

    // ─── Start ──────────────────────────────────────────────────
    app.listen(port, () => {
        console.log(chalk.cyan(`\n🧪 VibeAudit Testing UI: http://localhost:${port}\n`));
    });
}

// ─── Analysis Pipeline ──────────────────────────────────────────────

async function runAnalysis(run: AnalysisRun, rpcUrl: string, simulate: boolean): Promise<void> {
    const TOTAL_STEPS = 6;
    const runId = run.id;

    try {
        // Step 1: Gather Intelligence
        sendProgress(runId, 1, TOTAL_STEPS, 'Gathering Intelligence', `Fetching on-chain data for ${run.address}...`);
        const intel = await gatherIntel(run.address, run.chain, rpcUrl);
        run.intel = intel;
        sendEvent(runId, 'intel', {
            contractName: intel.contractName,
            bytecodeSize: intel.bytecodeSize,
            balance: intel.balance,
            hasSource: !!intel.sourceCode,
            isProxy: intel.isProxy,
            tokenInfo: intel.tokenInfo,
            functionsDetected: intel.detectedFunctions.length,
            txCount: intel.totalTxCount,
            deployer: intel.deployer,
            owner: intel.owner,
        });

        const code = getAnalyzableCode(intel);
        const contractName = intel.contractName;
        const ctx = { address: run.address, balance: intel.balance, chain: run.chain };

        // Check learning DB for known bytecode
        const bytecodeHash = crypto.createHash('sha256').update(intel.bytecode).digest('hex');
        const knownPatterns = learning.checkBytecodeMatch(bytecodeHash);
        if (knownPatterns.length > 0) {
            sendEvent(runId, 'known_pattern', { patterns: knownPatterns });
        }

        // Step 2: 4-Layer Analysis
        sendProgress(runId, 2, TOTAL_STEPS, 'Deep Analysis', 'Running contract, process, frontend, bridge analysis...');

        const [contractAnalysis, processFlow, frontendInteraction, bridgeSecurity] = await Promise.all([
            analyzeContractDeep(code, contractName, ctx).catch(err => {
                sendEvent(runId, 'module_error', { module: 'contract-deep', error: err.message });
                return null;
            }),
            analyzeProcessFlow(code, contractName, ctx).catch(err => {
                sendEvent(runId, 'module_error', { module: 'process-flow', error: err.message });
                return null;
            }),
            analyzeFrontendInteraction(code, contractName, ctx).catch(err => {
                sendEvent(runId, 'module_error', { module: 'frontend-interaction', error: err.message });
                return null;
            }),
            analyzeBridgeSecurity(code, contractName, ctx).catch(err => {
                sendEvent(runId, 'module_error', { module: 'bridge-security', error: err.message });
                return null;
            }),
        ]);

        sendEvent(runId, 'analysis_complete', {
            contractDeep: !!contractAnalysis,
            processFlow: !!processFlow,
            frontendInteraction: !!frontendInteraction,
            bridgeSecurity: !!bridgeSecurity,
            contractType: contractAnalysis?.contractType,
            isBridge: bridgeSecurity?.isBridge,
        });

        // Step 3: Extract Findings
        sendProgress(runId, 3, TOTAL_STEPS, 'Extracting Findings', 'AI analyzing for vulnerabilities...');
        const findings = await extractFindings(code, contractName, intel);
        run.findings = findings;
        sendEvent(runId, 'findings', { findings });

        // Step 4: Simulate
        let simReport: SimulationReport | undefined;
        if (findings.length > 0 && simulate && checkFoundryInstalled()) {
            sendProgress(runId, 4, TOTAL_STEPS, 'Simulating Exploits', `Testing ${findings.length} findings on fork...`);
            simReport = await simulateExploits(intel, findings, rpcUrl);
            run.simulationReport = simReport;
            sendEvent(runId, 'simulation', {
                confirmed: simReport.confirmedVulnerabilities,
                denied: simReport.deniedVulnerabilities,
                simulations: simReport.simulations.map(s => ({
                    title: s.finding.title,
                    category: s.finding.category,
                    severity: s.finding.severity,
                    passed: s.passed,
                    duration: s.duration,
                    gasUsed: s.gasUsed,
                })),
            });
        } else {
            sendProgress(runId, 4, TOTAL_STEPS, 'Simulation Skipped',
                !simulate ? 'Disabled by user' :
                    findings.length === 0 ? 'No findings to test' :
                        'Foundry not installed');
        }

        // Step 5: Learn
        sendProgress(runId, 5, TOTAL_STEPS, 'Recording Learning', 'Updating RL database...');
        const contractType = intel.tokenInfo?.standard ||
            (intel.isProxy ? 'Proxy' : (contractAnalysis?.contractType || 'Other'));

        const triageFeatures: Record<string, number> = {
            balance_eth: parseFloat(intel.balance) || 0,
            bytecode_size: intel.bytecodeSize / 10000,
            has_source: intel.sourceCode ? 1 : 0,
            is_proxy: intel.isProxy ? 1 : 0,
            is_token: intel.tokenInfo ? 1 : 0,
        };

        if (simReport) {
            for (const sim of simReport.simulations) {
                learning.recordOutcome({
                    category: sim.finding.category,
                    contractType,
                    wasConfirmed: sim.passed,
                    predictedSeverity: sim.finding.severity,
                    contractAddress: run.address,
                    chain: run.chain,
                    reason: sim.passed
                        ? 'Exploit simulation succeeded on fork'
                        : (sim.error || 'Exploit simulation failed on fork'),
                    features: triageFeatures,
                });
            }

            if (simReport.confirmedVulnerabilities > 0) {
                const confirmedCats = simReport.simulations
                    .filter(s => s.passed).map(s => s.finding.category);
                learning.recordBytecodePattern(
                    bytecodeHash,
                    intel.bytecode.substring(0, 100),
                    run.address, run.chain, confirmedCats,
                    contractAnalysis?.overallRiskScore || 0,
                );
            }
        }

        sendEvent(runId, 'learning', learning.getStats());

        // Step 6: Generate Report
        sendProgress(runId, 6, TOTAL_STEPS, 'Generating Report', 'Creating unified security report...');

        const securityReport = generateSecurityReport(
            run.address,
            run.chain,
            contractAnalysis || { contractName, contractType: 'Other', tokenCompliance: { standard: 'none', deviations: [], missingEvents: [], edgeCaseRisks: [] }, upgradeMechanics: { isUpgradeable: false, proxyPattern: 'none', storageRisks: [], initGuards: [], adminControl: 'unknown' }, accessControl: { roles: [], ownershipTransfer: 'none', timelocks: [], unprotectedFunctions: [] }, fundFlow: { entryPoints: [], exitPoints: [], internalTransfers: [], feeStructure: 'unknown', emergencyWithdraw: false }, dependencies: { externalContracts: [], oracleReliance: [], approvalPatterns: [], libraryUsage: [] }, overallRiskScore: 0, summary: 'Analysis incomplete' },
            processFlow || { contractName, states: [], transitions: [], userJourneys: [], orderingRisks: [], timeDependencies: [], economicFlows: [], mermaidDiagram: '', riskScore: 0, summary: 'Analysis incomplete' },
            frontendInteraction || { contractName, abiSurface: { readFunctions: [], writeFunctions: [], adminFunctions: [], totalFunctions: 0, complexityScore: 0 }, approvalChains: [], txOrderingRisks: [], gasCostPatterns: [], phishingVectors: [], eventReliance: [], riskScore: 0, summary: 'Analysis incomplete' },
            bridgeSecurity || { contractName, isBridge: false, bridgeType: 'none', messageVerification: { mechanism: 'N/A', validators: 'N/A', thresholdScheme: 'N/A', replayProtection: false, risks: [] }, lockMintMechanics: { lockFunction: '', mintFunction: '', burnFunction: '', unlockFunction: '', atomicity: 'N/A', drainRisks: [], spoofRisks: [] }, finalityRisks: [], adminKeyRisks: [], liquidityPoolRisks: [], knownExploitPatterns: [], riskScore: 0, summary: 'Not a bridge' },
        );

        run.securityReport = securityReport;
        const filepath = saveReport(securityReport);

        run.status = 'complete';
        run.completedAt = new Date().toISOString();

        sendEvent(runId, 'complete', {
            riskScore: securityReport.overallRiskScore,
            contractName,
            contractType: contractAnalysis?.contractType || 'Unknown',
            summary: contractAnalysis?.summary || 'Analysis complete',
            filepath,
            confirmed: simReport?.confirmedVulnerabilities || 0,
            denied: simReport?.deniedVulnerabilities || 0,
            duration: Date.now() - new Date(run.startedAt).getTime(),
        });

    } catch (err) {
        run.status = 'error';
        run.error = (err as Error).message;
        sendEvent(runId, 'error', { message: (err as Error).message });
    }
}

// ─── HTML Template ──────────────────────────────────────────────────

function generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeAudit — Security Intelligence Testing</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #06060b;
            --bg-secondary: #0c0c14;
            --bg-card: #10101c;
            --bg-card-hover: #14142a;
            --bg-input: #0e0e1a;
            --border: #1a1a30;
            --border-focus: #6366f1;
            --text: #e4e4f0;
            --text-dim: #6b6b8a;
            --text-muted: #44445a;
            --accent: #6366f1;
            --accent-glow: rgba(99, 102, 241, 0.15);
            --green: #10b981;
            --green-dim: rgba(16, 185, 129, 0.12);
            --red: #ef4444;
            --red-dim: rgba(239, 68, 68, 0.12);
            --yellow: #f59e0b;
            --yellow-dim: rgba(245, 158, 11, 0.12);
            --orange: #f97316;
            --blue: #3b82f6;
            --blue-dim: rgba(59, 130, 246, 0.12);
            --purple: #a855f7;
            --cyan: #06b6d4;
            --gradient-accent: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
            --gradient-bg: linear-gradient(180deg, #06060b 0%, #0c0c14 100%);
            --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
            --shadow-glow: 0 0 40px rgba(99,102,241,0.08);
            --radius: 12px;
            --radius-sm: 8px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ─── Header ──────────────────────────── */
        .header {
            padding: 28px 40px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-secondary);
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(12px);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .logo-icon {
            width: 42px;
            height: 42px;
            background: var(--gradient-accent);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 16px rgba(99,102,241,0.25);
        }

        .logo h1 {
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            background: var(--gradient-accent);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo span {
            font-size: 0.78rem;
            color: var(--text-dim);
            display: block;
            margin-top: 1px;
        }

        .header-stats {
            display: flex;
            gap: 24px;
        }

        .header-stat {
            text-align: right;
        }

        .header-stat-value {
            font-size: 1.4rem;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }

        .header-stat-label {
            font-size: 0.72rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        /* ─── Main Layout ─────────────────────── */
        .container {
            max-width: 1360px;
            margin: 0 auto;
            padding: 32px 40px;
        }

        /* ─── Analyze Panel ───────────────────── */
        .analyze-panel {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 28px;
            box-shadow: var(--shadow-glow);
        }

        .analyze-panel h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 180px 1fr auto;
            gap: 12px;
            align-items: end;
        }

        .form-group label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
            font-weight: 500;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 12px 16px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.88rem;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }

        .form-group input:focus, .form-group select:focus {
            border-color: var(--border-focus);
            box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .form-group input::placeholder {
            color: var(--text-muted);
        }

        .btn-analyze {
            padding: 12px 28px;
            background: var(--gradient-accent);
            border: none;
            border-radius: var(--radius-sm);
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.2s;
            letter-spacing: 0.01em;
            white-space: nowrap;
        }

        .btn-analyze:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99,102,241,0.35);
        }

        .btn-analyze:active { transform: translateY(0); }
        .btn-analyze:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .options-row {
            display: flex;
            gap: 20px;
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid var(--border);
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            color: var(--text-dim);
            cursor: pointer;
        }

        .checkbox-label input {
            accent-color: var(--accent);
            width: 16px;
            height: 16px;
        }

        /* ─── Progress Panel ──────────────────── */
        .progress-panel {
            display: none;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 28px;
        }

        .progress-panel.active { display: block; }

        .progress-bar-container {
            height: 6px;
            background: var(--bg-input);
            border-radius: 3px;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: var(--gradient-accent);
            border-radius: 3px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
        }

        .progress-steps {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
        }

        .step {
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 12px;
            text-align: center;
            transition: all 0.3s;
        }

        .step.active {
            border-color: var(--accent);
            background: var(--accent-glow);
        }

        .step.complete {
            border-color: var(--green);
            background: var(--green-dim);
        }

        .step.error {
            border-color: var(--red);
            background: var(--red-dim);
        }

        .step-icon { font-size: 1.4rem; margin-bottom: 4px; }
        .step-label { font-size: 0.72rem; color: var(--text-dim); font-weight: 500; }
        .step.active .step-label { color: var(--accent); }
        .step.complete .step-label { color: var(--green); }

        /* ─── Results Panel ───────────────────── */
        .results-panel {
            display: none;
        }

        .results-panel.active { display: block; }

        .result-header {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .risk-score {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 800;
            font-size: 2rem;
            position: relative;
        }

        .risk-score::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            padding: 3px;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
        }

        .risk-critical { color: var(--red); }
        .risk-critical::before { background: var(--red); }
        .risk-high { color: var(--orange); }
        .risk-high::before { background: var(--orange); }
        .risk-medium { color: var(--yellow); }
        .risk-medium::before { background: var(--yellow); }
        .risk-low { color: var(--green); }
        .risk-low::before { background: var(--green); }

        .risk-score small {
            font-size: 0.65rem;
            font-weight: 500;
            color: var(--text-dim);
            margin-top: 2px;
        }

        .result-info {
            flex: 1;
            margin-left: 28px;
        }

        .result-info h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .result-info .contract-address {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.82rem;
            color: var(--accent);
        }

        .result-info .result-meta {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }

        .result-meta-item {
            font-size: 0.78rem;
            color: var(--text-dim);
        }

        .result-meta-item strong {
            color: var(--text);
        }

        .result-sim {
            text-align: right;
        }

        .sim-stat {
            margin-bottom: 6px;
        }

        .sim-stat span {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 1.3rem;
        }

        .sim-stat small {
            display: block;
            font-size: 0.7rem;
            color: var(--text-dim);
            text-transform: uppercase;
        }

        /* ─── Findings ────────────────────────── */
        .section {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 16px;
        }

        .section h3 {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .finding {
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 16px;
            margin-bottom: 10px;
            transition: background 0.15s;
        }

        .finding:hover { background: var(--bg-card-hover); }

        .finding-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .finding-title {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .badge-critical { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
        .badge-high { background: rgba(249,115,22,0.12); color: var(--orange); border: 1px solid rgba(249,115,22,0.3); }
        .badge-medium { background: var(--yellow-dim); color: var(--yellow); border: 1px solid rgba(245,158,11,0.3); }
        .badge-low { background: var(--green-dim); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
        .badge-info { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(59,130,246,0.3); }
        .badge-confirmed { background: var(--red-dim); color: var(--red); }
        .badge-denied { background: var(--green-dim); color: var(--green); }

        .finding-desc {
            font-size: 0.82rem;
            color: var(--text-dim);
            line-height: 1.5;
        }

        .finding-meta {
            display: flex;
            gap: 16px;
            margin-top: 8px;
            font-size: 0.75rem;
            color: var(--text-muted);
        }

        /* ─── Intel Grid ──────────────────────── */
        .intel-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
        }

        .intel-item {
            background: var(--bg-input);
            border-radius: var(--radius-sm);
            padding: 14px;
        }

        .intel-item-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .intel-item-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.88rem;
            font-weight: 600;
            word-break: break-all;
        }

        /* ─── History ─────────────────────────── */
        .history-panel {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-top: 28px;
        }

        .history-item {
            display: grid;
            grid-template-columns: 1fr 100px 100px 80px 80px;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
            font-size: 0.82rem;
            cursor: pointer;
            transition: background 0.15s;
        }

        .history-item:hover { background: var(--bg-card-hover); border-radius: var(--radius-sm); padding: 12px 8px; margin: 0 -8px; }
        .history-item:last-child { border-bottom: none; }

        .history-address {
            font-family: 'JetBrains Mono', monospace;
            color: var(--accent);
        }

        /* ─── Animations ──────────────────────── */
        @keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.5; } }
        .pulsing { animation: pulse 1.5s infinite; }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slideIn 0.3s ease-out; }

        /* ─── Responsive ──────────────────────── */
        @media (max-width: 900px) {
            .form-row { grid-template-columns: 1fr; }
            .progress-steps { grid-template-columns: repeat(3, 1fr); }
            .result-header { flex-direction: column; text-align: center; }
            .result-info { margin-left: 0; margin-top: 16px; }
            .result-sim { margin-top: 16px; }
            .header { flex-direction: column; gap: 16px; }
            .container { padding: 16px; }
            .history-item { grid-template-columns: 1fr 80px; }
        }
    </style>
</head>
<body>

<header class="header">
    <div class="logo">
        <div class="logo-icon">🛡️</div>
        <div>
            <h1>VibeAudit</h1>
            <span>Security Intelligence Testing Console</span>
        </div>
    </div>
    <div class="header-stats" id="headerStats">
        <div class="header-stat">
            <div class="header-stat-value" id="statAnalyses">0</div>
            <div class="header-stat-label">Analyses Run</div>
        </div>
        <div class="header-stat">
            <div class="header-stat-value" style="color:var(--red)" id="statConfirmed">0</div>
            <div class="header-stat-label">Vulns Confirmed</div>
        </div>
        <div class="header-stat">
            <div class="header-stat-value" style="color:var(--green)" id="statAccuracy">0%</div>
            <div class="header-stat-label">RL Accuracy</div>
        </div>
    </div>
</header>

<div class="container">

    <!-- Analyze Panel -->
    <div class="analyze-panel" id="analyzePanel">
        <h2>🔍 Analyze Contract</h2>
        <div class="form-row">
            <div class="form-group">
                <label>Contract Address</label>
                <input type="text" id="inputAddress" placeholder="0x..." />
            </div>
            <div class="form-group">
                <label>Chain</label>
                <select id="inputChain">
                    <option value="ethereum">Ethereum</option>
                    <option value="sepolia">Sepolia</option>
                    <option value="bsc">BSC</option>
                    <option value="bsc-testnet">BSC Testnet</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="base">Base</option>
                </select>
            </div>
            <div class="form-group">
                <label>RPC URL (optional override)</label>
                <input type="text" id="inputRpc" placeholder="Leave blank for default" />
            </div>
            <button class="btn-analyze" id="btnAnalyze" onclick="startAnalysis()">
                ⚡ Analyze
            </button>
        </div>
        <div class="options-row">
            <label class="checkbox-label">
                <input type="checkbox" id="optSimulate" checked />
                Fork-based exploit simulation
            </label>
        </div>
    </div>

    <!-- Progress Panel -->
    <div class="progress-panel" id="progressPanel">
        <div class="progress-bar-container">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="progress-steps" id="progressSteps">
            <div class="step" id="step1"><div class="step-icon">📡</div><div class="step-label">Intel</div></div>
            <div class="step" id="step2"><div class="step-icon">📊</div><div class="step-label">Analysis</div></div>
            <div class="step" id="step3"><div class="step-icon">🧪</div><div class="step-label">Findings</div></div>
            <div class="step" id="step4"><div class="step-icon">⚔️</div><div class="step-label">Simulate</div></div>
            <div class="step" id="step5"><div class="step-icon">🧠</div><div class="step-label">Learning</div></div>
            <div class="step" id="step6"><div class="step-icon">📄</div><div class="step-label">Report</div></div>
        </div>
    </div>

    <!-- Results Panel -->
    <div class="results-panel" id="resultsPanel"></div>

    <!-- History Panel -->
    <div class="history-panel">
        <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:16px">📜 Analysis History</h3>
        <div id="historyList"><span style="color:var(--text-muted);font-size:0.82rem">No analyses yet. Enter a contract address above to begin.</span></div>
    </div>

</div>

<script>
let currentRunId = null;
let currentEventSource = null;
let analysisData = {};

async function startAnalysis() {
    const address = document.getElementById('inputAddress').value.trim();
    const chain = document.getElementById('inputChain').value;
    const rpcUrl = document.getElementById('inputRpc').value.trim() || undefined;
    const simulate = document.getElementById('optSimulate').checked;

    if (!address || !address.startsWith('0x') || address.length < 10) {
        alert('Please enter a valid contract address (0x...)');
        return;
    }

    document.getElementById('btnAnalyze').disabled = true;
    document.getElementById('progressPanel').classList.add('active');
    document.getElementById('resultsPanel').classList.remove('active');
    resetSteps();
    analysisData = {};

    try {
        const resp = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, chain, rpcUrl, simulate }),
        });

        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        currentRunId = data.runId;
        connectSSE(data.runId);
    } catch (err) {
        alert('Failed to start analysis: ' + err.message);
        document.getElementById('btnAnalyze').disabled = false;
    }
}

function connectSSE(runId) {
    if (currentEventSource) currentEventSource.close();
    currentEventSource = new EventSource('/api/stream/' + runId);

    currentEventSource.addEventListener('progress', (e) => {
        const d = JSON.parse(e.data);
        updateStep(d.step, 'active', d.label);
        for (let i = 1; i < d.step; i++) updateStep(i, 'complete');
        document.getElementById('progressBar').style.width = ((d.step / 6) * 100) + '%';
    });

    currentEventSource.addEventListener('intel', (e) => {
        analysisData.intel = JSON.parse(e.data);
    });

    currentEventSource.addEventListener('findings', (e) => {
        analysisData.findings = JSON.parse(e.data).findings;
    });

    currentEventSource.addEventListener('simulation', (e) => {
        analysisData.simulation = JSON.parse(e.data);
    });

    currentEventSource.addEventListener('learning', (e) => {
        analysisData.learning = JSON.parse(e.data);
        const stats = analysisData.learning;
        document.getElementById('statAccuracy').textContent = (stats.overallAccuracy * 100).toFixed(1) + '%';
    });

    currentEventSource.addEventListener('complete', (e) => {
        const d = JSON.parse(e.data);
        analysisData.result = d;
        for (let i = 1; i <= 6; i++) updateStep(i, 'complete');
        document.getElementById('progressBar').style.width = '100%';
        renderResults(d);
        document.getElementById('btnAnalyze').disabled = false;
        loadHistory();
        currentEventSource.close();
    });

    currentEventSource.addEventListener('error', (e) => {
        try {
            const d = JSON.parse(e.data);
            alert('Analysis error: ' + d.message);
        } catch {}
        document.getElementById('btnAnalyze').disabled = false;
        currentEventSource.close();
    });
}

function resetSteps() {
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById('step' + i);
        el.className = 'step';
    }
    document.getElementById('progressBar').style.width = '0%';
}

function updateStep(n, state, label) {
    const el = document.getElementById('step' + n);
    el.className = 'step ' + state;
}

function renderResults(data) {
    const panel = document.getElementById('resultsPanel');
    panel.classList.add('active');

    const riskClass = data.riskScore >= 80 ? 'critical' : data.riskScore >= 60 ? 'high' : data.riskScore >= 40 ? 'medium' : 'low';
    const riskLabel = data.riskScore >= 80 ? 'CRITICAL' : data.riskScore >= 60 ? 'HIGH' : data.riskScore >= 40 ? 'MEDIUM' : data.riskScore >= 20 ? 'LOW' : 'MINIMAL';

    const intel = analysisData.intel || {};
    const findings = analysisData.findings || [];
    const sim = analysisData.simulation || {};
    const duration = data.duration ? (data.duration / 1000).toFixed(1) + 's' : '-';

    let html = '';

    // Result header
    html += '<div class="result-header slide-in">';
    html += '<div class="risk-score risk-' + riskClass + '">' + data.riskScore + '<small>/' + '100</small></div>';
    html += '<div class="result-info">';
    html += '<h3>' + (data.contractName || 'Unknown') + '</h3>';
    html += '<div class="contract-address">' + document.getElementById('inputAddress').value + '</div>';
    html += '<div class="result-meta">';
    html += '<div class="result-meta-item"><strong>' + (data.contractType || '-') + '</strong> type</div>';
    html += '<div class="result-meta-item"><strong>' + (intel.balance || '-') + '</strong> ETH</div>';
    html += '<div class="result-meta-item"><strong>' + duration + '</strong> duration</div>';
    html += '<div class="result-meta-item">' + (intel.hasSource ? '✅ Source' : '⚠️ Bytecode-only') + '</div>';
    html += '</div></div>';

    html += '<div class="result-sim">';
    html += '<div class="sim-stat"><span style="color:var(--red)">' + (data.confirmed || 0) + '</span><small>Confirmed</small></div>';
    html += '<div class="sim-stat"><span style="color:var(--green)">' + (data.denied || 0) + '</span><small>Denied</small></div>';
    html += '</div>';
    html += '</div>';

    // Intel
    if (intel.contractName) {
        html += '<div class="section slide-in"><h3>📡 Contract Intelligence</h3>';
        html += '<div class="intel-grid">';
        html += intelItem('Contract Name', intel.contractName);
        html += intelItem('Bytecode Size', (intel.bytecodeSize || '-') + ' bytes');
        html += intelItem('Balance', (intel.balance || '0') + ' ETH');
        html += intelItem('Functions', intel.functionsDetected || '-');
        html += intelItem('Total Txs', intel.txCount || '-');
        html += intelItem('Proxy', intel.isProxy ? 'Yes' : 'No');
        html += intelItem('Token', intel.tokenInfo ? (intel.tokenInfo.standard + ' ' + (intel.tokenInfo.symbol || '')) : 'No');
        html += intelItem('Owner', intel.owner ? intel.owner.substring(0, 14) + '...' : 'N/A');
        html += intelItem('Deployer', intel.deployer ? intel.deployer.substring(0, 14) + '...' : 'N/A');
        html += '</div></div>';
    }

    // Findings
    if (findings.length > 0) {
        html += '<div class="section slide-in"><h3>🧪 Vulnerability Findings (' + findings.length + ')</h3>';
        findings.forEach((f, i) => {
            const simResult = sim.simulations ? sim.simulations.find(s => s.title === f.title) : null;
            const badgeClass = 'badge-' + (f.severity || 'info').toLowerCase();
            html += '<div class="finding">';
            html += '<div class="finding-header">';
            html += '<span class="finding-title">' + f.title + '</span>';
            html += '<div>';
            html += '<span class="badge ' + badgeClass + '">' + f.severity + '</span> ';
            if (simResult) {
                html += '<span class="badge ' + (simResult.passed ? 'badge-confirmed' : 'badge-denied') + '">' + (simResult.passed ? '✗ CONFIRMED' : '✓ SAFE') + '</span>';
            }
            html += '</div></div>';
            html += '<div class="finding-desc">' + (f.description || '') + '</div>';
            html += '<div class="finding-meta">';
            html += '<span>Category: ' + (f.category || '-') + '</span>';
            if (f.affectedFunction) html += '<span>Function: ' + f.affectedFunction + '</span>';
            if (simResult && simResult.duration) html += '<span>Sim: ' + (simResult.duration/1000).toFixed(1) + 's</span>';
            html += '</div></div>';
        });
        html += '</div>';
    }

    // Summary
    html += '<div class="section slide-in"><h3>📋 Summary</h3>';
    html += '<p style="color:var(--text-dim);line-height:1.6;font-size:0.88rem">' + (data.summary || 'Analysis complete.') + '</p>';
    if (data.filepath) {
        html += '<p style="margin-top:12px;font-size:0.82rem;color:var(--text-muted)">Full report saved: <code style="color:var(--accent)">' + data.filepath + '</code></p>';
    }
    html += '</div>';

    panel.innerHTML = html;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('statAnalyses').textContent = parseInt(document.getElementById('statAnalyses').textContent) + 1;
    if (data.confirmed) {
        document.getElementById('statConfirmed').textContent = parseInt(document.getElementById('statConfirmed').textContent) + data.confirmed;
    }
}

function intelItem(label, value) {
    return '<div class="intel-item"><div class="intel-item-label">' + label + '</div><div class="intel-item-value">' + value + '</div></div>';
}

async function loadHistory() {
    try {
        const resp = await fetch('/api/history');
        const history = await resp.json();
        const el = document.getElementById('historyList');
        if (history.length === 0) {
            el.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem">No analyses yet.</span>';
            return;
        }
        el.innerHTML = history.map(h => {
            const riskClass = h.riskScore >= 80 ? 'var(--red)' : h.riskScore >= 60 ? 'var(--orange)' : h.riskScore >= 40 ? 'var(--yellow)' : 'var(--green)';
            return '<div class="history-item">' +
                '<div><span class="history-address">' + h.address.substring(0, 16) + '...</span> <span style="color:var(--text-dim);margin-left:8px">' + (h.contractName || '') + '</span></div>' +
                '<div style="color:var(--text-dim)">' + h.chain + '</div>' +
                '<div style="font-weight:700;color:' + riskClass + ';font-family:JetBrains Mono,monospace">' + (h.riskScore !== undefined ? h.riskScore + '/100' : '-') + '</div>' +
                '<div style="color:var(--green);font-size:0.78rem">' + (h.confirmed !== undefined ? '✗' + h.confirmed + ' ✓' + h.denied : '-') + '</div>' +
                '<div><span class="badge badge-' + (h.status === 'complete' ? 'low' : h.status === 'error' ? 'critical' : 'info') + '">' + h.status + '</span></div>' +
                '</div>';
        }).join('');
    } catch {}
}

// Load history and learning stats on page load
loadHistory();
fetch('/api/learning').then(r => r.json()).then(stats => {
    document.getElementById('statAccuracy').textContent = (stats.overallAccuracy * 100).toFixed(1) + '%';
    document.getElementById('statAnalyses').textContent = stats.totalPredictions || 0;
    document.getElementById('statConfirmed').textContent = stats.totalConfirmed || 0;
}).catch(() => {});
</script>

</body>
</html>`;
}
