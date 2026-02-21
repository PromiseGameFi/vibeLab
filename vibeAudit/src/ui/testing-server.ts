/**
 * Testing UI Server — Interactive web interface for running
 * multi-chain VibeAudit engagements with approval-gated execution.
 */

import express from 'express';
import chalk from 'chalk';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { gatherIntel, ContractIntel } from '../agent/intel-gatherer';
import { getDefaultRpc } from '../utils';
import { ReActEngine } from '../agent/react/loop';
import { AttackStrategist } from '../agent/react/strategist';
import { HumanInputQueue } from '../agent/react/tools/ask-human';
import { generateHTML } from './template';
import {
    AttackTree,
    appendAttackTreeNode,
    createEngagement,
    getEngagement,
    setAttackTree,
    pushOperatorInstruction,
} from '../agent/engagement';
import { approvalService } from '../agent/approval';

dotenv.config();

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
    riskScore?: number;
    confirmed?: number;
    exportPath?: string;
    error?: string;
    isProject?: boolean;
    mode?: 'recon' | 'validate' | 'exploit';
}

const analysisHistory: AnalysisRun[] = [];
const activeClients: Map<string, express.Response[]> = new Map();

function sendEvent(runId: string, type: string, data: any): void {
    const clients = activeClients.get(runId) || [];
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
        try {
            res.write(payload);
        } catch {
            // ignore broken streams
        }
    });
}

function sendProgress(runId: string, step: number, total: number, label: string, detail?: string): void {
    sendEvent(runId, 'progress', { step, total, label, detail });
    const run = analysisHistory.find((entry) => entry.id === runId);
    if (run) run.progress.push(`[${step}/${total}] ${label}${detail ? `: ${detail}` : ''}`);
}

function attackTreeFromPlan(target: string, vectors: { vector: string; reasoning: string }[]): AttackTree {
    return {
        nodes: [
            { id: 'root', label: target, type: 'root' as const, status: 'active' as const },
            ...vectors.map((vector, idx) => ({
                id: `vector_${idx}`,
                label: vector.vector,
                type: 'vector' as const,
                status: 'pending' as const,
                metadata: { reasoning: vector.reasoning },
            })),
        ],
        edges: vectors.map((_, idx) => ({ from: 'root', to: `vector_${idx}` })),
    };
}

export function startTestingUI(port: number = 4041): void {
    const app = express();
    app.use(express.json({ limit: '5mb' }));

    app.get('/', (_req, res) => {
        res.send(generateHTML());
    });

    app.get('/api/stream/:runId', (req, res) => {
        const { runId } = req.params;
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });
        res.write(':ok\n\n');

        if (!activeClients.has(runId)) activeClients.set(runId, []);
        activeClients.get(runId)?.push(res);

        req.on('close', () => {
            const clients = activeClients.get(runId) || [];
            activeClients.set(runId, clients.filter((client) => client !== res));
        });
    });

    app.post('/api/analyze', async (req, res) => {
        const { address, chain, rpcUrl, isProject, mode } = req.body;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Invalid target.' });
        }

        const runId = crypto.randomUUID();
        const normalizedChain = typeof chain === 'string' && chain ? chain : 'ethereum';
        const runMode = (mode || 'validate') as 'recon' | 'validate' | 'exploit';

        const run: AnalysisRun = {
            id: runId,
            address,
            chain: normalizedChain,
            status: 'running',
            startedAt: new Date().toISOString(),
            progress: [],
            isProject: !!isProject,
            mode: runMode,
        };
        analysisHistory.unshift(run);

        createEngagement({
            runId,
            target: address,
            targetType: isProject ? 'project' : 'contract',
            chain: normalizedChain,
            rpcUrl: rpcUrl || getDefaultRpc(),
            mode: runMode,
            approvalRequired: true,
            project: isProject ? { path: address } : undefined,
        });

        res.json({ runId });

        runAnalysis(run, rpcUrl || getDefaultRpc()).catch((err) => {
            run.status = 'error';
            run.error = (err as Error).message;
            sendEvent(runId, 'error', { message: (err as Error).message });
        });
    });

    app.post('/api/approve', (req, res) => {
        const { runId, scopes, ttlMs, approvedBy } = req.body;
        if (!runId || typeof runId !== 'string') {
            return res.status(400).json({ error: 'Missing runId.' });
        }

        const grant = approvalService.grantApproval({
            runId,
            scopes: Array.isArray(scopes) ? scopes : ['all'],
            ttlMs: typeof ttlMs === 'number' ? ttlMs : undefined,
            approvedBy: typeof approvedBy === 'string' ? approvedBy : 'operator',
        });

        sendEvent(runId, 'approval_update', {
            approved: true,
            scopes: grant.scopes,
            token: grant.token,
            expiresAt: grant.expiresAt,
        });

        return res.json({ ok: true, grant });
    });

    app.post('/api/reply', (req, res) => {
        const { runId, message } = req.body;
        if (!runId || !message) {
            return res.status(400).json({ error: 'Missing runId or message.' });
        }

        HumanInputQueue[runId] = message;
        pushOperatorInstruction(runId, message);
        sendEvent(runId, 'operator_note', { message });

        return res.json({ success: true });
    });

    app.get('/api/run/:runId', (req, res) => {
        const run = analysisHistory.find((entry) => entry.id === req.params.runId);
        if (!run) return res.status(404).json({ error: 'Not found' });

        const engagement = getEngagement(run.id);
        return res.json({
            ...run,
            approvalState: approvalService.getState(run.id),
            attackTree: engagement?.attackTree || { nodes: [], edges: [] },
        });
    });

    app.get('/api/history', (_req, res) => {
        return res.json(
            analysisHistory.slice(0, 50).map((run) => ({
                id: run.id,
                address: run.address,
                chain: run.chain,
                status: run.status,
                startedAt: run.startedAt,
                completedAt: run.completedAt,
                riskScore: run.riskScore ?? 0,
                contractName: run.intel?.contractName,
                confirmed: run.confirmed ?? 0,
                reactStatus: run.reactStatus,
                reactDetails: run.reactDetails,
                mode: run.mode,
            })),
        );
    });

    app.get('/api/export/:runId', async (req, res) => {
        const runId = req.params.runId;
        const exportPath = path.join(process.cwd(), 'reports', runId, 'summary.json');

        try {
            const content = await fs.readFile(exportPath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            return res.send(content);
        } catch {
            return res.status(404).json({ error: 'Export not found for this run.' });
        }
    });

    app.listen(port, () => {
        console.log(chalk.cyan(`\n🧪 VibeAudit Testing UI: http://localhost:${port}\n`));
    });
}

