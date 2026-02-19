/**
 * Stage 6: Self-Healing Executor
 * Runs exploits via Foundry, and if they fail, feeds the error back
 * to the AI to generate a fixed version. Retries up to N times.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { GeneratedExploit } from './exploit-gen';
import { checkFoundryInstalled, getDefaultRpc } from '../utils';

dotenv.config();

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY || 'dummy',
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://vibelab.app',
                'X-Title': 'VibeAudit',
            },
        });
    }
    return _openai;
}

export interface ExploitResult {
    strategyId: string;
    title: string;
    passed: boolean;
    attempts: number;
    maxAttempts: number;
    finalOutput: string;
    finalCode: string;
    error?: string;
}

const HEAL_PROMPT = `You are a Foundry exploit debugger. A Solidity exploit test FAILED. You receive:
1. The exploit test code that failed
2. The Foundry error output
3. The target contract source code

FIX the exploit test so it PASSES. Common issues:
- Wrong function signatures or argument types
- Missing attacker contract callback (for reentrancy, add receive()/fallback() or onERC721Received())
- Wrong ETH amounts in vm.deal() or value calls
- Need to use vm.prank() instead of direct calls
- Interface mismatches with the target contract
- Import paths incorrect

RESPOND WITH ONLY THE COMPLETE FIXED SOLIDITY FILE. No explanation. Start with // SPDX-License-Identifier`;

// ─── Main Execution Function ────────────────────────────────────────

/**
 * Execute exploits with self-healing retry loop.
 */
export async function executeWithHealing(
    exploits: GeneratedExploit[],
    targetContractCode: string,
    targetContractPath: string,
    options: {
        rpcUrl?: string;
        maxRetries?: number;
        forkBlock?: string;
    } = {},
): Promise<ExploitResult[]> {
    if (!checkFoundryInstalled()) {
        console.log(chalk.yellow('⚠️  Foundry not installed — skipping execution.'));
        return exploits.map(e => ({
            strategyId: e.strategyId,
            title: e.title,
            passed: false,
            attempts: 0,
            maxAttempts: 0,
            finalOutput: 'Foundry not installed',
            finalCode: e.testCode,
        }));
    }

    const rpcUrl = options.rpcUrl || getDefaultRpc();
    const maxRetries = options.maxRetries ?? 3;
    const forkBlock = options.forkBlock || process.env.FORK_BLOCK || 'latest';

    // Set up workspace
    const workspace = path.join(process.cwd(), '.vibeaudit-pipeline');
    await setupWorkspace(workspace, targetContractCode, targetContractPath);

    const results: ExploitResult[] = [];

    for (const exploit of exploits) {
        console.log(chalk.blue(`\n   ⚔️  Executing: ${exploit.title}`));
        const result = await executeExploitWithRetry(
            exploit, workspace, rpcUrl, forkBlock, targetContractCode, maxRetries
        );
        results.push(result);

        if (result.passed) {
            console.log(chalk.red(`   💀 CONFIRMED after ${result.attempts} attempt(s)!`));
        } else {
            console.log(chalk.gray(`   ❌ Failed after ${result.attempts}/${result.maxAttempts} attempt(s)`));
        }
    }

    return results;
}

// ─── Single Exploit Execution with Retry ────────────────────────────

async function executeExploitWithRetry(
    exploit: GeneratedExploit,
    workspace: string,
    rpcUrl: string,
    forkBlock: string,
    targetCode: string,
    maxRetries: number,
): Promise<ExploitResult> {
    let currentCode = exploit.testCode;
    let lastOutput = '';
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(chalk.gray(`      Attempt ${attempt}/${maxRetries}...`));

        // Write the test file
        const testFile = path.join(workspace, 'test', exploit.filename);
        await fs.writeFile(testFile, currentCode, 'utf-8');

        // Run forge test
        const { success, output, error } = await runForgeTest(
            workspace, exploit.filename, rpcUrl, forkBlock
        );

        lastOutput = output;
        lastError = error;

        if (success) {
            return {
                strategyId: exploit.strategyId,
                title: exploit.title,
                passed: true,
                attempts: attempt,
                maxAttempts: maxRetries,
                finalOutput: output,
                finalCode: currentCode,
            };
        }

        // If we have retries left, try to heal
        if (attempt < maxRetries) {
            console.log(chalk.yellow(`      → Failed, healing attempt ${attempt}...`));
            const healed = await healExploit(currentCode, output + '\n' + error, targetCode);
            if (healed) {
                currentCode = healed;
            } else {
                console.log(chalk.gray(`      → Healing failed, trying original again...`));
            }
        }
    }

    return {
        strategyId: exploit.strategyId,
        title: exploit.title,
        passed: false,
        attempts: maxRetries,
        maxAttempts: maxRetries,
        finalOutput: lastOutput,
        finalCode: currentCode,
        error: lastError,
    };
}

