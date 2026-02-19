/**
 * Live Dashboard — Express web server showing agent status
 */

import express from 'express';
import chalk from 'chalk';
import { AgentMemory } from './memory';
import { TargetQueue } from './queue';
import { BlockWatcher } from './watcher';
import { Notifier } from './notify';

export interface DashboardDeps {
    memory: AgentMemory;
    queue: TargetQueue;
    watcher: BlockWatcher;
    notifier: Notifier;
    getAgentStatus: () => AgentStatus;
}

export interface AgentStatus {
    running: boolean;
    uptime: number;
    currentTarget?: string;
    targetsProcessed: number;
    confirmedExploits: number;
}

export function startDashboard(deps: DashboardDeps, port: number = 4040): void {
    const app = express();

    // ─── API Routes ─────────────────────────────────────────────

    app.get('/api/status', (_req, res) => {
        const status = deps.getAgentStatus();
        const stats = deps.memory.getStats();
        const queueSnapshot = deps.queue.snapshot();
        const watcherStatus = deps.watcher.getStatus();
        const notifyStatus = deps.notifier.getStatus();

        res.json({
            agent: status,
            stats,
            queue: queueSnapshot,
            watcher: watcherStatus,
            notifications: notifyStatus,
        });
    });

    app.get('/api/findings', (_req, res) => {
        const confirmed = deps.memory.getConfirmedFindings(50);
        res.json({ confirmed });
    });

    app.get('/api/reports', (_req, res) => {
        const recent = deps.memory.getRecentReports(20);
        const topRisks = deps.memory.getTopRisks(20);
        res.json({ recent, topRisks });
    });

    app.get('/api/report/:address/:chain', (req, res) => {
        const report = deps.memory.getReport(req.params.address, req.params.chain);
        if (!report) return res.status(404).json({ error: 'Not found' });
        res.json(report);
    });

    app.get('/api/logs', (_req, res) => {
        const logs = deps.memory.getRecentLogs(100);
        res.json({ logs });
    });

    app.get('/api/patterns', (_req, res) => {
        const patterns = deps.memory.getPatternStats();
        res.json({ patterns });
    });

    // ─── Dashboard UI ───────────────────────────────────────────

    app.get('/', (_req, res) => {
        const status = deps.getAgentStatus();
        const stats = deps.memory.getStats();
        const queueSnapshot = deps.queue.snapshot();
        const watcherStatus = deps.watcher.getStatus();
        const recentReports = deps.memory.getRecentReports(10);
        const topRisks = deps.memory.getTopRisks(5);

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeAudit Agent Dashboard</title>
    <meta http-equiv="refresh" content="10">
    <style>
        :root { --bg: #0a0a0f; --card: #12121a; --border: #1e1e2e; --text: #e0e0e0; --dim: #666; --red: #ff3b3b; --green: #00e676; --yellow: #ffd600; --blue: #448aff; --purple: #bb86fc; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'JetBrains Mono', 'Fira Code', monospace; background: var(--bg); color: var(--text); padding: 20px; }
        h1 { color: var(--red); font-size: 1.5rem; margin-bottom: 20px; }
        h2 { color: var(--purple); font-size: 1.1rem; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 15px; }
        .stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--border); }
        .stat:last-child { border-bottom: none; }
        .stat-label { color: var(--dim); }
        .stat-value { font-weight: bold; }
        .stat-value.red { color: var(--red); }
        .stat-value.green { color: var(--green); }
        .stat-value.yellow { color: var(--yellow); }
        .stat-value.blue { color: var(--blue); }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .badge.critical { background: var(--red); color: white; }
        .badge.high { background: var(--yellow); color: black; }
        .badge.running { background: var(--green); color: black; }
        .badge.stopped { background: var(--red); color: white; }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); }
        th { color: var(--dim); font-weight: normal; }
        .mono { font-family: monospace; font-size: 0.8rem; color: var(--blue); }
    </style>
