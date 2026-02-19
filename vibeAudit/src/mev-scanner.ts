import chalk from 'chalk';
import { fetchContract, scanRecentContracts } from './onchain';
import { analyzeForMev, MevOpportunity } from './auditor';

export interface MevScanResult {
    address: string;
    contractName?: string;
    balance: string;
    opportunities: MevOpportunity[];
}

/**
 * Scan recent on-chain contracts for MEV and exploit opportunities.
 */
export async function scanForMev(
    rpcUrl: string,
    blockCount: number = 100,
    minBalanceEth: number = 0
): Promise<MevScanResult[]> {
    console.log(chalk.magenta('\n🏴‍☠️ VibeAudit MEV Scanner'));
    console.log(chalk.magenta('━'.repeat(50)));

    // Step 1: Find recently deployed contracts
    const deployedContracts = await scanRecentContracts(rpcUrl, blockCount);

    if (deployedContracts.length === 0) {
        console.log(chalk.yellow('⚠️  No new contracts found in the scanned blocks.'));
        return [];
    }

    const results: MevScanResult[] = [];

    // Step 2: Fetch and analyze each contract
    for (let i = 0; i < deployedContracts.length; i++) {
        const deployed = deployedContracts[i];
        console.log(chalk.cyan(`\n[${i + 1}/${deployedContracts.length}] Analyzing ${deployed.address}...`));

        try {
            const contract = await fetchContract(deployed.address, rpcUrl);

            // Skip contracts below minimum balance threshold
            const balanceFloat = parseFloat(contract.balance);
            if (balanceFloat < minBalanceEth) {
                console.log(chalk.gray(`   Skipped (balance ${contract.balance} ETH below threshold)`));
                continue;
            }

            // Need source code for AI analysis
            const codeToAnalyze = contract.source || generateBytecodeAnalysisPrompt(contract.bytecode);

            const opportunities = await analyzeForMev(
                codeToAnalyze,
                contract.name || deployed.address,
                { address: deployed.address, balance: contract.balance }
            );

            if (opportunities.length > 0) {
                results.push({
                    address: deployed.address,
                    contractName: contract.name,
                    balance: contract.balance,
                    opportunities,
                });

                console.log(chalk.red(`   💰 Found ${opportunities.length} MEV opportunities!`));
            } else {
                console.log(chalk.gray(`   No MEV opportunities found.`));
            }
        } catch (error) {
            console.log(chalk.gray(`   Error: ${(error as Error).message}`));
        }
    }

    // Step 3: Rank by estimated value
    results.sort((a, b) => {
        const aBalance = parseFloat(a.balance);
        const bBalance = parseFloat(b.balance);
        return bBalance - aBalance; // Higher balance first
    });

    return results;
}

/**
 * Generate a prompt with bytecode analysis hints when no source is available.
 */
function generateBytecodeAnalysisPrompt(bytecode: string): string {
    const sizeBytes = (bytecode.length - 2) / 2;

    // Extract function selectors (first 4 bytes of keccak256 of function signatures)
    const selectors: string[] = [];
    // Look for PUSH4 opcodes (0x63) which often precede function selectors
    for (let i = 2; i < bytecode.length - 8; i += 2) {
        if (bytecode.substring(i, i + 2) === '63') {
            const selector = '0x' + bytecode.substring(i + 2, i + 10);
            if (!selectors.includes(selector)) {
                selectors.push(selector);
            }
        }
    }

    return `// BYTECODE ANALYSIS (no verified source available)
// Contract size: ${sizeBytes} bytes
// Detected function selectors: ${selectors.slice(0, 20).join(', ')}
//
// Analyze this bytecode for potential vulnerabilities:
// - Look for CALL/DELEGATECALL patterns that could indicate reentrancy
// - Look for SSTORE after CALL (state update after external call)
// - Look for missing access control patterns
// - Identify if this appears to be a proxy, token, or DeFi contract
//
// Raw bytecode (first 500 bytes): ${bytecode.substring(0, 1000)}`;
}
