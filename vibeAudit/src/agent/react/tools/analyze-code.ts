import { ReActTool } from './index';
import OpenAI from 'openai';
import { getProvider } from '../../../chains';

export class AnalyzeCodeTool implements ReActTool {
    definition = {
        name: 'analyze_code',
        description: 'Runs deep AI security analysis on a provided snippet of smart contract or program code. Returns a list of potential vulnerabilities and architecture risks.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'The source code or decompiled bytecode to analyze.',
                },
                language: {
                    type: 'string',
                    description: 'The programming language of the code (e.g., Solidity, Rust, Move).',
                },
                analysisType: {
                    type: 'string',
                    enum: ['deep', 'process_flow'],
                    description: 'The type of analysis to run. "deep" checks architecture and access control. "process_flow" maps state transitions and user journeys.',
                }
            },
            required: ['code', 'language', 'analysisType'],
        },
    };

    async execute(args: { code: string; language: string; analysisType: 'deep' | 'process_flow' }): Promise<string> {
        if (!args.code || !args.language || !args.analysisType) {
            return 'Error: Missing required arguments.';
        }

        try {
            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY || 'dummy',
                baseURL: 'https://api.groq.com/openai/v1',
            });

            const prompt = `Perform a ${args.analysisType} security analysis on the following ${args.language} code.\n\nCode:\n${args.code}\n\nReturn a comprehensive report detailing vulnerabilities, architecture risks, and access control issues.`;

            const completion = await openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });

            return completion.choices[0]?.message?.content || 'No analysis generated.';
        } catch (error) {
            return `Error executing analyze_code: ${(error as Error).message}`;
        }
    }
}
