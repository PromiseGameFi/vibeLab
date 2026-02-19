import { ReActTool } from './index';
import { analyzeContractDeep } from '../../analyzers/contract-deep';
import { analyzeProcessFlow } from '../../analyzers/process-flow';

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
            // Provide fake name/context just to satisfy the analyzer signatures
            const contractName = `Target_${args.language}_Code`;
            const context = { language: args.language };

            if (args.analysisType === 'deep') {
                const report = await analyzeContractDeep(args.code, contractName, context);
                return `## Deep Analysis Results\n\n**Risk Score:** ${report.overallRiskScore}/100\n\n**Summary:**\n${report.summary}\n\n**Access Control Issues:**\n${JSON.stringify(report.accessControl, null, 2)}\n\n**Fund Flow Risks:**\n${JSON.stringify(report.fundFlow, null, 2)}`;
            } else {
                const report = await analyzeProcessFlow(args.code, contractName, context);
                return `## Process Flow Results\n\n**Risk Score:** ${report.riskScore}/100\n\n**Summary:**\n${report.summary}\n\n**Ordering Risks:**\n${JSON.stringify(report.orderingRisks, null, 2)}\n\n**Time Dependencies:**\n${JSON.stringify(report.timeDependencies, null, 2)}`;
            }
        } catch (error) {
            return `Error executing analyze_code: ${(error as Error).message}`;
        }
    }
}
