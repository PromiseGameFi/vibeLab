// VibeLab Loop - VS Code Extension
// Works on: VS Code, Cursor, Antigravity (via OpenVSX)

import * as vscode from 'vscode';
import { DashboardProvider } from './dashboard';
import { LoopManager } from './loopManager';
import { StatusBarManager } from './statusBar';

let loopManager: LoopManager;
let statusBarManager: StatusBarManager;
let dashboardProvider: DashboardProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('VibeLab Loop extension activated');

    // Initialize managers
    loopManager = new LoopManager(context);
    statusBarManager = new StatusBarManager();
    dashboardProvider = new DashboardProvider(context.extensionUri, loopManager);

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'vibeloop.dashboard',
            dashboardProvider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vibeloop.start', async () => {
            await startLoop();
        }),

        vscode.commands.registerCommand('vibeloop.stop', () => {
            loopManager.stop();
            statusBarManager.setStatus('stopped');
            vscode.window.showInformationMessage('VibeLab Loop stopped');
        }),

        vscode.commands.registerCommand('vibeloop.status', () => {
            const state = loopManager.getState();
            if (state) {
                vscode.window.showInformationMessage(
                    `VibeLab Loop: Iteration ${state.iteration}, ` +
                    `Files changed: ${state.filesChanged.size}, ` +
                    `Status: ${state.status}`
                );
            } else {
                vscode.window.showInformationMessage('VibeLab Loop: Not running');
            }
        }),

        vscode.commands.registerCommand('vibeloop.openDashboard', () => {
            vscode.commands.executeCommand('vibeloop.dashboard.focus');
        }),

        vscode.commands.registerCommand('vibeloop.init', async () => {
            await initProject();
        }),

        vscode.commands.registerCommand('vibeloop.reset', async () => {
            await loopManager.reset();
            vscode.window.showInformationMessage('VibeLab Loop session reset');
        })
    );

    // Subscribe to loop events
    loopManager.onStateChange((state) => {
        statusBarManager.updateFromState(state);
        dashboardProvider.updateState(state);
    });

    // Add status bar to subscriptions
    context.subscriptions.push(statusBarManager);

    // Check for auto-start
    const config = vscode.workspace.getConfiguration('vibeloop');
    if (config.get('autoStart')) {
        startLoop();
    }
}

async function startLoop(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace to use VibeLab Loop');
        return;
    }

    const config = vscode.workspace.getConfiguration('vibeloop');
    const promptFile = config.get<string>('promptFile') || 'PROMPT.md';
    const promptPath = vscode.Uri.joinPath(workspaceFolder.uri, promptFile);

    // Check if PROMPT.md exists
    try {
        await vscode.workspace.fs.stat(promptPath);
    } catch {
        const action = await vscode.window.showWarningMessage(
            `${promptFile} not found. Create one?`,
            'Create',
            'Cancel'
        );
        if (action === 'Create') {
            await initProject();
        }
        return;
    }

    // Start the loop
    statusBarManager.setStatus('running');
    await loopManager.start({
        projectRoot: workspaceFolder.uri.fsPath,
        promptFile: promptFile,
        adapter: config.get('adapter') || 'claude-code',
        timeout: config.get('timeout') || 15,
        maxCalls: config.get('maxCalls') || 100,
    });
}

async function initProject(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace first');
        return;
    }

    const template = `# Project Requirements

## Objective
Describe what you want to build.

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Constraints
- Keep code clean and well-documented
- Write tests for critical functionality
- Follow existing code style

## Exit Conditions
When all tasks are complete and tests pass, signal completion by saying "All tasks complete."
`;

    const promptPath = vscode.Uri.joinPath(workspaceFolder.uri, 'PROMPT.md');

    try {
        await vscode.workspace.fs.stat(promptPath);
        vscode.window.showWarningMessage('PROMPT.md already exists');
    } catch {
        await vscode.workspace.fs.writeFile(promptPath, Buffer.from(template, 'utf-8'));
        const doc = await vscode.workspace.openTextDocument(promptPath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Created PROMPT.md - edit it with your requirements');
    }
}

export function deactivate() {
    if (loopManager) {
        loopManager.stop();
    }
}
