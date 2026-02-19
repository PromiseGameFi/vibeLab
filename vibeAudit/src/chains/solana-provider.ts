/**
 * Solana Chain Provider — Wraps @solana/web3.js for Solana programs.
 * Supports: mainnet-beta, devnet, testnet.
 */

import {
    Connection, PublicKey, LAMPORTS_PER_SOL,
    ParsedTransactionWithMeta,
} from '@solana/web3.js';
import axios from 'axios';
import OpenAI from 'openai';
import {
    ChainProvider, ChainType, ChainIntel, ProgramInfo, TxInfo, SimResult,
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

export class SolanaProvider implements ChainProvider {
    readonly chainType: ChainType = 'solana';
    chainName: string;
    private connection: Connection | null = null;

    constructor(chainName: string = 'solana') {
        this.chainName = chainName;
    }

    async connect(rpcUrl: string): Promise<void> {
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    private getConnection(): Connection {
        if (!this.connection) throw new Error('Solana provider not connected. Call connect() first.');
        return this.connection;
    }

    async getBalance(address: string): Promise<string> {
        const conn = this.getConnection();
        const pubkey = new PublicKey(address);
        const lamports = await conn.getBalance(pubkey);
        return (lamports / LAMPORTS_PER_SOL).toFixed(9);
    }

    async fetchProgram(address: string): Promise<ProgramInfo> {
        const conn = this.getConnection();
        const pubkey = new PublicKey(address);
        const accountInfo = await conn.getAccountInfo(pubkey);

        const isExecutable = accountInfo?.executable || false;
        const dataSize = accountInfo?.data?.length || 0;
        const lamports = accountInfo?.lamports || 0;

        const source = await this.getSourceCode(address);

        return {
            address,
            name: isExecutable ? 'Solana Program' : 'Solana Account',
            bytecodeSize: dataSize,
            balance: (lamports / LAMPORTS_PER_SOL).toFixed(9),
            hasSource: !!source,
            sourceCode: source || undefined,
            language: 'rust',
        };
    }

    async gatherIntel(address: string): Promise<ChainIntel> {
        const conn = this.getConnection();
        const pubkey = new PublicKey(address);

        // Parallel fetches
        const [accountInfo, balance, signatures] = await Promise.all([
            conn.getAccountInfo(pubkey),
            conn.getBalance(pubkey),
            conn.getSignaturesForAddress(pubkey, { limit: 50 }).catch(() => []),
        ]);

        const isExecutable = accountInfo?.executable || false;
        const dataSize = accountInfo?.data?.length || 0;
        const bytecodeHex = accountInfo?.data ? Buffer.from(accountInfo.data).toString('hex') : '';
        const owner = accountInfo?.owner?.toBase58() || '';

        // Check if this is an upgradeable program
        // Upgradeable programs are owned by BPFLoaderUpgradeable: BPFLoaderUpgradeab1e11111111111111111111111
        const isUpgradeable = owner === 'BPFLoaderUpgradeab1e11111111111111111111111';

        // Try to fetch IDL (Anchor programs)
        let source = await this.getSourceCode(address);
        let decompiledCode: string | undefined;
        let detectedFunctions: string[] = [];
        let programName = isExecutable ? 'Solana Program' : 'Account';

        // Try Anchor IDL
        try {
            const idl = await this.fetchAnchorIDL(address);
            if (idl) {
                programName = idl.name || programName;
                detectedFunctions = (idl.instructions || []).map((ix: any) => ix.name);
                if (!source) {
                    // Use IDL as readable source substitute
                    source = JSON.stringify(idl, null, 2);
                }
            }
        } catch { }

        // AI decompile if no source
        if (!source && bytecodeHex.length > 10) {
            decompiledCode = await this.decompileOrDisassemble(bytecodeHex);
        }

        // Token detection (SPL Token)
        let tokenInfo: ChainIntel['tokenInfo'];
        const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        if (owner === SPL_TOKEN_PROGRAM || owner === TOKEN_2022_PROGRAM) {
            tokenInfo = {
                standard: owner === TOKEN_2022_PROGRAM ? 'Token-2022' : 'SPL Token',
            };
            // Try to parse mint data
            try {
                if (accountInfo?.data && accountInfo.data.length >= 82) {
                    const decimals = accountInfo.data[44];
                    tokenInfo.decimals = decimals;
                }
            } catch { }
        }

        return {
            chainType: 'solana',
            chainName: this.chainName,
            address,
            programName,
            bytecode: bytecodeHex.substring(0, 500),
            bytecodeSize: dataSize,
            balance: (balance / LAMPORTS_PER_SOL).toFixed(9),
            sourceCode: source || undefined,
            decompiledCode,
            language: 'rust',
            isUpgradeable,
            owner,
            tokenInfo,
            detectedFunctions,
            totalTxCount: signatures.length,
            extra: {
                isExecutable,
                ownerProgram: owner,
                rentEpoch: accountInfo?.rentEpoch,
            },
        };
    }

    async getSourceCode(address: string): Promise<string | null> {
        // Try verified source from known registries
        try {
            // Anchor Verified Builds
            const resp = await axios.get(
                `https://anchor.projectserum.com/api/v0/program/${address}/verified-build`,
                { timeout: 5000 },
            );
            if (resp.data?.source) return resp.data.source;
        } catch { }

        return null;
    }

    async fetchAnchorIDL(address: string): Promise<any> {
        try {
            const resp = await axios.get(
                `https://anchor.projectserum.com/api/v0/program/${address}/idl`,
                { timeout: 5000 },
            );
            return resp.data || null;
        } catch {
            return null;
        }
    }

    async decompileOrDisassemble(bytecode: string): Promise<string> {
        const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
        const snippet = bytecode.substring(0, 2000);
        try {
            const resp = await getOpenAI().chat.completions.create({
                model,
                messages: [{
                    role: 'user',
                    content: `Analyze this Solana BPF program bytecode. Identify possible instructions, account structures, and security patterns. Format as pseudo-Rust/Anchor code.\n\nBytecode (hex, first 1000 bytes):\n${snippet}`,
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
        const conn = this.getConnection();
        const pubkey = new PublicKey(address);
        try {
            const sigs = await conn.getSignaturesForAddress(pubkey, { limit: count });
            return sigs.map(sig => ({
                hash: sig.signature,
                from: '',
                to: address,
                value: '0',
                timestamp: (sig.blockTime || 0) * 1000,
                success: !sig.err,
                methodName: sig.memo || undefined,
            }));
        } catch {
            return [];
        }
    }

    canSimulate(): boolean {
        return false; // No Foundry equivalent for Solana
    }
}
