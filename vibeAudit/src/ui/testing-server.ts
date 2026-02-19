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
import { LearningEngine } from '../agent/learning';
import { checkFoundryInstalled, getDefaultRpc } from '../utils';
import { ReActEngine } from '../agent/react/loop';
import { AttackStrategist } from '../agent/react/strategist';

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
    reactStatus?: string;
    reactDetails?: string;
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
            riskScore: r.reactStatus === 'exploited' ? 100 : (r.reactStatus === 'secure' ? 10 : 50),
            contractName: r.intel?.contractName,
            confirmed: r.reactStatus === 'exploited' ? 1 : 0,
            denied: r.reactStatus === 'secure' ? 1 : 0,
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
    const runId = run.id;

    try {
        sendProgress(runId, 1, 3, 'Initializing Agent', `Starting ReAct engine for ${run.address}...`);

        // 1. Optional: Gather initial intel for the UI (not strictly required by ReAct, but good for dashboard)
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

        // 2. Generate Initial Attack Plan (Strategist)
        sendProgress(runId, 2, 3, 'Planning', `Building attack tree...`);
        const strategist = new AttackStrategist();
        const plan = await strategist.generateInitialPlan(run.address, run.chain);
        sendEvent(runId, 'plan', { plan: plan.prioritizedVectors });

        // 3. ReAct Loop Execution
        sendProgress(runId, 3, 3, 'Agent Execution', 'Executing ReAct Loop...');
        const engine = new ReActEngine();

        // Stream thoughts, actions, and observations to the UI!
        engine.onThought = (thought) => {
            sendEvent(runId, 'thought', { text: thought });
        };
        engine.onAction = (actionName, args) => {
            sendEvent(runId, 'action', { name: actionName, args });
        };
        engine.onObservation = (observation) => {
            // Truncate observation for UI if huge
            const safeObs = observation.length > 2000 ? observation.substring(0, 2000) + '...[Truncated]' : observation;
            sendEvent(runId, 'observation', { text: safeObs });
        };

        const result = await engine.run(run.address, run.chain);

        // Map ReAct result back to the old UI formats for now, or just send a completion event
        run.status = 'complete';
        run.completedAt = new Date().toISOString();

        sendEvent(runId, 'analysis_complete', {
            status: result.status,
            details: result.details,
            isExploited: result.status === 'exploited'
        });

    } catch (error) {
        console.error(chalk.red(`\n❌ Analysis Error:`), error);
        run.status = 'error';
        run.error = (error as Error).message;
        sendEvent(runId, 'error', { message: (error as Error).message });
    }
}

// ─── Frontend HTML ──────────────────────────────────────────────────

function generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeAudit — Security Intelligence Testing</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        /* ─── VibeLab Design System Tokens ────── */
        :root {
            --background: #000000;
            --background-elevated: #0a0a0a;
            --background-card: rgba(255,255,255,0.03);
            --foreground: #ffffff;
            --foreground-secondary: #999999;
            --foreground-muted: #666666;
            --accent: #0066FF;
            --accent-secondary: #8B5CF6;
            --border: rgba(255,255,255,0.1);
            --border-hover: rgba(255,255,255,0.2);
            --green: #10b981;
            --green-dim: rgba(16, 185, 129, 0.1);
            --red: #ef4444;
            --red-dim: rgba(239, 68, 68, 0.1);
            --yellow: #f59e0b;
            --yellow-dim: rgba(245, 158, 11, 0.1);
            --orange: #f97316;
            --blue: #0066FF;
            --blue-dim: rgba(0, 102, 255, 0.1);
            --radius-sm: 12px;
            --radius-md: 20px;
            --radius-lg: 28px;
            --radius-pill: 9999px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--background);
            color: var(--foreground);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ─── Header / Navbar ─────────────────── */
        .header {
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: transparent;
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(16px);
            background: rgba(0,0,0,0.8);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 36px;
            height: 36px;
            background: var(--foreground);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .logo h1 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--foreground);
            letter-spacing: -0.02em;
        }

        .logo span {
            font-size: 0.75rem;
            color: var(--foreground-muted);
            display: block;
            margin-top: 1px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .header-stats {
            display: flex;
            gap: 32px;
        }

        .header-stat {
            text-align: right;
        }

        .header-stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }

        .header-stat-label {
            font-size: 0.75rem;
            color: var(--foreground-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 500;
        }

        /* ─── Main Layout ─────────────────────── */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 48px 2rem;
        }

        /* ─── Hero Section ────────────────────── */
        .hero {
            text-align: center;
            padding-bottom: 48px;
        }

        .hero h2 {
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 400;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
        }

        .hero h2 em {
            font-style: italic;
        }

        .hero p {
            color: var(--foreground-secondary);
            font-size: 1rem;
            max-width: 520px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* ─── Card (Standard) ─────────────────── */
        .card {
            background: var(--background-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 32px;
            margin-bottom: 24px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-interactive {
            cursor: pointer;
        }

        .card-interactive:hover {
            transform: translateY(-2px);
            border-color: var(--border-hover);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* ─── Buttons ─────────────────────────── */
        .btn-primary {
            padding: 0.875rem 1.5rem;
            background: var(--foreground);
            border: none;
            border-radius: var(--radius-pill);
            color: #000000;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing: -0.01em;
            white-space: nowrap;
            font-family: "Inter", sans-serif;
        }

        .btn-primary:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(255,255,255,0.15);
        }

        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }

        .btn-secondary {
            padding: 0.875rem 1.5rem;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: var(--radius-pill);
            color: var(--foreground);
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: "Inter", sans-serif;
        }

        .btn-secondary:hover {
            background: rgba(255,255,255,0.05);
            border-color: var(--border-hover);
        }

        /* ─── Inputs ──────────────────────────── */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 180px 1fr auto;
            gap: 16px;
            align-items: end;
        }

        .form-group label {
            display: block;
            font-size: 0.75rem;
            color: var(--foreground-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 0.875rem 1rem;
            background: var(--background-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            color: var(--foreground);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.875rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
        }

        .form-group input:focus, .form-group select:focus {
            border-color: var(--border-hover);
            box-shadow: 0 0 0 3px rgba(0,102,255,0.1);
        }

        .form-group input::placeholder {
            color: var(--foreground-muted);
        }

        .options-row {
            display: flex;
            gap: 24px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            color: var(--foreground-secondary);
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
        }

        .progress-panel.active { display: block; }

        .progress-bar-container {
            height: 4px;
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: var(--accent);
            border-radius: 2px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
        }

        .progress-steps {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
        }

        .step {
            background: var(--background-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 16px 12px;
            text-align: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step.active {
            border-color: var(--accent);
            background: rgba(0,102,255,0.08);
        }

        .step.complete {
            border-color: var(--green);
            background: var(--green-dim);
        }

        .step.error {
            border-color: var(--red);
            background: var(--red-dim);
        }

        .step-icon { font-size: 1.5rem; margin-bottom: 6px; }
        .step-label { font-size: 0.75rem; color: var(--foreground-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
        .step.active .step-label { color: var(--accent); }
        .step.complete .step-label { color: var(--green); }

        /* ─── Results ─────────────────────────── */
        .results-panel { display: none; }
        .results-panel.active { display: block; }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .risk-score {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 800;
            font-size: 2rem;
            position: relative;
            flex-shrink: 0;
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

        .risk-score small { font-size: 0.65rem; font-weight: 500; color: var(--foreground-muted); margin-top: 2px; }

        .result-info { flex: 1; margin-left: 32px; }
        .result-info h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px; }
        .result-info .contract-address { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: var(--accent); }
        .result-info .result-meta { display: flex; gap: 24px; margin-top: 12px; }
        .result-meta-item { font-size: 0.875rem; color: var(--foreground-secondary); }
        .result-meta-item strong { color: var(--foreground); }

        .result-sim { text-align: right; }
        .sim-stat { margin-bottom: 8px; }
        .sim-stat span { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 1.25rem; }
        .sim-stat small { display: block; font-size: 0.75rem; color: var(--foreground-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }

        /* ─── Findings ────────────────────────── */
        .finding {
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 20px;
            margin-bottom: 12px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .finding:hover {
            background: rgba(255,255,255,0.02);
            transform: translateY(-1px);
        }

        .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .finding-title { font-weight: 600; font-size: 1rem; }

        /* ─── Badges ──────────────────────────── */
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: var(--radius-pill);
            font-size: 0.75rem;
            font-weight: 500;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }

        .badge-accent { background: rgba(0,102,255,0.1); border: 1px solid rgba(0,102,255,0.2); color: var(--accent); }
        .badge-critical { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
        .badge-high { background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); }
        .badge-medium { background: var(--yellow-dim); color: var(--yellow); border: 1px solid rgba(245,158,11,0.2); }
        .badge-low { background: var(--green-dim); color: var(--green); border: 1px solid rgba(16,185,129,0.2); }
        .badge-info { background: var(--blue-dim); color: var(--accent); border: 1px solid rgba(0,102,255,0.2); }
        .badge-confirmed { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
        .badge-denied { background: var(--green-dim); color: var(--green); border: 1px solid rgba(16,185,129,0.2); }

        .finding-desc { font-size: 0.875rem; color: var(--foreground-secondary); line-height: 1.6; }
        .finding-meta { display: flex; gap: 20px; margin-top: 10px; font-size: 0.75rem; color: var(--foreground-muted); font-weight: 500; }

        /* ─── Intel Grid ──────────────────────── */
        .intel-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
        }

        .intel-item {
            background: var(--background-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 16px;
        }

        .intel-item-label { font-size: 0.75rem; color: var(--foreground-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 500; }
        .intel-item-value { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; font-weight: 600; word-break: break-all; }

        /* ─── History ─────────────────────────── */
        .history-item {
            display: grid;
            grid-template-columns: 1fr 100px 100px 80px 80px;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .history-item:hover {
            background: rgba(255,255,255,0.02);
            border-radius: var(--radius-sm);
            padding: 16px 12px;
            margin: 0 -12px;
        }

        .history-item:last-child { border-bottom: none; }
        .history-address { font-family: 'JetBrains Mono', monospace; color: var(--accent); }

        /* ─── Animations ──────────────────────── */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.4s ease-out; }

        @keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.5; } }
        .pulsing { animation: pulse 1.5s infinite; }

        /* ─── Responsive ──────────────────────── */
        @media (max-width: 900px) {
            .form-row { grid-template-columns: 1fr; }
            .progress-steps { grid-template-columns: repeat(3, 1fr); }
            .result-header { flex-direction: column; text-align: center; gap: 24px; }
            .result-info { margin-left: 0; }
            .result-sim { margin-top: 16px; }
            .header { flex-direction: column; gap: 16px; }
            .container { padding: 24px 1rem; }
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
            <span>Security Intelligence</span>
        </div>
    </div>
    <div class="header-stats" id="headerStats">
        <div class="header-stat">
            <div class="header-stat-value" id="statAnalyses">0</div>
            <div class="header-stat-label">Analyses</div>
        </div>
        <div class="header-stat">
            <div class="header-stat-value" style="color:var(--red)" id="statConfirmed">0</div>
            <div class="header-stat-label">Confirmed</div>
        </div>
        <div class="header-stat">
            <div class="header-stat-value" style="color:var(--green)" id="statAccuracy">0%</div>
            <div class="header-stat-label">Accuracy</div>
        </div>
    </div>
</header>

<div class="container">

    <!-- Hero -->
    <div class="hero">
        <h2>Analyze contracts <em>intelligently</em></h2>
        <p>Enter any deployed contract address to run the full 6-step autonomous security intelligence pipeline.</p>
    </div>

    <!-- Analyze Card -->
    <div class="card" id="analyzePanel">
        <h3>🔍 Analyze Contract</h3>
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
                    <option disabled>──────────</option>
                    <option value="solana">Solana</option>
                    <option value="solana-devnet">Solana Devnet</option>
                    <option disabled>──────────</option>
                    <option value="sui">SUI</option>
                    <option value="sui-testnet">SUI Testnet</option>
                </select>
            </div>
            <div class="form-group">
                <label>RPC URL (optional)</label>
                <input type="text" id="inputRpc" placeholder="Leave blank for default" />
            </div>
            <button class="btn-primary" id="btnAnalyze" onclick="startAnalysis()">
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

    <!-- Progress Card -->
    <div class="card progress-panel" id="progressPanel">
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

    <!-- Results -->
    <div class="results-panel" id="resultsPanel"></div>

    <!-- History -->
    <div class="card">
        <h3>📜 Analysis History</h3>
        <div id="historyList"><span style="color:var(--foreground-muted);font-size:0.875rem">No analyses yet. Enter a contract address above to begin.</span></div>
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
        document.getElementById('step' + i).className = 'step';
    }
    document.getElementById('progressBar').style.width = '0%';
}

function updateStep(n, state) {
    document.getElementById('step' + n).className = 'step ' + state;
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

    // Result header card
    html += '<div class="card fade-in">';
    html += '<div class="result-header">';
    html += '<div class="risk-score risk-' + riskClass + '">' + data.riskScore + '<small>/100</small></div>';
    html += '<div class="result-info">';
    html += '<h3>' + (data.contractName || 'Unknown') + ' <span class="badge badge-accent">' + riskLabel + '</span></h3>';
    html += '<div class="contract-address">' + document.getElementById('inputAddress').value + '</div>';
    html += '<div class="result-meta">';
    html += '<div class="result-meta-item"><strong>' + (data.contractType || '-') + '</strong> type</div>';
    html += '<div class="result-meta-item"><strong>' + (intel.balance || '-') + '</strong> ETH</div>';
    html += '<div class="result-meta-item"><strong>' + duration + '</strong> duration</div>';
    html += '<div class="result-meta-item">' + (intel.hasSource ? '✅ Source verified' : '⚠️ Bytecode only') + '</div>';
    html += '</div></div>';
    html += '<div class="result-sim">';
    html += '<div class="sim-stat"><span style="color:var(--red)">' + (data.confirmed || 0) + '</span><small>Confirmed</small></div>';
    html += '<div class="sim-stat"><span style="color:var(--green)">' + (data.denied || 0) + '</span><small>Denied</small></div>';
    html += '</div>';
    html += '</div></div>';

    // Intel card
    if (intel.contractName) {
        html += '<div class="card fade-in"><h3>📡 Contract Intelligence</h3>';
        html += '<div class="intel-grid">';
        html += intelItem('Contract', intel.contractName);
        html += intelItem('Bytecode', (intel.bytecodeSize || '-') + ' bytes');
        html += intelItem('Balance', (intel.balance || '0') + ' ETH');
        html += intelItem('Functions', intel.functionsDetected || '-');
        html += intelItem('Total Txs', intel.txCount || '-');
        html += intelItem('Proxy', intel.isProxy ? 'Yes' : 'No');
        html += intelItem('Token', intel.tokenInfo ? (intel.tokenInfo.standard + ' ' + (intel.tokenInfo.symbol || '')) : 'No');
        html += intelItem('Owner', intel.owner ? intel.owner.substring(0, 14) + '...' : 'N/A');
        html += intelItem('Deployer', intel.deployer ? intel.deployer.substring(0, 14) + '...' : 'N/A');
        html += '</div></div>';
    }

    // Findings card
    if (findings.length > 0) {
        html += '<div class="card fade-in"><h3>🧪 Vulnerability Findings <span class="badge badge-accent">' + findings.length + '</span></h3>';
        findings.forEach((f) => {
            const simResult = sim.simulations ? sim.simulations.find(s => s.title === f.title) : null;
            const badgeClass = 'badge-' + (f.severity || 'info').toLowerCase();
            html += '<div class="finding">';
            html += '<div class="finding-header">';
            html += '<span class="finding-title">' + f.title + '</span>';
            html += '<div>';
            html += '<span class="badge ' + badgeClass + '">' + f.severity + '</span> ';
            if (simResult) {
                html += '<span class="badge ' + (simResult.passed ? 'badge-confirmed' : 'badge-denied') + '">' + (simResult.passed ? '✗ EXPLOITABLE' : '✓ SAFE') + '</span>';
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

    // Summary card
    html += '<div class="card fade-in"><h3>📋 Summary</h3>';
    html += '<p style="color:var(--foreground-secondary);line-height:1.6;font-size:0.875rem">' + (data.summary || 'Analysis complete.') + '</p>';
    if (data.filepath) {
        html += '<p style="margin-top:16px;font-size:0.875rem;color:var(--foreground-muted)">Report saved: <code style="color:var(--accent);font-family:JetBrains Mono,monospace;font-size:0.8rem">' + data.filepath + '</code></p>';
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
            el.innerHTML = '<span style="color:var(--foreground-muted);font-size:0.875rem">No analyses yet.</span>';
            return;
        }
        el.innerHTML = history.map(h => {
            const riskColor = h.riskScore >= 80 ? 'var(--red)' : h.riskScore >= 60 ? 'var(--orange)' : h.riskScore >= 40 ? 'var(--yellow)' : 'var(--green)';
            return '<div class="history-item">' +
                '<div><span class="history-address">' + h.address.substring(0, 16) + '...</span> <span style="color:var(--foreground-secondary);margin-left:8px">' + (h.contractName || '') + '</span></div>' +
                '<div style="color:var(--foreground-secondary)">' + h.chain + '</div>' +
                '<div style="font-weight:700;color:' + riskColor + ';font-family:JetBrains Mono,monospace">' + (h.riskScore !== undefined ? h.riskScore + '/100' : '-') + '</div>' +
                '<div style="color:var(--green);font-size:0.75rem">' + (h.confirmed !== undefined ? '✗' + h.confirmed + ' ✓' + h.denied : '-') + '</div>' +
                '<div><span class="badge badge-' + (h.status === 'complete' ? 'low' : h.status === 'error' ? 'critical' : 'info') + '">' + h.status + '</span></div>' +
                '</div>';
        }).join('');
    } catch {}
}

// Init
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
