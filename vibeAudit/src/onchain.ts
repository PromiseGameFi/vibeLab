import { ethers } from 'ethers';
import axios from 'axios';
import chalk from 'chalk';
import { getDefaultRpc, getEtherscanApiKey } from './utils';

export interface OnChainContract {
    address: string;
    bytecode: string;
    source?: string;
    abi?: any[];
    name?: string;
    balance: string;
}

/**
 * Fetch contract data from an on-chain address.
 */
export async function fetchContract(address: string, rpcUrl?: string): Promise<OnChainContract> {
    const rpc = rpcUrl || getDefaultRpc();
    const provider = new ethers.JsonRpcProvider(rpc);

    console.log(chalk.cyan(`🔗 Connecting to ${rpc}...`));

    // Validate address
    if (!ethers.isAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
    }

    // Fetch bytecode
    const bytecode = await provider.getCode(address);
    if (bytecode === '0x') {
        throw new Error(`No contract deployed at ${address} (EOA or empty)`);
    }

    // Fetch balance
    const balanceWei = await provider.getBalance(address);
    const balance = ethers.formatEther(balanceWei);

    console.log(chalk.green(`✅ Contract found at ${address}`));
    console.log(chalk.yellow(`   Bytecode size: ${(bytecode.length - 2) / 2} bytes`));
    console.log(chalk.yellow(`   Balance: ${balance} ETH`));

    const result: OnChainContract = {
        address,
        bytecode,
        balance,
    };

    // Try to fetch verified source from Etherscan
    const source = await fetchVerifiedSource(address);
    if (source) {
        result.source = source.sourceCode;
        result.abi = source.abi;
        result.name = source.contractName;
        console.log(chalk.green(`✅ Verified source found: ${source.contractName}`));
    } else {
        console.log(chalk.yellow('⚠️  No verified source found. AI will analyze bytecode patterns.'));
    }

    return result;
}

interface VerifiedSource {
    sourceCode: string;
    contractName: string;
    abi: any[];
}

/**
 * Attempt to fetch verified source code from Etherscan-compatible APIs.
 */
async function fetchVerifiedSource(address: string): Promise<VerifiedSource | null> {
    const apiKey = getEtherscanApiKey();
    if (!apiKey) return null;

    const etherscanUrl = process.env.ETHERSCAN_API_URL || 'https://api.etherscan.io/api';

    try {
        const response = await axios.get(etherscanUrl, {
            params: {
                module: 'contract',
                action: 'getsourcecode',
                address,
                apikey: apiKey,
            },
            timeout: 10000,
        });

        const data = response.data;
        if (data.status === '1' && data.result?.[0]?.SourceCode) {
            const contract = data.result[0];
            if (contract.SourceCode === '') return null;

            let abi: any[] = [];
            try {
                abi = JSON.parse(contract.ABI);
            } catch { /* ABI parse failed, skip */ }

            return {
                sourceCode: contract.SourceCode,
                contractName: contract.ContractName,
                abi,
            };
        }
    } catch (error) {
        // Etherscan fetch failed silently
    }

    return null;
}

/**
 * Scan recent blocks for newly deployed contracts.
 */
export async function scanRecentContracts(
    rpcUrl: string,
    blockCount: number = 100
): Promise<{ address: string; deployer: string; txHash: string; blockNumber: number }[]> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const latestBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, latestBlock - blockCount);

    console.log(chalk.cyan(`🔍 Scanning blocks ${startBlock} to ${latestBlock}...`));

    const contracts: { address: string; deployer: string; txHash: string; blockNumber: number }[] = [];

    for (let i = latestBlock; i >= startBlock; i--) {
        try {
            const block = await provider.getBlock(i, true);
            if (!block || !block.transactions) continue;

            for (const txHash of block.transactions) {
                const tx = await provider.getTransaction(txHash);
                if (tx && tx.to === null) {
                    // Contract creation tx
                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (receipt && receipt.contractAddress) {
                        contracts.push({
                            address: receipt.contractAddress,
                            deployer: tx.from,
                            txHash: txHash,
                            blockNumber: i,
                        });
                    }
                }
            }
        } catch {
            // Skip failed block reads
        }
    }

    console.log(chalk.green(`Found ${contracts.length} newly deployed contracts.`));
    return contracts;
}