async function runAnalysis(run: AnalysisRun, rpcUrl: string): Promise<void> {
    const runId = run.id;

    try {
        sendProgress(runId, 1, 4, 'Initializing Agent', `Starting ReAct engine for ${run.address}...`);

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
                language: intel.language,
                chainType: intel.chainType,
            });
        } else {
            sendEvent(runId, 'intel', {
                contractName: run.address.split('/').pop() || 'Project Workspace',
                hasSource: true,
                isProxy: false,
                functionsDetected: 0,
            });
        }

        sendProgress(runId, 2, 4, 'Planning', 'Building attack tree...');
        const strategist = new AttackStrategist();
        const plan = await strategist.generateInitialPlan(run.address, run.chain, !!run.isProject);

        const attackTree = attackTreeFromPlan(run.address, plan.prioritizedVectors);
        setAttackTree(runId, attackTree);
        sendEvent(runId, 'plan', { plan: plan.prioritizedVectors });
        sendEvent(runId, 'attack_tree', { attackTree });

        sendProgress(runId, 3, 4, 'Execution Approval', 'Waiting for optional execution approval...');
        sendEvent(runId, 'approval_update', approvalService.getState(runId));

        sendProgress(runId, 4, 4, 'Agent Execution', 'Executing ReAct loop...');
        const engine = new ReActEngine(runId);

        engine.onThought = (thought) => {
            sendEvent(runId, 'thought', { text: thought });
        };

        engine.onAction = (actionName, args) => {
            const nodeId = `live_${Date.now()}_${actionName}`;
            appendAttackTreeNode(runId, {
                id: nodeId,
                label: actionName,
                type: 'action',
                status: 'complete',
                metadata: { args },
            });

            sendEvent(runId, 'action', { name: actionName, args });
            const engagement = getEngagement(runId);
            if (engagement) {
                sendEvent(runId, 'attack_tree', { attackTree: engagement.attackTree });
            }
        };

        engine.onObservation = (observation) => {
            const safe = observation.length > 2500
                ? `${observation.substring(0, 2500)}...[Truncated]`
                : observation;
            sendEvent(runId, 'observation', { text: safe });
        };

        const result = await engine.run(run.address, run.chain, !!run.isProject);

        run.status = 'complete';
        run.completedAt = new Date().toISOString();
        run.reactStatus = result.status;
        run.reactDetails = result.details;
        run.exportPath = result.exportPath;
        run.riskScore = result.status === 'exploited' ? 100 : result.status === 'secure' ? 15 : 55;
        run.confirmed = result.status === 'exploited' ? 1 : 0;

        if (result.status === 'exploited') {
            sendEvent(runId, 'findings', {
                findings: [{
                    severity: 'critical',
                    title: 'Validated exploit path',
                    category: 'confirmed_exploit',
                }],
            });
        }

        sendEvent(runId, 'analysis_complete', {
            status: result.status,
            details: result.details,
            isExploited: result.status === 'exploited',
            exportPath: result.exportPath,
            approvalState: approvalService.getState(runId),
            attackTree: getEngagement(runId)?.attackTree,
        });
    } catch (error) {
        run.status = 'error';
        run.error = (error as Error).message;
        sendEvent(runId, 'error', { message: (error as Error).message });
    }
}
