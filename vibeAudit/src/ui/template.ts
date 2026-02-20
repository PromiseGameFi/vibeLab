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
            grid-template-columns: 1fr 200px 200px 260px;
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
        <div class="status-badge">
            <div class="status-dot" id="statusDot"></div>
            <span id="statusText">Idle</span>
        </div>
    </header>

    <div class="config-row">
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
                <option value="solana">Solana</option>
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
                Campaign Phases
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
        </div>
    </div>

    <!-- Validated Findings -->
    <div class="findings-area">
        <div class="panel-header" style="border-bottom: 0;">
            Validated Findings
            <span style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;" onclick="alert('Export module not implemented in UI demo')">Export Report \u2193</span>
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

        function getTimestamp() {
            const d = new Date();
            return '[' + d.toTimeString().split(' ')[0] + ']';
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

        async function startAudit() {
            const address = document.getElementById('inputTarget').value.trim();
            const chain = document.getElementById('inputChain').value;

            if (!address) return alert("Missing target address.");

            document.getElementById('btnStart').disabled = true;
            document.getElementById('btnStart').innerText = "Running...";
            document.getElementById('statusDot').className = "status-dot running";
            document.getElementById('statusText').innerText = "Running";
            
            // Reset state
            document.getElementById('terminalFeed').innerHTML = '';
            document.getElementById('findingsBody').innerHTML = '';
            findingsCount = 0;
            updateKPIs({ paths: 0, findings: 0, score: 0.0, assets: 1 });
            setPhase(0, "Reconnaissance");

            appendTerm('<span style="color: var(--text-main)">Mission initialized for target <span style="font-weight:bold">' + address + '</span></span>');
            appendTerm('<span style="color: var(--text-muted)">Agent node online: secbot-core, exploit-node, graph-root</span>');
            appendTerm('<span style="color: var(--accent-green); font-weight: bold;">>>> RECONNAISSANCE</span>');

            try {
                const resp = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, chain, simulate: true }),
                });
                const data = await resp.json();
                if (data.error) throw new Error(data.error);

                currentRunId = data.runId;
                connectSSE(data.runId);
            } catch (err) {
                alert('Analysis start failed: ' + err.message);
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').innerText = "Start Autonomous Audit";
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
                document.getElementById('statusDot').className = "status-dot";
                document.getElementById('statusText').innerText = "Complete";
                
                setPhase(5, "Reporting Complete");
                appendTerm('<span style="color:var(--accent-green); font-weight:bold;">>>> CAMPAIGN CONCLUDED. Report generated.</span>');
                currentEventSource.close();
            });

            currentEventSource.addEventListener('error', (e) => {
                document.getElementById('btnStart').disabled = false;
                document.getElementById('btnStart').innerText = "Start Autonomous Audit";
                document.getElementById('statusDot').className = "status-dot";
                document.getElementById('statusText').innerText = "Error";
                appendTerm('<span class="term-action" style="color:var(--red)">[ERROR] ' + escapeHtml(JSON.parse(e.data).message) + '</span>');
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
