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

import { checkFoundryInstalled, getDefaultRpc } from '../utils';
import { ReActEngine } from '../agent/react/loop';
import { AttackStrategist } from '../agent/react/strategist';
import { HumanInputQueue } from '../agent/react/tools/ask-human'; // Moved HumanInputQueue import to top-level
import { generateHTML } from './template';

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
    isProject?: boolean;
}

const analysisHistory: AnalysisRun[] = [];
const activeClients: Map<string, express.Response[]> = new Map(); // runId → SSE clients

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
        const { address, chain, rpcUrl, simulate, isProject } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Invalid target' });
        }

        const runId = crypto.randomUUID();
        const run: AnalysisRun = {
            id: runId,
            address,
            chain: chain || 'ethereum',
            status: 'running',
            startedAt: new Date().toISOString(),
            progress: [],
            isProject: !!isProject,
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

    // ─── Human Input Webhook ────────────────────────────────────
    app.post('/api/reply', (req, res) => {
        const { runId, message } = req.body;
        if (!runId || !message) {
            return res.status(400).json({ error: 'Missing runId or message' });
        }

        // Import the queue from the tool - REMOVED, now imported at top-level
        HumanInputQueue[runId] = message;

        res.json({ success: true, message: 'Reply sent to agent.' });
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

        // 1. Optional: Gather initial intel for the UI
        if (!run.isProject) {
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
        } else {
            sendEvent(runId, 'intel', {
                contractName: run.address.split('/').pop() || 'Project Workspace',
                bytecodeSize: 0,
                balance: '0',
                hasSource: true,
                isProxy: false,
                functionsDetected: 0,
            });
        }

        // 2. Generate Initial Attack Plan (Strategist)
        sendProgress(runId, 2, 3, 'Planning', `Building attack tree...`);
        const strategist = new AttackStrategist();
        const plan = await strategist.generateInitialPlan(run.address, run.chain, run.isProject);
        sendEvent(runId, 'plan', { plan: plan.prioritizedVectors });

        // 3. ReAct Loop Execution
        sendProgress(runId, 3, 3, 'Agent Execution', 'Executing ReAct Loop...');
        const engine = new ReActEngine(runId);

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

        const result = await engine.run(run.address, run.chain, run.isProject);

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

// ─── End ────────────────────────────────────────────────────────────
