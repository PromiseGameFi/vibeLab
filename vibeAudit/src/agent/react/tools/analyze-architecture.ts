import { ReActTool } from './index';
import OpenAI from 'openai';
import chalk from 'chalk';
import { LoadProjectFilesTool } from './load-project-files';

interface AnalyzeArchitectureArgs {
    files?: { path: string; content: string }[];
    projectType?: string;
    projectPath?: string;
    focusArea?: string;
}

export class AnalyzeArchitectureTool implements ReActTool {
    definition = {
        name: 'analyze_architecture',
        description: 'Performs a deep project-level security analysis across interconnected smart contract files and returns attack tree guidance.',
        parameters: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'File path relative to the project root.' },
                            content: { type: 'string', description: 'Source code content.' },
                        },
                        required: ['path', 'content'],
                    },
                    description: 'Optional: explicit source files to analyze as a system.',
                },
                projectType: {
                    type: 'string',
                    description: 'Optional explicit project ecosystem (EVM/Solidity, Solana/Rust, Sui/Move).',
                },
                projectPath: {
                    type: 'string',
                    description: 'Optional local path or repository URL. If provided and files are not provided, load_project_files is used automatically.',
                },
                focusArea: {
                    type: 'string',
                    description: 'Optional focus area such as Access Control, Flash Loan Dependencies, or Cross-Contract Reentrancy.',
                },
            },
        },
    };

    async execute(args: AnalyzeArchitectureArgs): Promise<string> {
        let files = args.files;
        let projectType = args.projectType;

        if ((!files || files.length === 0) && args.projectPath) {
            const loader = new LoadProjectFilesTool();
            const loadedRaw = await loader.execute({ projectPath: args.projectPath });
            const loaded = JSON.parse(loadedRaw);

            if (!loaded.ok) {
                return JSON.stringify({
                    ok: false,
                    error: `Failed to load project files: ${loaded.error}`,
                });
            }

            files = loaded.files;
            projectType = loaded.projectType;
        }

        if (!files || files.length === 0 || !projectType) {
            return JSON.stringify({
                ok: false,
                error: 'Missing required arguments. Provide files+projectType or provide projectPath.',
            });
        }

        try {
            console.log(chalk.cyan(`\n🧠 Initiating architecture analysis across ${files.length} file(s)...`));

            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY || 'dummy',
                baseURL: 'https://api.groq.com/openai/v1',
            });

            let codeContext = '';
            for (const file of files) {
                const safeSize = file.content.length > 20000
                    ? `${file.content.substring(0, 20000)}\n...[TRUNCATED]`
                    : file.content;
                codeContext += `\n\n--- FILE: ${file.path} ---\n${safeSize}`;
            }

            const focusString = args.focusArea
                ? `\n\nPrioritize these vectors: ${args.focusArea}`
                : '';

            const prompt = `You are an elite smart contract security architect. Analyze this ${projectType} project as an interconnected system.

Identify:
1. Cross-contract state desynchronization risks.
2. Access control inconsistencies across module boundaries.
3. Oracle, bridge, and dependency trust assumptions.
4. Upgradeability and initialization hazards.
${focusString}

Project Source:
${codeContext}

Return JSON with fields:
- architectureSummary (string)
- systemicRisks (array of {title,severity,reasoning,affectedFiles})
- attackTreeSeeds (array of {vector,rationale,entrypoints})`;

            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                return JSON.stringify({ ok: false, error: 'No architecture analysis generated.' });
            }

            return JSON.stringify({ ok: true, projectType, fileCount: files.length, analysis: JSON.parse(content) });
        } catch (error) {
            return JSON.stringify({ ok: false, error: `Error executing analyze_architecture: ${(error as Error).message}` });
        }
    }
}
