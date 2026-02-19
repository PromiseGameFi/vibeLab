import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * Check if Foundry (forge) is installed on the system.
 */
export function checkFoundryInstalled(): boolean {
    try {
        execSync('forge --version', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Print a fatal error and exit if Foundry is not installed.
 */
export function requireFoundry(): void {
    if (!checkFoundryInstalled()) {
        console.error(chalk.red('❌ Foundry (forge) is not installed.'));
        console.error(chalk.yellow('Install it: curl -L https://foundry.paradigm.xyz | bash && foundryup'));
        process.exit(1);
    }
}

/**
 * Default RPC URL from env or fallback.
 */
export function getDefaultRpc(): string {
    return process.env.DEFAULT_RPC || 'https://dream-rpc.somnia.network';
}

/**
 * Etherscan API key from env.
 */
export function getEtherscanApiKey(): string | undefined {
    return process.env.ETHERSCAN_API_KEY;
}

/**
 * Get the fork block setting.
 */
export function getForkBlock(): string {
    return process.env.FORK_BLOCK || 'latest';
}