// ─── Self-Healing (AI Fix) ──────────────────────────────────────────

async function healExploit(
    failedCode: string,
    forgeOutput: string,
    targetCode: string,
): Promise<string | null> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    // Trim output to avoid token limits
    const trimmedOutput = forgeOutput.length > 3000
        ? forgeOutput.substring(0, 1500) + '\n...[truncated]...\n' + forgeOutput.substring(forgeOutput.length - 1500)
        : forgeOutput;

    try {
        const response = await getOpenAI().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: HEAL_PROMPT },
                {
                    role: 'user',
                    content: `=== FAILED EXPLOIT CODE ===\n${failedCode}\n\n=== FORGE ERROR OUTPUT ===\n${trimmedOutput}\n\n=== TARGET CONTRACT ===\n${targetCode}`,
                },
            ],
        });

        let fixed = response.choices[0].message.content || '';
        fixed = fixed.replace(/```solidity/g, '').replace(/```/g, '').trim();

        // Basic validation: must contain Test and function
        if (fixed.includes('Test') && fixed.includes('function')) {
            return fixed;
        }
        return null;
    } catch {
        return null;
    }
}

// ─── Foundry Workspace Setup ────────────────────────────────────────

async function setupWorkspace(
    workspace: string,
    targetCode: string,
    targetPath: string,
): Promise<void> {
    // Create directories
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true });
    await fs.mkdir(path.join(workspace, 'test'), { recursive: true });
    await fs.mkdir(path.join(workspace, 'lib'), { recursive: true });

    // Write foundry.toml
    const foundryConfig = `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
evm_version = "paris"
optimizer = true
optimizer_runs = 200

[fuzz]
runs = 256
`;
    await fs.writeFile(path.join(workspace, 'foundry.toml'), foundryConfig, 'utf-8');

    // Copy target contract
    const targetFilename = path.basename(targetPath);
    await fs.writeFile(
        path.join(workspace, 'src', targetFilename),
        targetCode,
        'utf-8',
    );

    // Install forge-std if not present
    const forgeStdPath = path.join(workspace, 'lib', 'forge-std');
    try {
        await fs.access(forgeStdPath);
    } catch {
        try {
            execSync('forge install foundry-rs/forge-std --no-commit', {
                cwd: workspace,
                stdio: 'pipe',
                timeout: 30000,
            });
        } catch {
            // Try alternative: git clone directly
            try {
                execSync('git init && forge install foundry-rs/forge-std --no-commit', {
                    cwd: workspace,
                    stdio: 'pipe',
                    timeout: 30000,
                });
            } catch (e2) {
                console.log(chalk.yellow('      ⚠️  Could not install forge-std'));
            }
        }
    }

    // Write remappings.txt
    await fs.writeFile(
        path.join(workspace, 'remappings.txt'),
        'forge-std/=lib/forge-std/src/\n',
        'utf-8',
    );
}

// ─── Run Forge Test ─────────────────────────────────────────────────

async function runForgeTest(
    workspace: string,
    testFilename: string,
    rpcUrl: string,
    forkBlock: string,
): Promise<{ success: boolean; output: string; error: string }> {
    try {
        let cmd = `forge test --match-path test/${testFilename} -vvv`;
        if (rpcUrl) {
            cmd += ` --fork-url ${rpcUrl}`;
            if (forkBlock && forkBlock !== 'latest') {
                cmd += ` --fork-block-number ${forkBlock}`;
            }
        }

        const output = execSync(cmd, {
            cwd: workspace,
            timeout: 120000,
            stdio: 'pipe',
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        // Check if any test passed
        const passed = /PASS/.test(output) && !/FAIL/.test(output);
        return { success: passed, output: output.toString(), error: '' };

    } catch (error: any) {
        const stdout = error.stdout?.toString() || '';
        const stderr = error.stderr?.toString() || '';

        // Check for partial passes
        const hasPass = /PASS/.test(stdout);
        const hasFail = /FAIL/.test(stdout);

        // If at least one test passed and it's our exploit test
        if (hasPass && !hasFail) {
            return { success: true, output: stdout, error: '' };
        }

        return {
            success: false,
            output: stdout,
            error: stderr || error.message || 'Unknown error',
        };
    }
}
