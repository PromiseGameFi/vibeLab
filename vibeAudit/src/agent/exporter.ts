import fs from 'fs/promises';
import path from 'path';
import { getEngagement } from './engagement';

export interface ExportBundleInput {
    runId: string;
    target: string;
    chain: string;
    status: 'exploited' | 'secure' | 'timeout' | 'error';
    summary: string;
    valueExtracted?: string;
    pocCode?: string;
    executionResult?: unknown;
}

async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
}

function chainHarnessTemplate(chain: string): string {
    if (chain.toLowerCase().includes('solana')) {
        return [
            '# Solana Simulation Harness Template',
            '',
            'Use this template to replay the validated simulation against a local validator.',
            '',
            '1. Start local validator: `solana-test-validator`',
            '2. Reconstruct accounts from `evidence/simulation.json`.',
            '3. Build and run Anchor test harness using captured instruction payloads.',
            '',
        ].join('\n');
    }

    if (chain.toLowerCase().includes('sui')) {
        return [
            '# Sui Simulation Harness Template',
            '',
            'Use this template to replay the validated simulation against a local Sui testnet.',
            '',
            '1. Start local network: `sui start --with-faucet --force-regenesis`',
            '2. Recreate package/object state from `evidence/simulation.json`.',
            '3. Execute `devInspectTransactionBlock` payload in a local script.',
            '',
        ].join('\n');
    }

    return '# EVM Harness\n\nUse `Exploit.t.sol` with Foundry as described in README.';
}

export async function exportProofBundle(input: ExportBundleInput): Promise<string> {
    const reportsRoot = path.join(process.cwd(), 'reports');
    const runDir = path.join(reportsRoot, input.runId);
    const evidenceDir = path.join(runDir, 'evidence');

    await ensureDir(evidenceDir);

    const ctx = getEngagement(input.runId);

    const summary = {
        runId: input.runId,
        target: input.target,
        chain: input.chain,
        status: input.status,
        summary: input.summary,
        valueExtracted: input.valueExtracted || null,
        createdAt: new Date().toISOString(),
        approvalState: ctx?.approval,
        reactStatus: ctx?.reactStatus,
        reactDetails: ctx?.reactDetails,
    };

    await fs.writeFile(
        path.join(runDir, 'summary.json'),
        JSON.stringify(summary, null, 2),
        'utf8',
    );

    await fs.writeFile(
        path.join(runDir, 'attack-tree.json'),
        JSON.stringify(ctx?.attackTree || { nodes: [], edges: [] }, null, 2),
        'utf8',
    );

    if (ctx?.evidence && ctx.evidence.length > 0) {
        await fs.writeFile(
            path.join(evidenceDir, 'events.json'),
            JSON.stringify(ctx.evidence, null, 2),
            'utf8',
        );
    }

    if (input.executionResult) {
        await fs.writeFile(
            path.join(evidenceDir, 'simulation.json'),
            JSON.stringify(input.executionResult, null, 2),
            'utf8',
        );
    }

    if (input.chain.toLowerCase().includes('solana') || input.chain.toLowerCase().includes('sui')) {
        await fs.writeFile(
            path.join(runDir, 'HARNESS_TEMPLATE.md'),
            chainHarnessTemplate(input.chain),
            'utf8',
        );
    }

    if (input.pocCode) {
        await fs.writeFile(path.join(runDir, 'Exploit.t.sol'), input.pocCode, 'utf8');
        await fs.writeFile(
            path.join(runDir, 'foundry.toml'),
            '[profile.default]\nsrc = "src"\nout = "out"\nlibs = ["lib"]\n',
            'utf8',
        );
    }

    const readmeLines = [
        `# Proof Bundle: ${input.runId}`,
        '',
        `- Target: ${input.target}`,
        `- Chain: ${input.chain}`,
        `- Status: ${input.status}`,
        '',
        '## Summary',
        input.summary,
        '',
    ];

    if (input.valueExtracted) {
        readmeLines.push('## Value Extracted / Impact');
        readmeLines.push(input.valueExtracted);
        readmeLines.push('');
    }

    if (input.pocCode) {
        readmeLines.push('## EVM PoH Run');
        readmeLines.push('```bash');
        readmeLines.push('forge test --match-path Exploit.t.sol -vvv');
        readmeLines.push('```');
        readmeLines.push('');
    }

    await fs.writeFile(path.join(runDir, 'README.md'), readmeLines.join('\n'), 'utf8');

    return runDir;
}
