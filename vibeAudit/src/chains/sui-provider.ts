/**
 * SUI Chain Provider — Wraps @mysten/sui for SUI Move packages.
 * Supports: mainnet, testnet, devnet.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SuiClient } = require('@mysten/sui/client') as { SuiClient: any };
import OpenAI from 'openai';
import {
    ChainProvider, ChainType, ChainIntel, ProgramInfo, TxInfo, SimResult, SimulationAction,
} from './chain-provider';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY || 'dummy',
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }
    return _openai;
}

const MIST_PER_SUI = 1_000_000_000;

export class SUIProvider implements ChainProvider {
    readonly chainType: ChainType = 'sui';
    chainName: string;
    private client: any = null;

    constructor(chainName: string = 'sui') {
        this.chainName = chainName;
    }

    async connect(rpcUrl: string): Promise<void> {
        this.client = new SuiClient({ url: rpcUrl });
    }

    private getClient(): any {
        if (!this.client) throw new Error('SUI provider not connected. Call connect() first.');
        return this.client;
    }

    async getBalance(address: string): Promise<string> {
        const client = this.getClient();
        const bal = await client.getBalance({ owner: address });
        return (parseInt(bal.totalBalance) / MIST_PER_SUI).toFixed(9);
    }

    async fetchProgram(address: string): Promise<ProgramInfo> {
        const client = this.getClient();

        // Check if this is a package (published Move code)
        try {
            const obj = await client.getObject({
                id: address,
                options: { showContent: true, showType: true, showOwner: true },
            });

            const isPackage = obj.data?.type === 'package';
            const source = await this.getSourceCode(address);

            return {
                address,
                name: isPackage ? 'Move Package' : 'SUI Object',
                bytecodeSize: JSON.stringify(obj.data?.content || {}).length,
                balance: '0',
                hasSource: !!source,
                sourceCode: source || undefined,
                language: 'move',
            };
        } catch {
            return {
                address,
                name: 'Unknown',
                bytecodeSize: 0,
                balance: '0',
                hasSource: false,
                language: 'move',
            };
        }
    }

    async gatherIntel(address: string): Promise<ChainIntel> {
        const client = this.getClient();
        let isPackage = false;
        let packageModules: string[] = [];
        let detectedFunctions: string[] = [];
        let owner: string | undefined;
        let programName = 'Unknown';
        let bytecodeSize = 0;
        let balance = '0';
        let sourceCode: string | undefined;
        let decompiledCode: string | undefined;
        let isUpgradeable = false;

        try {
            const obj = await client.getObject({
                id: address,
                options: {
                    showContent: true,
                    showType: true,
                    showOwner: true,
                    showBcs: true,
                },
            });

            isPackage = obj.data?.type === 'package';

            if (obj.data?.owner) {
                if (typeof obj.data.owner === 'string') {
                    owner = obj.data.owner;
                } else if ('AddressOwner' in obj.data.owner) {
                    owner = obj.data.owner.AddressOwner;
                } else if ('Shared' in obj.data.owner) {
                    owner = 'Shared';
                }
            }

            bytecodeSize = JSON.stringify(obj.data?.content || {}).length;
        } catch { }

        // If it's a package, fetch module info
        if (isPackage) {
            try {
                const normalized = await client.getNormalizedMoveModulesByPackage({
                    package: address,
                });

                packageModules = Object.keys(normalized);
                programName = packageModules[0] || 'Move Package';

                // Extract all exposed functions across modules
                for (const [modName, mod] of Object.entries(normalized)) {
                    const exposedFns = mod as any;
                    if (exposedFns.exposedFunctions) {
                        for (const fnName of Object.keys(exposedFns.exposedFunctions)) {
                            detectedFunctions.push(`${modName}::${fnName}`);
                        }
                    }
                }

                // Check for upgrade capability
                // SUI packages are immutable unless an UpgradeCap exists
                isUpgradeable = detectedFunctions.some(f =>
                    f.includes('upgrade') || f.includes('migrate')
                );

                // Generate readable source from normalized modules
                sourceCode = this.moduleToReadableSource(normalized);
            } catch { }
        }

        // Try to get balance (for non-package addresses)
        if (!isPackage) {
            try {
                const bal = await client.getBalance({ owner: address });
                balance = (parseInt(bal.totalBalance) / MIST_PER_SUI).toFixed(9);
            } catch { }
        }

        // AI decompile if no readable source
        if (!sourceCode && bytecodeSize > 0) {
            decompiledCode = await this.decompileOrDisassemble(JSON.stringify({ address, modules: packageModules }));
        }

        // Token detection (SUI Coin)
        let tokenInfo: ChainIntel['tokenInfo'];
        if (detectedFunctions.some(f => f.includes('mint') || f.includes('burn') || f.includes('transfer'))) {
            const hasCoinFunctions = detectedFunctions.some(f =>
                f.includes('coin::') || f.includes('balance::')
            );
            if (hasCoinFunctions || packageModules.some(m => m.includes('coin'))) {
                tokenInfo = {
                    standard: 'Coin<T>',
                    symbol: programName?.toUpperCase().substring(0, 6),
                };
            }
        }

        // Transaction count
        let totalTxCount = 0;
        try {
            const txs = await client.queryTransactionBlocks({
                filter: { InputObject: address },
                limit: 50,
            });
            totalTxCount = txs.data.length;
        } catch { }

        return {
            chainType: 'sui',
            chainName: this.chainName,
            address,
            programName,
            bytecode: '',
            bytecodeSize,
            balance,
            sourceCode,
            decompiledCode,
            language: 'move',
            isUpgradeable,
            owner,
            tokenInfo,
            detectedFunctions,
            totalTxCount,
            extra: {
                isPackage,
                modules: packageModules,
            },
        };
    }

    async getSourceCode(address: string): Promise<string | null> {
        // SUI Move bytecode is on-chain — we can extract module info
        try {
            const client = this.getClient();
            const normalized = await client.getNormalizedMoveModulesByPackage({
                package: address,
            });
            if (normalized && Object.keys(normalized).length > 0) {
                return this.moduleToReadableSource(normalized);
            }
        } catch { }
        return null;
    }

    private moduleToReadableSource(normalized: any): string {
        let source = '// SUI Move Package — Reconstructed from on-chain modules\n\n';
        for (const [modName, mod] of Object.entries(normalized)) {
            source += `module ${modName} {\n`;
            const m = mod as any;

            // Structs
            if (m.structs) {
                for (const [structName, struct] of Object.entries(m.structs)) {
                    const s = struct as any;
                    source += `  struct ${structName}`;
                    if (s.abilities?.abilities?.length) {
                        source += ` has ${s.abilities.abilities.join(', ')}`;
                    }
                    source += ' {\n';
                    if (s.fields) {
                        for (const field of s.fields) {
                            source += `    ${field.name}: ${JSON.stringify(field.type_)},\n`;
                        }
                    }
                    source += '  }\n\n';
                }
            }

            // Functions
            if (m.exposedFunctions) {
                for (const [fnName, fn] of Object.entries(m.exposedFunctions)) {
                    const f = fn as any;
                    const vis = f.visibility || 'private';
                    const isEntry = f.isEntry ? 'entry ' : '';
                    source += `  ${isEntry}public(${vis}) fun ${fnName}(`;
                    if (f.parameters) {
                        source += f.parameters.map((p: any) => JSON.stringify(p)).join(', ');
                    }
                    source += ')';
                    if (f.return_?.length) {
                        source += `: ${f.return_.map((r: any) => JSON.stringify(r)).join(', ')}`;
                    }
                    source += ';\n';
                }
            }
            source += '}\n\n';
        }
        return source;
    }

    async decompileOrDisassemble(bytecode: string): Promise<string> {
        const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
        try {
            const resp = await getOpenAI().chat.completions.create({
                model,
                messages: [{
                    role: 'user',
                    content: `Analyze this SUI Move package structure. Identify possible functions, resource types, and security patterns. Format as pseudo-Move code.\n\nPackage data:\n${bytecode.substring(0, 2000)}`,
                }],
                max_tokens: 2000,
                temperature: 0.2,
            });
            return resp.choices[0]?.message?.content || '// Decompilation failed';
        } catch {
            return '// Decompilation unavailable';
        }
    }

    async getRecentTransactions(address: string, count: number): Promise<TxInfo[]> {
        const client = this.getClient();
        try {
            const txs = await client.queryTransactionBlocks({
                filter: { InputObject: address },
                limit: Math.min(count, 50),
                options: { showInput: true, showEffects: true },
            });

            return txs.data.map((tx: any) => ({
                hash: tx.digest,
                from: (tx as any).transaction?.data?.sender || '',
                to: address,
                value: '0',
                timestamp: parseInt(tx.timestampMs || '0'),
                success: (tx as any).effects?.status?.status === 'success',
            }));
        } catch {
            return [];
        }
    }

    canSimulate(): boolean {
        return true; // Live RPC simulation via devInspectTransactionBlock
    }

    async simulateAction(action: SimulationAction): Promise<SimResult> {
        const client = this.getClient();
        const start = Date.now();

        if (!action.sender || !action.transactionBlock) {
            return {
                supported: true,
                passed: false,
                chain: this.chainName,
                error: 'Missing sender or transactionBlock for SUI simulation.',
            };
        }

        try {
            const result = await client.devInspectTransactionBlock({
                sender: action.sender,
                transactionBlock: action.transactionBlock,
                gasPrice: action.payload?.gasPrice,
            });

            const status = result?.effects?.status?.status || 'failure';

            return {
                supported: true,
                passed: status === 'success',
                chain: this.chainName,
                output: JSON.stringify(result),
                error: status === 'success' ? undefined : JSON.stringify(result?.effects?.status),
                duration: Date.now() - start,
            };
        } catch (error) {
            return {
                supported: true,
                passed: false,
                chain: this.chainName,
                error: (error as Error).message,
                duration: Date.now() - start,
            };
        }
    }

    async broadcastAction(_action: SimulationAction): Promise<SimResult> {
        return {
            supported: false,
            passed: false,
            chain: this.chainName,
            error: 'Broadcast is disabled by default in authorized defensive mode.',
        };
    }
}
