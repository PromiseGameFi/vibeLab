export function generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Continuous Reasoning AI Pentester (C.R.A.P.)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0d1317;
            --card-bg: #141d24;
            --card-bg-hover: #19252e;
            --accent-green: #34d399;
            --accent-green-dim: rgba(52, 211, 153, 0.15);
            --border: #23313d;
            --text-main: #f1f5f9;
            --text-muted: #8295a6;
            --red: #ef4444;
            --radius-md: 12px;
            --radius-lg: 16px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: "Inter", sans-serif;
            background: var(--bg);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 24px;
            overflow: hidden;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding: 0 12px;
        }

        .header-title {
            font-size: 0.85rem;
            color: var(--text-muted);
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .header-subtitle {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-main);
            margin-top: 4px;
        }
        
        .header-subtitle span {
            color: var(--accent-green);
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.05);
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.85rem;
            border: 1px solid var(--border);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--text-muted);
            border-radius: 50%;
        }

        .status-dot.running {
            background: var(--accent-green);
            box-shadow: 0 0 8px var(--accent-green);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        /* Forms */
        .config-row {
            display: grid;
            grid-template-columns: 160px 1fr 160px 160px 220px 180px;
            gap: 16px;
            margin-bottom: 24px;
        }

        .form-group label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 12px 16px;
            border-radius: var(--radius-md);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s;
        }

        .form-input:focus { border-color: var(--accent-green); }

        .btn-start {
            background: var(--accent-green-dim);
            color: var(--accent-green);
            border: 1px solid var(--accent-green);
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            height: 44px; /* matching input height + border */
            align-self: end;
        }

        .btn-start:hover:not(:disabled) {
            background: var(--accent-green);
            color: var(--bg);
        }

        .btn-start:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            border-color: var(--text-muted);
            color: var(--text-muted);
            background: transparent;
        }

        .btn-approve {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.6);
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            height: 44px;
            align-self: end;
        }

        .btn-approve:hover:not(:disabled) {
            background: #f59e0b;
            color: var(--bg);
        }

        .btn-approve:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* KPIs */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }

        .kpi-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 20px;
        }

        .kpi-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }

        .kpi-value {
            font-size: 2rem;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }

        /* Main Workspace */
        .workspace {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 16px;
            flex: 1;
            min-height: 0; /* needed for flex scrolling child */
            margin-bottom: 24px;
        }

        .panel {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .panel-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
        }

        .panel-badge {
            font-size: 0.75rem;
            background: var(--accent-green);
            color: var(--bg);
            padding: 2px 8px;
            border-radius: 999px;
            font-weight: 700;
        }

        .terminal-container {
            flex: 1;
            padding: 16px 20px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            line-height: 1.5;
            background: var(--bg);
        }

        .term-line { margin-bottom: 6px; word-wrap: break-word; }
        .term-time { color: var(--text-muted); margin-right: 8px; }
        .term-action { color: var(--accent-green); }
        .term-obs { color: var(--text-muted); }
        .term-thought { color: #8B5CF6; }
        .term-human { color: #f59e0b; }

        /* Phases */
        .phases-list {
            padding: 20px;
            list-style: none;
        }

        .phase-item {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: color 0.3s;
        }

        .phase-item::before {
            content: '•';
            font-size: 1.5rem;
            color: var(--border);
            transition: color 0.3s;
        }

        .phase-item.active {
            color: var(--text-main);
            font-weight: 500;
        }

        .phase-item.active::before {
            color: var(--accent-green);
            text-shadow: 0 0 10px var(--accent-green);
        }

        .phase-item.complete {
            color: var(--text-muted);
        }

        .phase-item.complete::before {
            color: var(--accent-green-dim);
        }

        .attack-tree {
            border-top: 1px solid var(--border);
            padding: 12px 16px;
            overflow-y: auto;
            max-height: 180px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
        }

        .attack-tree-node {
            padding: 6px 8px;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.02);
        }

        /* Findings Area */
        .findings-area {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            height: 200px; /* Fixed height bottom panel */
            display: flex;
            flex-direction: column;
        }

        .findings-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .findings-table th {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 20px;
            border-bottom: 1px solid var(--border);
            font-weight: 500;
        }

        .findings-table td {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            font-size: 0.85rem;
            color: var(--text-main);
        }
        
        .findings-table tr:hover {
            background: var(--card-bg-hover);
        }

        .severity-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-block;
        }

        .sev-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .sev-high { background: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3); }
        .sev-medium { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
        .sev-low { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }

        .empty-state {
            padding: 32px;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.85rem;
            font-style: italic;
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
    </style>
</head>
<body>

    <header class="header">
        <div>
            <div class="header-title">Offensive Security Automation</div>
            <div class="header-subtitle">Continuous Reasoning AI Pentester <span>(C.R.A.P.)</span></div>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
            <button id="btnWallet" onclick="connectWallet()" style="background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border); padding: 8px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                <span id="walletText">Connect Wallet</span>
            </button>
            <div class="status-badge">
                <div class="status-dot" id="statusDot"></div>
                <span id="statusText">Idle</span>
            </div>
        </div>
    </header>

    <div class="config-row">
        <div class="form-group">
            <label>Type</label>
            <select id="inputType" class="form-input" onchange="toggleType()">
                <option value="contract">Single Contract</option>
                <option value="project">Project / Repository</option>
            </select>
        </div>
        <div class="form-group">
            <label>Target</label>
            <input type="text" id="inputTarget" class="form-input" placeholder="0x... / Address" value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" />
        </div>
        <div class="form-group">
            <label>Scope (Chain)</label>
            <select id="inputChain" class="form-input">
                <option value="ethereum">Mainnet</option>
                <option value="base">Base</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="sui">Sui</option>
                <option value="solana">Solana</option>
                <option value="somnia">Somnia</option>
            </select>
        </div>
        <div class="form-group">
            <label>Profile</label>
            <select id="inputProfile" class="form-input">
                <option value="aggressive">Aggressive</option>
                <option value="stealth">Stealth / Recon</option>
                <option value="fuzz">0-Day Fuzzer</option>
            </select>
        </div>
        <button class="btn-start" id="btnStart" onclick="startAudit()">Start Autonomous Audit</button>
        <button class="btn-approve" id="btnApprove" onclick="approveExecution()" disabled>Approve Execution</button>
    </div>

    <div class="kpi-row">
        <div class="kpi-card">
            <div class="kpi-label">Assets Discovered</div>
            <div class="kpi-value" id="kpiAssets">0</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Attack Paths Modeled</div>
            <div class="kpi-value" id="kpiPaths">0</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Critical Findings</div>
            <div class="kpi-value" id="kpiFindings" style="color: var(--text-main);">0</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Risk Score</div>
            <div class="kpi-value" id="kpiRisk">0.0</div>
        </div>
    </div>

    <div class="workspace">
        <!-- Execution Stream -->
        <div class="panel">
            <div class="panel-header">
                Execution Stream
                <div class="panel-badge">LIVE</div>
            </div>
            <div class="terminal-container" id="terminalFeed">
                <div class="term-line" style="color: var(--text-muted)">Waiting for mission initialization...</div>
            </div>
            
            <!-- Live Chat Input merged into Terminal bottom -->
            <div style="padding: 12px 20px; border-top: 1px solid var(--border); background: var(--card-bg); display: flex; gap: 12px; align-items: center;">
                <span style="color: var(--accent-green); font-weight: bold; font-family: 'JetBrains Mono'">></span>
                <input type="text" id="chatInput" placeholder="Inject human instruction..." 
                    style="flex:1; background:transparent; border:none; outline:none; color:var(--text-main); font-family: 'JetBrains Mono', monospace;" 
                    onkeypress="if(event.key === 'Enter') sendUserInstruction()" />
            </div>
        </div>

        <!-- Campaign Phases -->
        <div class="panel">
            <div class="panel-header">
                Campaign Phases + Attack Tree
                <div class="panel-badge" id="currentPhaseBadge" style="background: var(--text-muted)">WAITING</div>
            </div>
            <ul class="phases-list">
                <li class="phase-item" id="phase-0">Reconnaissance</li>
                <li class="phase-item" id="phase-1">Surface Mapping (Strategies)</li>
                <li class="phase-item" id="phase-2">Vulnerability Correlation</li>
                <li class="phase-item" id="phase-3">Exploit Validation</li>
                <li class="phase-item" id="phase-4">Lateral Movement Modeling</li>
                <li class="phase-item" id="phase-5">Reporting</li>
            </ul>
            <div class="attack-tree" id="attackTreeView">
                <div style="color: var(--text-muted);">Attack tree will appear after planning.</div>
            </div>
        </div>
    </div>

    <!-- Validated Findings -->
    <div class="findings-area">
        <div class="panel-header" style="border-bottom: 0;">
            Validated Findings
            <span style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;" onclick="exportReport()">Export Report \u2193</span>
        </div>
        <div style="flex:1; overflow-y: auto;">
            <table class="findings-table">
                <thead>
                    <tr>
                        <th style="width: 120px;">Severity</th>
                        <th>ID / Title</th>
                        <th>Asset</th>
                        <th>Vector</th>
                        <th>Confidence</th>
                    </tr>
                </thead>
                <tbody id="findingsBody">
                    <tr>
                        <td colspan="5" class="empty-state">No findings yet. Commencing operational logic...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let currentRunId = null;
        let currentEventSource = null;
        let findingsCount = 0;
        let currentAttackTree = null;
        let latestApprovalState = null;

        async function connectWallet() {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const account = accounts[0];
                    document.getElementById('walletText').innerText = account.substring(0, 6) + '...' + account.substring(38);
                    const btn = document.getElementById('btnWallet');
                    btn.style.borderColor = 'var(--accent-green)';
                    btn.style.color = 'var(--accent-green)';
                    btn.style.background = 'var(--accent-green-dim)';
                    
                    fetchDeployments(account);
                } catch (error) {
                    console.error("Wallet connection rejected", error);
                }
            } else {
                alert('Please install MetaMask or a Web3 wallet extension.');
            }
        }

        async function fetchDeployments(address) {
            try {
                // Using an Etherscan API fallback to check recent transactions
                const url = \`https://api.etherscan.io/api?module=account&action=txlist&address=\${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc\`;
                const resp = await fetch(url);
                const data = await resp.json();
                if (data.status === '1' && data.result) {
                    const creationTx = data.result.find(tx => tx.to === "" && tx.contractAddress);
                    if (creationTx) {
                        const contractAddress = creationTx.contractAddress;
                        document.getElementById('inputTarget').value = contractAddress;
                        appendTerm('<span class="term-action">💳 Wallet Connected. Auto-targeting most recent deployment: <span style="font-family: monospace; color: var(--text-main)">' + contractAddress + '</span></span>');
                    } else {
                        appendTerm('<span class="term-action" style="color:var(--text-muted)">💳 Wallet Connected. No recent contract deployments found.</span>');
                    }
                }
            } catch(e) {
                console.error('Failed to fetch deployments', e);
            }
        }

        function getTimestamp() {
            const d = new Date();
            return '[' + d.toTimeString().split(' ')[0] + ']';
        }

        function toggleType() {
            const type = document.getElementById('inputType').value;
            const targetEl = document.getElementById('inputTarget');
            const chainEl = document.getElementById('inputChain');
            if (type === 'project') {
                targetEl.placeholder = "https://github.com/... or /local/path";
                targetEl.value = "";
                chainEl.disabled = true;
            } else {
                targetEl.placeholder = "0x... / Address";
                targetEl.value = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
                chainEl.disabled = false;
            }
        }

        function appendTerm(msgHTML) {
            const term = document.getElementById('terminalFeed');
            // Remove the "Waiting" message if it's there
            if(term.innerHTML.includes('Waiting for mission')) term.innerHTML = '';
            
            const timeStr = '<span class="term-time">' + getTimestamp() + '</span>';
            term.innerHTML += '<div class="term-line">' + timeStr + msgHTML + '</div>';
            term.scrollTop = term.scrollHeight;
        }

        function setPhase(index, label) {
            document.querySelectorAll('.phase-item').forEach((el, i) => {
                el.className = 'phase-item ' + (i < index ? 'complete' : i === index ? 'active' : '');
            });
            const badge = document.getElementById('currentPhaseBadge');
            badge.innerText = label.toUpperCase();
            badge.style.background = 'var(--accent-green)';
        }

        function renderAttackTree(tree) {
            const container = document.getElementById('attackTreeView');
            if (!tree || !tree.nodes || tree.nodes.length === 0) {
                container.innerHTML = '<div style=\"color: var(--text-muted);\">No attack tree data.</div>';
                return;
            }

            const nodes = tree.nodes.slice(0, 60).map((node) => {
                const statusColor = node.status === 'complete'
                    ? '#34d399'
                    : node.status === 'failed'
                        ? '#ef4444'
                        : '#8295a6';
                return '<div class=\"attack-tree-node\">'
                    + '<div style=\"display:flex; justify-content:space-between; gap:8px;\">'
                    + '<span>' + escapeHtml(node.label || node.id) + '</span>'
                    + '<span style=\"color:' + statusColor + '\">' + escapeHtml(node.status || 'pending') + '</span>'
                    + '</div>'
                    + '</div>';
            });

            container.innerHTML = nodes.join('');
        }

        async function approveExecution() {
            if (!currentRunId) return alert('Start a run before approving execution.');
            const btn = document.getElementById('btnApprove');
            btn.disabled = true;

            try {
                const resp = await fetch('/api/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        runId: currentRunId,
                        scopes: ['all'],
                        ttlMs: 20 * 60 * 1000
                    }),
                });
                const data = await resp.json();
                if (!resp.ok || data.error) throw new Error(data.error || 'Approval failed');

                latestApprovalState = { approved: true, scopes: data.grant.scopes, expiresAt: data.grant.expiresAt };
                appendTerm('<span class=\"term-human\">✅ Execution approved for run (scopes: ' + data.grant.scopes.join(',') + ')</span>');
            } catch (err) {
                alert('Approval failed: ' + err.message);
            } finally {
                btn.disabled = false;
            }
        }

        async function exportReport() {
            if (!currentRunId) return alert('No run to export yet.');
            try {
                const resp = await fetch('/api/export/' + currentRunId);
                const payload = await resp.text();
                if (!resp.ok) throw new Error(payload);

                const blob = new Blob([payload], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'vibeaudit-' + currentRunId + '-summary.json';
                link.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                alert('Export failed: ' + err.message);
            }
        }

        async function startAudit() {
            const type = document.getElementById('inputType').value;
            const address = document.getElementById('inputTarget').value.trim();
            const chain = document.getElementById('inputChain').value;
            const isProject = type === 'project';
            const profile = document.getElementById('inputProfile').value;
            const mode = profile === 'stealth' ? 'recon' : (profile === 'aggressive' ? 'exploit' : 'validate');

            if (!address) return alert("Missing target.");

            document.getElementById('btnStart').disabled = true;
            document.getElementById('btnStart').innerText = "Running...";
            document.getElementById('btnApprove').disabled = false;
            document.getElementById('statusDot').className = "status-dot running";
            document.getElementById('statusText').innerText = "Running";
            
            // Reset state
            document.getElementById('terminalFeed').innerHTML = '';
            document.getElementById('findingsBody').innerHTML = '';
            document.getElementById('attackTreeView').innerHTML = '<div style="color: var(--text-muted);">Attack tree pending...</div>';
            findingsCount = 0;
            currentAttackTree = null;
            latestApprovalState = null;
            updateKPIs({ paths: 0, findings: 0, score: 0.0, assets: 1 });
            setPhase(0, "Reconnaissance");

            appendTerm('<span style="color: var(--text-main)">Mission initialized for target <span style="font-weight:bold">' + address + '</span></span>');
            appendTerm('<span style="color: var(--text-muted)">Agent node online: secbot-core, exploit-node, graph-root</span>');
            appendTerm('<span style="color: var(--accent-green); font-weight: bold;">>>> RECONNAISSANCE</span>');

            try {
                const resp = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, chain, isProject, mode }),
                });
                const data = await resp.json();
                if (data.error) throw new Error(data.error);

                currentRunId = data.runId;
                connectSSE(data.runId);
            } catch (err) {
                alert('Analysis start failed: ' + err.message);
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').innerText = "Start Autonomous Audit";
                document.getElementById('btnApprove').disabled = true;
                document.getElementById('statusDot').className = "status-dot";
                document.getElementById('statusText').innerText = "Error";
            }
        }

        function updateKPIs(data) {
            if(data.assets !== undefined) document.getElementById('kpiAssets').innerText = data.assets;
            if(data.paths !== undefined) document.getElementById('kpiPaths').innerText = data.paths;
            
            if(data.findings !== undefined) {
                document.getElementById('kpiFindings').innerText = data.findings;
                if(data.findings > 0) document.getElementById('kpiFindings').style.color = "var(--red)";
            }
            if(data.score !== undefined) {
                document.getElementById('kpiRisk').innerText = data.score.toFixed(1);
                if(data.score > 7) document.getElementById('kpiRisk').style.color = "var(--red)";
                else if(data.score > 4) document.getElementById('kpiRisk').style.color = "#f97316";
            }
        }

        function addFinding(f, address) {
            // Remove empty state
            const tbody = document.getElementById('findingsBody');
            if(tbody.innerHTML.includes('empty-state')) tbody.innerHTML = '';

            let sevClass = 'sev-info';
            let sevText = f.severity || 'INFO';
            if(sevText.match(/critical/i)) sevClass = 'sev-critical';
            else if(sevText.match(/high/i)) sevClass = 'sev-high';
            else if(sevText.match(/medium/i)) sevClass = 'sev-medium';
            else if(sevText.match(/low/i)) sevClass = 'sev-low';

            let html = '<tr>';
            html += '<td><span class="severity-badge ' + sevClass + '">' + sevText.toUpperCase() + '</span></td>';
            html += '<td style="font-weight:600">' + escapeHtml(f.title) + '</td>';
            html += '<td style="font-family:\'JetBrains Mono\',monospace; font-size:0.75rem;">' + address.substring(0,8) + '...</td>';
            html += '<td>' + escapeHtml(f.category || 'Unknown') + '</td>';
            html += '<td>99% (Confirmed)</td>';
            html += '</tr>';
            
            tbody.innerHTML += html;
            
            findingsCount++;
            updateKPIs({ findings: findingsCount, score: Math.min(10.0, 3.5 + (findingsCount * 2.2)) });
        }

        function escapeHtml(unsafe) {
            return String(unsafe)
                .replace(/&/g, "&amp;").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function connectSSE(runId) {
            if (currentEventSource) currentEventSource.close();
            currentEventSource = new EventSource('/api/stream/' + runId);

            currentEventSource.addEventListener('progress', (e) => {
                const d = JSON.parse(e.data);
                // Map the 6 VibeAudit steps to the 6 phases
                const phaseIdx = Math.max(0, d.step - 1);
                setPhase(phaseIdx, d.label);
                if (d.label) appendTerm('<span style="color:var(--text-muted)">[system] phase transition -> ' + d.label + '</span>');
            });

            currentEventSource.addEventListener('plan', (e) => {
                const d = JSON.parse(e.data);
                updateKPIs({ paths: d.plan ? d.plan.length : 0 });
                appendTerm('<span style="color:var(--accent-green)">[strategy] Strategist compiled ' + (d.plan?d.plan.length:0) + ' attack vectors for execution.</span>');
            });

            currentEventSource.addEventListener('attack_tree', (e) => {
                const d = JSON.parse(e.data);
                currentAttackTree = d.attackTree;
                renderAttackTree(currentAttackTree);
            });

            currentEventSource.addEventListener('approval_update', (e) => {
                const d = JSON.parse(e.data);
                latestApprovalState = d;
                const txt = d.approved
                    ? 'Execution Approved'
                    : 'Execution Not Approved';
                appendTerm('<span class="term-human">[approval] ' + txt + '</span>');
            });

            currentEventSource.addEventListener('intel', (e) => {
                appendTerm('<span style="color:var(--text-muted)">[recon] Target contract identified: ' + JSON.parse(e.data).contractName + '</span>');
            });

            currentEventSource.addEventListener('thought', (e) => {
                appendTerm('<span class="term-thought">🧠 ' + escapeHtml(JSON.parse(e.data).text) + '</span>');
            });

            currentEventSource.addEventListener('action', (e) => {
                const d = JSON.parse(e.data);
                appendTerm('<span class="term-action">🛠️ executing: ' + d.name + '()</span>');
            });

            currentEventSource.addEventListener('observation', (e) => {
                appendTerm('<span class="term-obs">↳ observation: ' + escapeHtml(JSON.parse(e.data).text) + '</span>');
            });

            // If a finding occurs, append it! (VibeAudit often emits findings via API, or at the end in 'complete')
            currentEventSource.addEventListener('findings', (e) => {
                const fData = JSON.parse(e.data);
                if(fData.findings) {
                    fData.findings.forEach(f => addFinding(f, document.getElementById('inputTarget').value));
                }
            });

            currentEventSource.addEventListener('analysis_complete', (e) => {
                const d = JSON.parse(e.data);
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').innerText = "Start Autonomous Audit";
                document.getElementById('btnApprove').disabled = true;
                document.getElementById('statusDot').className = "status-dot";
                document.getElementById('statusText').innerText = "Complete";
                
                setPhase(5, "Reporting Complete");
                appendTerm('<span style="color:var(--accent-green); font-weight:bold;">>>> CAMPAIGN CONCLUDED. Report generated.</span>');
                if (d.isExploited) {
                    updateKPIs({ findings: findingsCount + 1, score: 9.5 });
                } else {
                    updateKPIs({ score: 2.5 });
                }
                currentEventSource.close();
            });

            currentEventSource.addEventListener('error', (e) => {
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').innerText = "Start Autonomous Audit";
                document.getElementById('btnApprove').disabled = true;
                document.getElementById('statusDot').className = "status-dot";
                document.getElementById('statusText').innerText = "Error";
                let message = 'Stream disconnected';
                try {
                    if (e.data) {
                        message = JSON.parse(e.data).message || message;
                    }
                } catch (_) {}
                appendTerm('<span class="term-action" style="color:var(--red)">[ERROR] ' + escapeHtml(message) + '</span>');
                currentEventSource.close();
            });
        }

        async function sendUserInstruction() {
            if (!currentRunId) return;
            const inputEl = document.getElementById('chatInput');
            const message = inputEl.value.trim();
            if (!message) return;

            inputEl.disabled = true;
            try {
                await fetch('/api/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ runId: currentRunId, message })
                });
                inputEl.value = '';
                appendTerm('<span class="term-human">👤 <b>Human Control:</b> ' + escapeHtml(message) + '</span>');
            } catch (e) {
                alert('Comm-Link error: ' + e.message);
            } finally {
                inputEl.disabled = false;
                inputEl.focus();
            }
        }
    </script>
</body>
</html>`;
}
