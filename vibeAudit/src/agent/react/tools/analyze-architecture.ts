import { ReActTool } from './index';
import OpenAI from 'openai';
import chalk from 'chalk';

export class AnalyzeArchitectureTool implements ReActTool {
    definition = {
        name: 'analyze_architecture',
        description: 'Performs a deep, project-level security audit across multiple interconnected smart contracts. Use this when you have fetched the source code of an entire repository or multiple linked contracts and need to understand the systemic risk.',
        parameters: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'The file path or name (e.g., "src/Vault.sol").' },
                            content: { type: 'string', description: 'The source code content of the file.' }
                        },
                        required: ['path', 'content']
                    },
                    description: 'An array of source files to analyze as a single holistic system.',
                },
                projectType: {
                    type: 'string',
                    description: 'The ecosystem or main language (e.g., "EVM/Solidity", "Solana/Rust", "Sui/Move").',
                },
                focusArea: {
                    type: 'string',
                    description: 'Optional. Specific threat vectors to prioritize (e.g., "Access Control", "Flash Loan Dependencies", "Cross-Contract Reentrancy").',
                }
            },
            required: ['files', 'projectType'],
        },
    };

    async execute(args: { files: { path: string; content: string }[]; projectType: string; focusArea?: string }): Promise<string> {
        if (!args.files || args.files.length === 0 || !args.projectType) {
            return 'Error: Missing required arguments. Must provide an array of files and a projectType.';
        }

        try {
            console.log(chalk.cyan(`\n🧠 Initiating system-level architecture analysis across ${args.files.length} file(s)...`));

            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY || 'dummy',
                baseURL: 'https://api.groq.com/openai/v1',
            });

            // Reconstruct the codebase into a single systemic context prompt
            let codeContext = '';
            for (const file of args.files) {
                // Truncate massively large files just in case, though Groq context is large
                const safeSize = file.content.length > 20000 ? file.content.substring(0, 20000) + '\\n...[TRUNCATED]' : file.content;
                codeContext += `\n\n--- FILE: ${file.path} ---\n${safeSize}`;
            }

            const focusString = args.focusArea ? `\n\nPlease heavily prioritize the following attack vectors: ${args.focusArea}` : '';

            const prompt = `You are an elite Smart Contract Security Architect. I am providing you with the source code for a complete ${args.projectType} project containing multiple interconnected files.

Your task is to analyze the SYSTEMIC and ARCHITECTURAL risks across the entire project. Do not just look at individual files in isolation; map how they interact. 
Look for:
1. Cross-contract reentrancy or state synchronization failures.
2. Inconsistent access control across modular boundaries.
3. Oracle manipulation dependencies across the system.
4. Upgradeability proxy storage collisions or initialization flaws.
${focusString}

Here is the codebase:
${codeContext}

Return a comprehensive, highly technical Markdown report detailing systemic vulnerabilities and a proposed Attack Tree for the agent to follow.`;

            const completion = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });

            return completion.choices[0]?.message?.content || 'Error: No architecture analysis generated.';
        } catch (error) {
            return `Error executing analyze_architecture: ${(error as Error).message}`;
        }
    }
}
