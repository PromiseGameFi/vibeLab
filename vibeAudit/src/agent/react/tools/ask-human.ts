import { ReActTool } from './index';
import chalk from 'chalk';

// A simple global state/bus to handle human replies.
// In a production app, this would be a proper database or Redis queue keyed by runId.
export const HumanInputQueue: Record<string, string> = {};

export class AskHumanTool implements ReActTool {
    definition = {
        name: 'ask_human',
        description: 'Pauses execution to ask the human operator a direct question. Use this when you are stuck, lack permissions, or need external real-world context to proceed with an exploit.',
        parameters: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description: 'The explicit question to ask the human. Be direct and clear.',
                },
                runId: {
                    type: 'string',
                    description: 'The unique ID for this analysis run (must pass this to map the reply back).',
                }
            },
            required: ['question', 'runId'],
        },
    };

    async execute(args: { question: string; runId: string }): Promise<string> {
        if (!args.question || !args.runId) {
            return 'Error: Missing question or runId.';
        }

        console.log(chalk.yellow(`\\n✋ [AGENT PAUSED] Asking Human: "${args.question}"`));

        // Clear any old replies
        delete HumanInputQueue[args.runId];

        // Poll every 2 seconds for a reply (max 5 minutes)
        const maxWaitMs = 5 * 60 * 1000;
        const pollInterval = 2000;
        let elapsed = 0;

        while (elapsed < maxWaitMs) {
            if (HumanInputQueue[args.runId]) {
                const reply = HumanInputQueue[args.runId];
                console.log(chalk.green(`\\n👤 [HUMAN REPLIED]: "${reply}"`));
                delete HumanInputQueue[args.runId];
                return `[Human Response]: ${reply}`;
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            elapsed += pollInterval;
        }

        return 'Error: Human did not respond within the 5-minute timeout window. Proceed without them.';
    }
}
