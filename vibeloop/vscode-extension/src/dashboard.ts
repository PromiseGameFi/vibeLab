// Dashboard Provider - Webview panel for the VibeLab dashboard

import * as vscode from 'vscode';
import { LoopState, LoopManager } from './loopManager';

export class DashboardProvider implements vscode.WebviewViewProvider {
    private extensionUri: vscode.Uri;
    private loopManager: LoopManager;
    private webviewView: vscode.WebviewView | undefined;
    private currentState: LoopState | null = null;

    constructor(extensionUri: vscode.Uri, loopManager: LoopManager) {
        this.extensionUri = extensionUri;
        this.loopManager = loopManager;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this.webviewView = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = this.getHtmlContent();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message: { command: string }) => {
            switch (message.command) {
                case 'start':
                    await vscode.commands.executeCommand('vibeloop.start');
                    break;
                case 'stop':
                    await vscode.commands.executeCommand('vibeloop.stop');
                    break;
                case 'reset':
                    await vscode.commands.executeCommand('vibeloop.reset');
                    break;
                case 'openPrompt':
                    await this.openPromptFile();
                    break;
            }
        });

        // Update with current state
        if (this.currentState) {
            this.updateState(this.currentState);
        }
    }

    updateState(state: LoopState): void {
        this.currentState = state;

        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                type: 'stateUpdate',
                state: {
                    ...state,
                    filesChanged: Array.from(state.filesChanged),
                },
            });
        }
    }

    private async openPromptFile(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const config = vscode.workspace.getConfiguration('vibeloop');
        const promptFile = config.get<string>('promptFile') || 'PROMPT.md';
        const promptPath = vscode.Uri.joinPath(workspaceFolder.uri, promptFile);

        try {
            const doc = await vscode.workspace.openTextDocument(promptPath);
            await vscode.window.showTextDocument(doc);
        } catch {
            vscode.window.showWarningMessage(`${promptFile} not found`);
        }
    }

    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeLab Dashboard</title>
    <style>
        :root {
            --bg-primary: var(--vscode-editor-background);
            --bg-secondary: var(--vscode-sideBar-background);
            --text-primary: var(--vscode-foreground);
            --text-secondary: var(--vscode-descriptionForeground);
            --accent: var(--vscode-button-background);
            --border: var(--vscode-widget-border);
            --success: #4caf50;
            --warning: #ff9800;
            --error: #f44336;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 16px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: 600;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
        }

        .status-idle { background: var(--bg-secondary); }
        .status-running { background: var(--warning); color: #000; }
        .status-completed { background: var(--success); color: #fff; }
        .status-error { background: var(--error); color: #fff; }
        .status-rate-limited { background: var(--warning); color: #000; }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: var(--bg-secondary);
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--accent);
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        .current-task {
            background: var(--bg-secondary);
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
            margin-bottom: 20px;
        }

        .current-task-label {
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }

        .current-task-value {
            font-size: 13px;
        }

        .actions {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        button {
            flex: 1;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .btn-primary {
            background: var(--accent);
            color: var(--vscode-button-foreground);
        }

        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }

        .btn-danger {
            background: var(--error);
            color: #fff;
        }

        button:hover {
            opacity: 0.9;
        }

        .files-section {
            margin-top: 16px;
        }

        .files-header {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .files-list {
            max-height: 150px;
            overflow-y: auto;
            background: var(--bg-secondary);
            border-radius: 6px;
            border: 1px solid var(--border);
        }

        .file-item {
            padding: 6px 12px;
            font-size: 11px;
            border-bottom: 1px solid var(--border);
            font-family: var(--vscode-editor-font-family);
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .empty-state {
            text-align: center;
            padding: 20px;
            color: var(--text-secondary);
            font-size: 12px;
        }

        .spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 VibeLab Loop</h1>
        <span id="statusBadge" class="status-badge status-idle">Idle</span>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div id="iteration" class="stat-value">0</div>
            <div class="stat-label">Iteration</div>
        </div>
        <div class="stat-card">
            <div id="filesChanged" class="stat-value">0</div>
            <div class="stat-label">Files Changed</div>
        </div>
        <div class="stat-card">
            <div id="apiCalls" class="stat-value">0</div>
            <div class="stat-label">API Calls</div>
        </div>
        <div class="stat-card">
            <div id="errors" class="stat-value">0</div>
            <div class="stat-label">Errors</div>
        </div>
    </div>

    <div class="current-task">
        <div class="current-task-label">Current Task</div>
        <div id="currentTask" class="current-task-value">Ready to start</div>
    </div>

    <div class="actions">
        <button id="startBtn" class="btn-primary" onclick="sendCommand('start')">
            ▶ Start
        </button>
        <button id="stopBtn" class="btn-danger" onclick="sendCommand('stop')" style="display: none;">
            ⏹ Stop
        </button>
        <button class="btn-secondary" onclick="sendCommand('openPrompt')">
            📝 Prompt
        </button>
    </div>

    <div class="files-section">
        <div class="files-header">Modified Files</div>
        <div id="filesList" class="files-list">
            <div class="empty-state">No files modified yet</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function sendCommand(command) {
            vscode.postMessage({ command });
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'stateUpdate') {
                updateUI(message.state);
            }
        });

        function updateUI(state) {
            // Update status badge
            const badge = document.getElementById('statusBadge');
            badge.textContent = state.status.charAt(0).toUpperCase() + state.status.slice(1);
            badge.className = 'status-badge status-' + state.status;

            // Update stats
            document.getElementById('iteration').textContent = state.iteration;
            document.getElementById('filesChanged').textContent = state.filesChanged.length;
            document.getElementById('apiCalls').textContent = state.totalApiCalls;
            document.getElementById('errors').textContent = state.errors.length;

            // Update current task
            document.getElementById('currentTask').textContent = state.currentTask || 'Ready';

            // Update buttons
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            
            if (state.status === 'running') {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'flex';
            } else {
                startBtn.style.display = 'flex';
                stopBtn.style.display = 'none';
            }

            // Update files list
            const filesList = document.getElementById('filesList');
            if (state.filesChanged.length > 0) {
                filesList.innerHTML = state.filesChanged
                    .map(f => '<div class="file-item">' + f + '</div>')
                    .join('');
            } else {
                filesList.innerHTML = '<div class="empty-state">No files modified yet</div>';
            }
        }
    </script>
</body>
</html>`;
    }
}
