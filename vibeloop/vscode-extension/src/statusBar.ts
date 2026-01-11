// Status Bar Manager - Shows loop status in VS Code status bar

import * as vscode from 'vscode';
import { LoopState } from './loopManager';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'vibeloop.openDashboard';
        this.setStatus('idle');
        this.statusBarItem.show();
    }

    setStatus(status: 'idle' | 'running' | 'stopped' | 'error' | 'completed'): void {
        switch (status) {
            case 'idle':
                this.statusBarItem.text = '$(rocket) VibeLab';
                this.statusBarItem.tooltip = 'Click to open VibeLab Dashboard';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'running':
                this.statusBarItem.text = '$(sync~spin) VibeLab Running';
                this.statusBarItem.tooltip = 'Autonomous loop is running...';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'stopped':
                this.statusBarItem.text = '$(debug-stop) VibeLab Stopped';
                this.statusBarItem.tooltip = 'Loop stopped';
                this.statusBarItem.backgroundColor = undefined;
                break;
            case 'error':
                this.statusBarItem.text = '$(error) VibeLab Error';
                this.statusBarItem.tooltip = 'Loop encountered an error';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'completed':
                this.statusBarItem.text = '$(check) VibeLab Complete';
                this.statusBarItem.tooltip = 'All tasks completed!';
                this.statusBarItem.backgroundColor = undefined;
                break;
        }
    }

    updateFromState(state: LoopState): void {
        const icon = this.getStatusIcon(state.status);
        const text = state.status === 'running'
            ? `${icon} VibeLab: ${state.iteration}`
            : `${icon} VibeLab`;

        this.statusBarItem.text = text;
        this.statusBarItem.tooltip = this.getTooltip(state);

        // Set background color based on status
        switch (state.status) {
            case 'running':
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'error':
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            default:
                this.statusBarItem.backgroundColor = undefined;
        }
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'running': return '$(sync~spin)';
            case 'paused': return '$(debug-pause)';
            case 'completed': return '$(check)';
            case 'error': return '$(error)';
            case 'rate-limited': return '$(watch)';
            default: return '$(rocket)';
        }
    }

    private getTooltip(state: LoopState): string {
        const lines = [
            `Status: ${state.status}`,
            `Iteration: ${state.iteration}`,
            `Files changed: ${state.filesChanged.size}`,
            `API calls: ${state.totalApiCalls}`,
        ];

        if (state.currentTask) {
            lines.push(`Current: ${state.currentTask}`);
        }

        if (state.errors.length > 0) {
            lines.push(`Errors: ${state.errors.length}`);
        }

        return lines.join('\n');
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
