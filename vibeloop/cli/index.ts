#!/usr/bin/env node
// VibeLab Autonomous Loop CLI

/* eslint-disable @typescript-eslint/no-var-requires */
const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
import * as fs from 'fs';
import * as path from 'path';
import { LoopEngine, LoopEvent, AdapterType } from '../core';
import { getAdapter, getAvailableAdapters } from '../adapters';

const program = new Command();

program
    .name('vibeloop')
    .description('Autonomous AI development loop for Cursor, Claude Code, Antigravity, and more')
    .version('0.1.0');

// Start command
program
    .command('start')
    .description('Start the autonomous development loop')
    .option('-p, --prompt <file>', 'Prompt file path', 'PROMPT.md')
    .option('-a, --adapter <type>', 'AI adapter to use', 'claude-code')
    .option('-t, --timeout <minutes>', 'Execution timeout per iteration', '15')
    .option('-c, --calls <number>', 'Max API calls per hour', '100')
    .option('-m, --monitor', 'Enable live monitoring dashboard')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (options: {
        prompt: string;
        adapter: string;
        timeout: string;
        calls: string;
        monitor?: boolean;
        verbose?: boolean;
    }) => {
        const spinner = ora('Initializing VibeLab Loop...').start();

        try {
            // Validate adapter
            const adapterType = options.adapter as AdapterType;
            const adapter = getAdapter(adapterType);

            // Check availability
            const available = await adapter.isAvailable();
            if (!available) {
                spinner.fail(chalk.red(`Adapter '${adapterType}' is not available`));
                console.log(chalk.yellow('\nAvailable adapters:'));
                const availableAdapters = await getAvailableAdapters();
                availableAdapters.forEach(a => console.log(`  - ${a}`));
                process.exit(1);
            }

            // Check prompt file exists
            const promptPath = path.resolve(options.prompt);
            if (!fs.existsSync(promptPath)) {
                spinner.fail(chalk.red(`Prompt file not found: ${promptPath}`));
                console.log(chalk.yellow('\nCreate a PROMPT.md file with your project requirements.'));
                process.exit(1);
            }

            spinner.succeed(chalk.green('Initialized'));

            // Create loop engine
            const engine = new LoopEngine(adapter, {
                projectRoot: process.cwd(),
                promptFile: options.prompt,
                timeout: parseInt(options.timeout),
                maxCalls: parseInt(options.calls),
                verbose: options.verbose || false,
                monitor: options.monitor || false,
            });

            // Subscribe to events
            engine.on((event: LoopEvent) => {
                handleEvent(event, options.verbose || false);
            });

            console.log(chalk.cyan('\n🚀 Starting autonomous development loop...'));
            console.log(chalk.gray(`   Adapter: ${adapterType}`));
            console.log(chalk.gray(`   Prompt:  ${options.prompt}`));
            console.log(chalk.gray(`   Timeout: ${options.timeout} minutes`));
            console.log(chalk.gray(`   Max calls: ${options.calls}/hour`));
            console.log('');

            // Handle interrupt
            process.on('SIGINT', () => {
                console.log(chalk.yellow('\n\n⏹  Stopping loop...'));
                engine.stop();
            });

            // Start the loop
            await engine.start();

            console.log(chalk.green('\n✅ Loop completed!'));
            const state = engine.getState();
            console.log(chalk.gray(`   Iterations: ${state.iteration}`));
            console.log(chalk.gray(`   Files changed: ${state.filesChanged.size}`));
            console.log(chalk.gray(`   API calls: ${state.totalApiCalls}`));

        } catch (error) {
            spinner.fail(chalk.red('Failed to start loop'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });

// Status command
program
    .command('status')
    .description('Check current loop status')
    .action(async () => {
        const sessionFile = path.join(process.cwd(), '.vibeloop_session');

        if (!fs.existsSync(sessionFile)) {
            console.log(chalk.yellow('No active session found.'));
            return;
        }

        try {
            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
            console.log(chalk.cyan('\n📊 Session Status'));
            console.log(chalk.gray(`   ID: ${session.id}`));
            console.log(chalk.gray(`   Iteration: ${session.iteration}`));
            console.log(chalk.gray(`   Created: ${new Date(session.createdAt).toLocaleString()}`));
            console.log(chalk.gray(`   Last updated: ${new Date(session.lastUpdated).toLocaleString()}`));
            console.log(chalk.gray(`   Expires: ${new Date(session.expiresAt).toLocaleString()}`));
        } catch {
            console.log(chalk.red('Failed to read session file.'));
        }
    });

// Init command
program
    .command('init')
    .description('Initialize a new project with a PROMPT.md template')
    .action(async () => {
        const promptPath = path.join(process.cwd(), 'PROMPT.md');

        if (fs.existsSync(promptPath)) {
            console.log(chalk.yellow('PROMPT.md already exists.'));
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

        fs.writeFileSync(promptPath, template);
        console.log(chalk.green('✅ Created PROMPT.md'));
        console.log(chalk.gray('\nEdit the file with your project requirements, then run:'));
        console.log(chalk.cyan('  vibeloop start'));
    });

// Reset command
program
    .command('reset')
    .description('Reset session and circuit breaker state')
    .action(async () => {
        const files = ['.vibeloop_session', '.vibeloop_history'];
        let deleted = 0;

        files.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted++;
            }
        });

        console.log(chalk.green(`✅ Reset complete (${deleted} files removed)`));
    });

// Event handler
function handleEvent(event: LoopEvent, verbose: boolean): void {
    switch (event.type) {
        case 'iteration':
            console.log(chalk.cyan(`\n🔄 Iteration ${event.state.iteration}`));
            break;

        case 'execute':
            if (event.result.success) {
                console.log(chalk.green(`   ✓ Execution completed (${(event.result.duration / 1000).toFixed(1)}s)`));
                if (event.result.filesChanged.length > 0) {
                    console.log(chalk.gray(`   Files changed: ${event.result.filesChanged.join(', ')}`));
                }
            } else {
                console.log(chalk.red(`   ✗ Execution failed`));
                if (event.result.errors.length > 0 && verbose) {
                    event.result.errors.forEach(e => console.log(chalk.red(`     ${e}`)));
                }
            }
            break;

        case 'exit':
            console.log(chalk.yellow(`\n🏁 Exit: ${event.reason.message}`));
            break;

        case 'error':
            console.log(chalk.red(`\n❌ Error: ${event.error.message}`));
            break;

        case 'circuit-open':
            console.log(chalk.yellow(`\n⚡ Circuit breaker opened: ${event.state.noProgressLoops} loops without progress`));
            break;

        case 'rate-limit':
            console.log(chalk.yellow(`\n⏰ Rate limited. Resume at ${event.resumeAt.toLocaleTimeString()}`));
            break;
    }
}

program.parse();
