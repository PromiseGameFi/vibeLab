/**
 * EVM Chain Provider — Wraps ethers.js + Etherscan for EVM chains.
 * Supports: Ethereum, BSC, Arbitrum, Base, Sepolia, etc.
 */

import { ethers, JsonRpcProvider } from 'ethers';
import axios from 'axios';
import OpenAI from 'openai';
import {
    ChainProvider, ChainType, ChainIntel, ProgramInfo, TxInfo, SimResult,
} from './chain-provider';
import { CHAIN_METADATA } from './chain-data';

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

export class EVMProvider implements ChainProvider {
    readonly chainType: ChainType = 'evm';
    chainName: string;
    private provider: ethers.JsonRpcProvider | null = null;
    private etherscanApiUrl: string;
    private etherscanApiKey: string;

    constructor(chainName: string = 'ethereum') {
        this.chainName = chainName;
        this.etherscanApiUrl = process.env.ETHERSCAN_API_URL || 'https://api.etherscan.io/api';
        this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    }

    async connect(rpcUrl: string): Promise<void> {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    private getProvider(): ethers.JsonRpcProvider {
        if (!this.provider) throw new Error('EVM provider not connected. Call connect() first.');
        return this.provider;
    }

    async getBalance(address: string): Promise<string> {
        const bal = await this.getProvider().getBalance(address);
        return ethers.formatEther(bal);
    }

    async fetchProgram(address: string): Promise<ProgramInfo> {
        const provider = this.getProvider();
        const [bytecode, balance] = await Promise.all([
            provider.getCode(address),
            provider.getBalance(address),
        ]);

        const source = await this.getSourceCode(address);

        return {
            address,
            name: 'Unknown',
            bytecodeSize: (bytecode.length - 2) / 2,
            balance: ethers.formatEther(balance),
            hasSource: !!source,
            sourceCode: source || undefined,
            language: 'solidity',
        };
    }

    async gatherIntel(address: string): Promise<ChainIntel> {
        const provider = this.getProvider();

        // Parallel fetches
        const [contractCode, balance, txCount, source, nonce] = await Promise.all([
            provider.getCode(address),
            provider.getBalance(address),
            provider.getTransactionCount(address),
            this.getSourceCode(address),
            provider.getTransactionCount(address),
        ]);

        // Proxy detection via storage slots
        let isProxy = false;
        let adminAddress: string | undefined;
        let implAddress: string | undefined;
        try {
            // EIP-1967 implementation slot
            const implSlot = await provider.getStorage(address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
            if (implSlot && implSlot !== '0x' + '0'.repeat(64)) {
                isProxy = true;
                implAddress = '0x' + implSlot.slice(-40);
            }

            // EIP-1967 admin slot
            const adminSlot = await provider.getStorage(address, '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103');
            if (adminSlot && adminSlot !== '0x' + '0'.repeat(64)) {
                adminAddress = '0x' + adminSlot.slice(-40);
            }
        } catch { }

        // Token detection
        let tokenInfo: ChainIntel['tokenInfo'];
        try {
            const iface = new ethers.Interface([
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)',
                'function totalSupply() view returns (uint256)',
            ]);
            const contract = new ethers.Contract(address, iface, provider);
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name().catch(() => null),
                contract.symbol().catch(() => null),
                contract.decimals().catch(() => null),
                contract.totalSupply().catch(() => null),
            ]);
            if (symbol) {
                tokenInfo = {
                    standard: 'ERC-20',
                    symbol,
                    name: name || undefined,
                    decimals: decimals !== null ? Number(decimals) : undefined,
                    totalSupply: totalSupply ? totalSupply.toString() : undefined,
                };
            }
        } catch { }

        // Decompile if no source
        let decompiledCode: string | undefined;
        if (!source && contractCode.length > 10) {
            decompiledCode = await this.decompileOrDisassemble(contractCode);
        }

        // Detect function selectors from bytecode
        const detectedFunctions: string[] = [];
        const selectorRegex = /63([0-9a-f]{8})/gi;
        let match;
        while ((match = selectorRegex.exec(contractCode)) !== null) {
            detectedFunctions.push('0x' + match[1]);
        }

        // Contract name from Etherscan
        let contractName = 'Unknown';
        try {
            if (this.etherscanApiKey) {
                const resp = await axios.get(this.etherscanApiUrl, {
                    params: {
                        module: 'contract',
                        action: 'getsourcecode',
                        address,
                        apikey: this.etherscanApiKey,
                    },
                });
                if (resp.data?.result?.[0]?.ContractName) {
                    contractName = resp.data.result[0].ContractName;
                }
            }
        } catch { }

        const chainData = CHAIN_METADATA[this.chainName];

        return {
            chainType: 'evm',
            chainName: this.chainName,
            address,
            programName: contractCode.length > 2 ? contractName : 'EOA',
            bytecode: contractCode,
            bytecodeSize: (contractCode.length - 2) / 2,
            balance: ethers.formatEther(balance),
            sourceCode: source || undefined,
            decompiledCode,
            language: 'solidity',
            isUpgradeable: isProxy,
            deployer: undefined, // Removed from top-level, now in extra if applicable
            owner: undefined, // Removed from top-level, now in extra if applicable
            tokenInfo,
            detectedFunctions,
            totalTxCount: txCount,
            extra: {
                nonce,
                isProxy,
                adminAddress,
                implAddress,
                characteristics: chainData?.characteristics || null,
                defiContracts: chainData?.contracts || null
            }
        };
    }

    async getSourceCode(address: string): Promise<string | null> {
        if (!this.etherscanApiKey) return null;
        try {
            const resp = await axios.get(this.etherscanApiUrl, {
                params: {
                    module: 'contract',
                    action: 'getsourcecode',
                    address,
                    apikey: this.etherscanApiKey,
                },
            });
            const src = resp.data?.result?.[0]?.SourceCode;
            return src && src !== '' ? src : null;
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
                    content: `Decompile this EVM bytecode into pseudo-Solidity. Focus on identifying functions, state variables, and access control patterns.\n\nBytecode (first 1000 bytes):\n${snippet}`,
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
        if (!this.etherscanApiKey) return [];
        try {
            const resp = await axios.get(this.etherscanApiUrl, {
                params: {
                    module: 'account',
                    action: 'txlist',
                    address,
                    page: 1,
                    offset: count,
                    sort: 'desc',
                    apikey: this.etherscanApiKey,
                },
            });
            return (resp.data?.result || []).map((tx: any) => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value || '0'),
                timestamp: parseInt(tx.timeStamp) * 1000,
                success: tx.isError === '0',
                methodName: tx.functionName?.split('(')[0] || undefined,
            }));
        } catch {
            return [];
        }
    }

    canSimulate(): boolean {
        return true; // EVM supports Foundry fork testing
    }
}
