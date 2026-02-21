import { getProvider } from '../../../chains';
import { ReActTool } from './index';

export class ReadSourceTool implements ReActTool {
    definition = {
        name: 'read_source',
        description: 'Fetches and returns the source code or decompiled bytecode of a smart contract/program at a specific address.',
        parameters: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'The target contract address or program ID on-chain.',
                },
                chain: {
                    type: 'string',
                    description: 'The chain to query (e.g., ethereum, solana, sui).',
                },
                rpcUrl: {
                    type: 'string',
                    description: 'Optional. A specific RPC URL to use for the query.',
                }
            },
            required: ['address', 'chain'],
        },
    };

    async execute(args: { address: string; chain: string; rpcUrl?: string }): Promise<string> {
        if (!args.address || !args.chain) {
            return 'Error: Missing required arguments `address` and `chain`.';
        }

        try {
            const provider = await getProvider(args.chain, args.rpcUrl);

            const intel = await provider.gatherIntel(args.address);

            if (intel.sourceCode) {
                return `[Source Code Found - Language: ${intel.language}]\n\n${intel.sourceCode.substring(0, 8000)}${intel.sourceCode.length > 8000 ? '\n...[Truncated]' : ''}`;
            }

            // Fallback to decompilation if source is not verified
            if (intel.bytecode && intel.bytecode.length > 2) {
                const decompiled = await provider.decompileOrDisassemble(intel.bytecode);
                return `[No Verified Source. Showing Decompiled/Disassembled Code - Format: ${intel.language}]\n\n${decompiled.substring(0, 8000)}${decompiled.length > 8000 ? '\n...[Truncated]' : ''}`;
            }

            return `Error: Could not retrieve source code or bytecode for address ${args.address}.`;
        } catch (error) {
            return `Error executing read_source: ${(error as Error).message}`;
        }
    }
}
