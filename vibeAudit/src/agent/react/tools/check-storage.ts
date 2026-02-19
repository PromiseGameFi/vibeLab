import { ReActTool } from './index';
import { getProvider } from '../../../chains';
import { EVMProvider } from '../../../chains/evm-provider';

export class CheckStorageTool implements ReActTool {
    definition = {
        name: 'check_storage',
        description: 'Reads a specific storage slot of a smart contract at a given block. Currently only supported on EVM chains.',
        parameters: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'The target contract address.',
                },
                slot: {
                    type: 'string',
                    description: 'The storage slot index (hex or decimal string).',
                },
                chain: {
                    type: 'string',
                    description: 'The chain to query (must be an EVM chain like ethereum, bsc, base).',
                },
                rpcUrl: {
                    type: 'string',
                    description: 'Optional. A specific RPC URL to use for the query.',
                }
            },
            required: ['address', 'slot', 'chain'],
        },
    };

    async execute(args: { address: string; slot: string; chain: string; rpcUrl?: string }): Promise<string> {
        if (!args.address || !args.slot || !args.chain) {
            return 'Error: Missing required arguments.';
        }

        try {
            const provider = await getProvider(args.chain, args.rpcUrl);

            if (provider.chainType !== 'evm') {
                return `Error: check_storage is only supported on EVM chains. ${args.chain} is a ${provider.chainType} chain.`;
            }

            // We know it's an EVM provider now
            const evmProvider = provider as EVMProvider;

            // Access the underlying ethers provider
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ethersProvider = (evmProvider as any).provider;

            if (!ethersProvider) {
                return 'Error: Ethers provider not initialized.';
            }

            const data = await ethersProvider.getStorage(args.address, args.slot);
            return `Storage slot ${args.slot} at ${args.address}:\n${data}`;
        } catch (error) {
            return `Error executing check_storage: ${(error as Error).message}`;
        }
    }
}
