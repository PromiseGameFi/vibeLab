import { ReActTool } from './index';
import OpenAI from 'openai';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { requireApproval } from '../../approval';
import { cleanupDir, parseForgeOutput, prepareFoundryWorkspace } from './foundry-utils';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

interface FuzzArgs {
    runId: string;
    targetCode: string;
    invariants: string[];
    runs?: number;
}

export class GenerateFuzzCampaignTool implements ReActTool {
    definition = {
        name: 'generate_fuzz_campaign',
        description: 'Generates and executes a Foundry fuzz/invariant campaign. Requires approval for scope fuzz_campaign.',
        parameters: {
            type: 'object',
            properties: {
                runId: {
                    type: 'string',
                    description: 'The unique engagement run id.',
                },
                targetCode: {
                    type: 'string',
                    description: 'The source code of the contract to fuzz.',
                },
                invariants: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of invariants expected to hold.',
                },
                runs: {
                    type: 'integer',
                    description: 'Number of fuzz runs. Default 1000.',
                },
            },
            required: ['runId', 'targetCode', 'invariants'],
        },
    };

    async execute(args: FuzzArgs): Promise<string> {
        if (!args.runId || !args.targetCode || !args.invariants?.length) {
            return JSON.stringify({ ok: false, error: 'Missing runId, targetCode, or invariants.' });
        }

        const approval = requireApproval(args.runId, 'fuzz_campaign');
        if (!approval.ok) {
            return JSON.stringify({ ok: false, approvalRequired: true, error: approval.error });
        }

        let tmpDir = '';

        try {
            console.log(chalk.magenta(`\n🎰 Generating fuzz campaign (${args.runs || 1000} runs) for ${args.invariants.length} invariants...`));

            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY || 'dummy',
                baseURL: 'https://api.groq.com/openai/v1',
            });

            const prompt = `Write a complete Foundry fuzz/invariant test contract for this target code:\n${args.targetCode}\n
Target invariants:\n${args.invariants.map((item) => `- ${item}`).join('\n')}

Return only Solidity code.`;

            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });

            const fuzzCodeRaw = completion.choices[0]?.message?.content || '';
            const testCode = fuzzCodeRaw.replace(/```solidity/g, '').replace(/```/g, '').trim();
            if (!testCode) {
                return JSON.stringify({ ok: false, error: 'LLM failed to generate fuzzing code.' });
            }

            const runs = args.runs || 1000;
            tmpDir = path.join(process.cwd(), '.vibe_tmp', `fuzz_${Date.now()}`);

            await prepareFoundryWorkspace(tmpDir, `
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"
optimizer = false
fuzz = { runs = ${runs} }
invariant = { runs = ${runs}, depth = 15 }
`);

            await fs.writeFile(path.join(tmpDir, 'src', 'Target.sol'), args.targetCode, 'utf8');
            await fs.writeFile(path.join(tmpDir, 'test', 'Fuzzer.t.sol'), testCode, 'utf8');

            const { stdout, stderr } = await execAsync(`forge test --root ${tmpDir}`, { timeout: 120000 })
                .catch((execError: any) => ({
                    stdout: execError.stdout || '',
                    stderr: execError.stderr || '',
                }));

            const output = `${stdout}\n${stderr}`;
            const parsed = parseForgeOutput(output);

            return JSON.stringify({
                ok: true,
                runId: args.runId,
                runs,
                invariants: args.invariants,
                passed: parsed.passed,
                hasCompilerError: parsed.hasCompilerError,
                summary: parsed.passed
                    ? `Fuzz campaign passed (${runs} runs).`
                    : 'Invariant failure detected in fuzz campaign.',
                output: output.length > 6000 ? `${output.substring(0, 6000)}\n...[TRUNCATED]` : output,
                testCode,
            });
        } catch (error) {
            return JSON.stringify({ ok: false, error: `Error executing generate_fuzz_campaign: ${(error as Error).message}` });
        } finally {
            if (tmpDir) {
                await cleanupDir(tmpDir);
            }
        }
    }
}