</head>
<body>
    <h1>🛡️ VibeAudit Security Analysis Agent</h1>

    <div class="grid">
        <div class="card">
            <h2>Agent Status</h2>
            <div class="stat"><span class="stat-label">Status</span><span class="stat-value ${status.running ? 'green' : 'red'}">${status.running ? '🟢 RUNNING' : '🔴 STOPPED'}</span></div>
            <div class="stat"><span class="stat-label">Uptime</span><span class="stat-value">${formatUptime(status.uptime)}</span></div>
            <div class="stat"><span class="stat-label">Current Target</span><span class="stat-value mono">${status.currentTarget || 'idle'}</span></div>
            <div class="stat"><span class="stat-label">Targets Processed</span><span class="stat-value blue">${status.targetsProcessed}</span></div>
        </div>

        <div class="card">
            <h2>Statistics</h2>
            <div class="stat"><span class="stat-label">Contracts Found</span><span class="stat-value">${stats.totalContracts}</span></div>
            <div class="stat"><span class="stat-label">Contracts Analyzed</span><span class="stat-value blue">${stats.totalAnalyzed}</span></div>
            <div class="stat"><span class="stat-label">Total Reports</span><span class="stat-value yellow">${stats.totalFindings}</span></div>
            <div class="stat"><span class="stat-label">High-Risk Contracts</span><span class="stat-value red">${stats.totalConfirmed}</span></div>
        </div>

        <div class="card">
            <h2>Queue (${queueSnapshot.size} targets)</h2>
            ${queueSnapshot.topTargets.length > 0 ? `<table><tr><th>Address</th><th>Chain</th><th>Priority</th></tr>
            ${queueSnapshot.topTargets.map(t => `<tr><td class="mono">${t.address.substring(0, 12)}...</td><td>${t.chain}</td><td>${t.priority}</td></tr>`).join('')}
            </table>` : '<p style="color:var(--dim)">Queue is empty</p>'}
        </div>

        <div class="card">
            <h2>Chain Watchers</h2>
            ${watcherStatus.map(w => `<div class="stat"><span class="stat-label">${w.chain}</span><span class="stat-value ${w.connected ? 'green' : 'red'}">${w.connected ? `✓ ${w.type}` : '✗ offline'}</span></div>`).join('')}
        </div>
    </div>

    ${recentReports.length > 0 ? `
    <div class="card" style="margin-bottom:20px">
        <h2>📊 Recent Security Reports</h2>
        <table>
            <tr><th>Contract</th><th>Chain</th><th>Name</th><th>Risk Score</th><th>When</th></tr>
            ${recentReports.map(r => {
            const riskColor = r.riskScore >= 80 ? 'red' : r.riskScore >= 60 ? 'yellow' : r.riskScore >= 40 ? 'stat-value' : 'green';
            const riskLabel = r.riskScore >= 80 ? '🔴 CRITICAL' : r.riskScore >= 60 ? '🟠 HIGH' : r.riskScore >= 40 ? '🟡 MEDIUM' : r.riskScore >= 20 ? '🟢 LOW' : '⚪ MINIMAL';
            return `<tr>
                <td class="mono">${r.address.substring(0, 12)}...</td>
                <td>${r.chain}</td>
                <td>${r.name}</td>
                <td class="stat-value ${riskColor}">${riskLabel} (${r.riskScore})</td>
                <td>${new Date(r.timestamp).toLocaleString()}</td>
            </tr>`;
        }).join('')}
        </table>
    </div>` : ''}

    ${topRisks.length > 0 ? `
    <div class="card">
        <h2>⚠️ Highest Risk Contracts</h2>
        <table>
            <tr><th>Contract</th><th>Chain</th><th>Name</th><th>Risk Score</th></tr>
            ${topRisks.map(r => `<tr>
                <td class="mono">${r.address.substring(0, 12)}...</td>
                <td>${r.chain}</td>
                <td>${r.name}</td>
                <td class="stat-value red">${r.riskScore}/100</td>
            </tr>`).join('')}
        </table>
    </div>` : ''}

</body>
</html>`);
    });

    // ─── Start Server ───────────────────────────────────────────

    app.listen(port, () => {
        console.log(chalk.cyan(`   📊 Dashboard: http://localhost:${port}`));
    });
}

function formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}
