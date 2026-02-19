import { ReActTool } from './index';
import { getProvider } from '../../../chains';

export class GetTransactionsTool implements ReActTool {
    definition = {
        name: 'get_transactions',
        description: 'Fetches recent transaction history for a specific address to analyze interaction patterns or trace funds.',
        parameters: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'The target contract or wallet address.',
                },
                chain: {
                    type: 'string',
                    description: 'The chain to query (e.g., ethereum, solana, sui).',
                },
                count: {
                    type: 'number',
                    description: 'Number of recent transactions to fetch (max 100).',
                },
                rpcUrl: {
                    type: 'string',
                    description: 'Optional. A specific RPC URL to use for the query.',
                }
            },
            required: ['address', 'chain', 'count'],
        },
    };

    async execute(args: { address: string; chain: string; count: number; rpcUrl?: string }): Promise<string> {
        if (!args.address || !args.chain) {
            return 'Error: Missing required arguments `address` and `chain`.';
        }

        try {
            const provider = await getProvider(args.chain, args.rpcUrl);

            const txs = await provider.getRecentTransactions(args.address, Math.min(args.count, 100));

            if (txs.length === 0) {
                return `No recent transactions found for ${args.address} on ${args.chain}.`;
            }

            let output = `Recent Transactions (${txs.length}):\n\n`;
            for (const tx of txs) {
                output += `- Hash: ${tx.hash}\n`;
                output += `  From: ${tx.from}\n`;
                output += `  To: ${tx.to}\n`;
                if (tx.value) output += `  Value: ${tx.value}\n`;
                if (tx.methodName) output += `  Method: ${tx.methodName}\n`;
                output += `  Status: ${tx.success ? 'Success' : 'Failed'}\n\n`;
            }

            return output;
        } catch (error) {
            return `Error executing get_transactions: ${(error as Error).message}`;
        }
    }
}
