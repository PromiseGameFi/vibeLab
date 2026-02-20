import { ReActTool } from './index';
import OpenAI from 'openai';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class GenerateFuzzCampaignTool implements ReActTool {
    definition = {
        name: 'generate_fuzz_campaign',
        description: 'Generates and automatically begins executing a Foundry invariant/fuzzing campaign against a target contract. Use this to find edge-case math overflows or state breaks when simple execution fails.',
        parameters: {
            type: 'object',
            properties: {
                targetCode: {
                    type: 'string',
                    description: 'The source code of the contract to fuzz.',
                },
                invariants: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'A list of expected invariants (e.g., "Balance should never dip below 0", "Only owner can change config").',
                },
                runs: {
                    type: 'integer',
                    description: 'Number of fuzz runs (default: 1000).',
                },
                runId: {
                    type: 'string',
                    description: 'The unique ID for this analysis run.',
                }
            },
            required: ['targetCode', 'invariants'],
        },
    };

    async execute(args: { targetCode: string; invariants: string[]; runs?: number; runId?: string }): Promise<string> {
        if (!args.targetCode || !args.invariants.length) {
            return 'Error: Missing targetCode or invariants.';
        }

        try {
            console.log(chalk.magenta(`\\n🎰 Generating Fuzzing Campaign (${args.runs || 1000} runs) for ${args.invariants.length} invariants...`));

            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY || 'dummy',
                baseURL: 'https://api.groq.com/openai/v1',
            });

            const prompt = `Write a complete Foundry Fuzz/Invariant test contract for the following target.
Target Code:
${args.targetCode}

Please write tests that specifically attempt to break these invariants:
${args.invariants.map(i => '- ' + i).join('\n')}

Return ONLY the raw Solidity code for the Fuzzer contract. Make sure it imports "forge-std/Test.sol" and defines invariant tests starting with "invariant_" or fuzz tests starting with "testFuzz_".`;

            const completion = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });

            const fuzzCodeRaw = completion.choices[0]?.message?.content || '';
            const testCode = fuzzCodeRaw.replace(/\`\`\`solidity/g, '').replace(/\`\`\`/g, '').trim();

            if (!testCode) return 'Error: LLM failed to generate fuzzing code.';

            // Execute the fuzzer locally
            const tmpDir = path.join(process.cwd(), '.vibe_tmp', `fuzz_${Date.now()}`);
            await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true });
            await fs.mkdir(path.join(tmpDir, 'test'), { recursive: true });

            const runs = args.runs || 1000;
            const foundryToml = `
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"
optimizer = false
fuzz = { runs = ${runs} }
invariant = { runs = ${runs}, depth = 15 }
`;
            await fs.writeFile(path.join(tmpDir, 'foundry.toml'), foundryToml);
            await fs.writeFile(path.join(tmpDir, 'remappings.txt'), 'forge-std/=lib/forge-std/src/');

            try {
                // If symlink fails, copy as fallback so forge-std is guaranteed
                await fs.symlink(path.join(process.cwd(), '.vibeaudit-pipeline', 'lib'), path.join(tmpDir, 'lib'), 'dir');
            } catch (e) {
                await execAsync(`cp -R ${path.join(process.cwd(), '.vibeaudit-pipeline', 'lib')} ${path.join(tmpDir, 'lib')}`);
            }

            await fs.writeFile(path.join(tmpDir, 'src', 'Target.sol'), args.targetCode);
            await fs.writeFile(path.join(tmpDir, 'test', 'Fuzzer.t.sol'), testCode);

            const forgeCmd = `forge test --root ${tmpDir}`;
            let output = '';

            try {
                const { stdout, stderr } = await execAsync(forgeCmd, { timeout: 120000 }); // 2 min timeout for fuzzer
                output = stdout + '\\n' + stderr;
            } catch (execError: any) {
                output = execError.stdout + '\\n' + execError.stderr;
            }

            // Cleanup
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => { });

            if (output.includes('PASS') && !output.includes('FAIL')) {
                return `[FUZZING COMPLETED] Fuzzer passed ${runs} runs safely. All invariants held.\nOutput: \n${output.substring(0, 1000)}`;
            } else {
                return `🚨 [INVARIANT BROKEN] Fuzzer successfully broke an invariant during testing! Review the traces below:\nOutput: \n${output}`;
            }

        } catch (error) {
            return `Error executing generate_fuzz_campaign: ${(error as Error).message}`;
        }
    }
}
