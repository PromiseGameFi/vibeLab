// Web3/Blockchain Security Patterns
// Based on: SWC Registry, EthTrust Security Levels, Solana Security Best Practices

export interface Web3Pattern {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    language: 'solidity' | 'rust' | 'move' | 'func' | 'javascript' | 'typescript';
    category: 'smart-contract' | 'wallet' | 'defi' | 'nft';
    pattern: RegExp;
    fix: string;
    cwe?: string;
    swc?: string;
    references?: string[];
    compliance?: string[];
    cvss?: number;
    impact?: string;
    remediation?: string;
}

// ============================================
// SOLIDITY/EVM PATTERNS (SWC Registry)
// ============================================
export const solidityPatterns: Web3Pattern[] = [
    // SWC-107: Reentrancy
    {
        id: 'sol-reentrancy',
        name: 'Reentrancy Vulnerability',
        description: 'State changes occur after external calls, allowing attackers to re-enter the function before state is updated.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /\.call\{.*value.*\}|\.send\(|\.transfer\([^;]*\);[^}]*[a-zA-Z_][a-zA-Z0-9_]*\s*[+\-*/]?=/,
        fix: 'Apply the Checks-Effects-Interactions pattern: update state before making external calls. Use ReentrancyGuard from OpenZeppelin.',
        cwe: 'CWE-841',
        swc: 'SWC-107'
    },
    // SWC-101: Integer Overflow/Underflow
    {
        id: 'sol-integer-overflow',
        name: 'Integer Overflow/Underflow',
        description: 'Arithmetic operations without overflow checks can wrap around, leading to unexpected values.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /pragma\s+solidity\s+[\^~]?0\.[0-7]\./,
        fix: 'Use Solidity 0.8.0+ with built-in overflow checks, or use SafeMath library for older versions.',
        cwe: 'CWE-190',
        swc: 'SWC-101'
    },
    // SWC-115: tx.origin Authentication
    {
        id: 'sol-tx-origin',
        name: 'tx.origin Authentication',
        description: 'Using tx.origin for authorization is vulnerable to phishing attacks where a malicious contract tricks users.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /tx\.origin/,
        fix: 'Use msg.sender instead of tx.origin for authorization checks.',
        cwe: 'CWE-477',
        swc: 'SWC-115'
    },
    // SWC-112: Delegatecall to Untrusted Contract
    {
        id: 'sol-delegatecall',
        name: 'Delegatecall to Untrusted Contract',
        description: 'Delegatecall executes code in the context of the calling contract, allowing malicious code to modify storage.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /\.delegatecall\(/,
        fix: 'Only delegatecall to trusted, audited contracts. Validate the target address against a whitelist.',
        cwe: 'CWE-829',
        swc: 'SWC-112'
    },
    // SWC-104: Unchecked Call Return Value
    {
        id: 'sol-unchecked-call',
        name: 'Unchecked External Call Return Value',
        description: 'Not checking the return value of external calls can lead to silent failures.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /\.call\{[^}]*\}\([^)]*\)\s*;(?!\s*require|\s*if|\s*assert)/,
        fix: 'Always check the return value: (bool success, ) = addr.call{...}(...); require(success);',
        cwe: 'CWE-252',
        swc: 'SWC-104'
    },
    // SWC-105: Unprotected Ether Withdrawal
    {
        id: 'sol-unprotected-withdrawal',
        name: 'Unprotected Ether Withdrawal',
        description: 'Withdrawal function lacks access control, allowing anyone to drain funds.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /function\s+withdraw[^{]*\{[^}]*(?:\.transfer\(|\.send\(|\.call\{value)[^}]*\}/,
        fix: 'Add access control modifiers like onlyOwner or require(msg.sender == owner).',
        cwe: 'CWE-284',
        swc: 'SWC-105'
    },
    // SWC-106: Unprotected SELFDESTRUCT
    {
        id: 'sol-selfdestruct',
        name: 'Unprotected SELFDESTRUCT',
        description: 'selfdestruct without access control allows anyone to destroy the contract.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /selfdestruct\s*\(/,
        fix: 'Add strict access control to selfdestruct. Consider if selfdestruct is actually needed.',
        cwe: 'CWE-284',
        swc: 'SWC-106'
    },
    // SWC-100: Function Default Visibility
    {
        id: 'sol-default-visibility',
        name: 'Function Default Visibility',
        description: 'Functions without explicit visibility default to public, potentially exposing internal logic.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*(?!public|private|internal|external)/,
        fix: 'Always explicitly declare function visibility (public, private, internal, or external).',
        cwe: 'CWE-710',
        swc: 'SWC-100'
    },
    // SWC-120: Weak Randomness
    {
        id: 'sol-weak-randomness',
        name: 'Weak Randomness Source',
        description: 'Using block.timestamp, blockhash, or block.difficulty for randomness is predictable by miners.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /block\.(timestamp|difficulty|number|blockhash)|blockhash\s*\(/,
        fix: 'Use Chainlink VRF or commit-reveal schemes for secure randomness.',
        cwe: 'CWE-330',
        swc: 'SWC-120'
    },
    // SWC-128: DoS with Block Gas Limit
    {
        id: 'sol-dos-gas-limit',
        name: 'DoS with Block Gas Limit',
        description: 'Unbounded loops or operations can exceed block gas limit, making function uncallable.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /for\s*\([^)]*\.length|while\s*\([^)]*\.length/,
        fix: 'Avoid iterating over unbounded arrays. Use pagination or mapping-based designs.',
        cwe: 'CWE-400',
        swc: 'SWC-128'
    },
    // SWC-113: DoS with Failed Call
    {
        id: 'sol-dos-failed-call',
        name: 'DoS with Failed Call',
        description: 'Looping over addresses with external calls can be blocked if one address reverts.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /for\s*\([^)]*\)[^{]*\{[^}]*\.call|for\s*\([^)]*\)[^{]*\{[^}]*\.transfer/,
        fix: 'Use pull-over-push pattern. Let users withdraw instead of pushing payments in loops.',
        cwe: 'CWE-400',
        swc: 'SWC-113'
    },
    // SWC-103: Floating Pragma
    {
        id: 'sol-floating-pragma',
        name: 'Floating Pragma',
        description: 'Unlocked compiler version may compile with different versions, causing inconsistencies.',
        severity: 'low',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /pragma\s+solidity\s+[\^~]/,
        fix: 'Lock the pragma version: pragma solidity 0.8.20; (without ^ or ~)',
        swc: 'SWC-103'
    },
    // SWC-136: Unencrypted Private Data
    {
        id: 'sol-private-data',
        name: 'Unencrypted Private Data On-Chain',
        description: 'Private variables are still readable from blockchain. Sensitive data should not be stored.',
        severity: 'critical',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /private\s+(?:string|bytes|uint|int)\s+(?:password|secret|key|private|apiKey)/i,
        fix: 'Never store sensitive data on-chain. Use commit-reveal or off-chain storage with hashes.',
        cwe: 'CWE-312',
        swc: 'SWC-136'
    },
    // Flash Loan Vulnerability
    {
        id: 'sol-flash-loan',
        name: 'Flash Loan Vulnerability',
        description: 'Price or balance checks without flash loan protection can be manipulated in a single transaction.',
        severity: 'critical',
        language: 'solidity',
        category: 'defi',
        pattern: /balanceOf\([^)]*\)\s*[><=]/,
        fix: 'Use time-weighted average prices (TWAP) or add flash loan guards.',
        cwe: 'CWE-362'
    },
    // Oracle Manipulation
    {
        id: 'sol-oracle-manipulation',
        name: 'Single Source Oracle',
        description: 'Relying on a single price oracle can be manipulated through flash loans or market manipulation.',
        severity: 'critical',
        language: 'solidity',
        category: 'defi',
        pattern: /getPrice\(|getLatestPrice\(|latestAnswer\(/,
        fix: 'Use multiple oracle sources, Chainlink, or TWAP. Add circuit breakers for extreme deviations.',
        cwe: 'CWE-20'
    },
    // Unlimited Token Approval
    {
        id: 'sol-unlimited-approval',
        name: 'Unlimited Token Approval',
        description: 'Approving MAX_UINT256 tokens allows a contract to spend all user tokens forever.',
        severity: 'high',
        language: 'solidity',
        category: 'defi',
        pattern: /\.approve\([^,]*,\s*(?:type\(uint256\)\.max|2\*\*256|uint256\(-1\)|0xffffffff)/,
        fix: 'Approve only the amount needed for the transaction. Revoke approvals after use.',
        cwe: 'CWE-269'
    },
    // Missing Slippage Protection
    {
        id: 'sol-no-slippage',
        name: 'Missing Slippage Protection',
        description: 'DEX swaps without minimum output amount can be frontrun for MEV extraction.',
        severity: 'high',
        language: 'solidity',
        category: 'defi',
        pattern: /swap[^(]*\([^)]*,\s*0\s*[,)]/,
        fix: 'Always set a reasonable amountOutMin parameter based on current price minus slippage tolerance.',
        cwe: 'CWE-754'
    },
    // Front-Running Risk
    {
        id: 'sol-frontrun',
        name: 'Front-Running Vulnerability',
        description: 'Transaction outcome is predictable and can be exploited by MEV bots.',
        severity: 'high',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /firstComeFirstServe|reveal\s*\(|claimReward\s*\(/,
        fix: 'Use commit-reveal schemes, submarine sends, or MEV protection services like Flashbots.',
        cwe: 'CWE-362'
    },
    // Missing Events
    {
        id: 'sol-missing-events',
        name: 'Missing Event Emission',
        description: 'State-changing functions without events make off-chain tracking difficult.',
        severity: 'low',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /function\s+(?:set|update|change|modify)[^{]*\{[^}]*(?!emit\s+)[^}]*\}/,
        fix: 'Emit events for all state changes to enable off-chain monitoring.',
        cwe: 'CWE-778'
    },
    // SWC-117: Signature Malleability
    {
        id: 'sol-signature-malleability',
        name: 'Signature Malleability',
        description: 'ECDSA signatures can be modified while remaining valid, enabling replay attacks.',
        severity: 'medium',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /ecrecover\s*\(/,
        fix: 'Use OpenZeppelin ECDSA library which checks for malleability. Include nonces in signed data.',
        cwe: 'CWE-347',
        swc: 'SWC-117'
    },
    // SWC-133: Hash Collision with abi.encodePacked
    {
        id: 'sol-hash-collision',
        name: 'Hash Collision with abi.encodePacked',
        description: 'abi.encodePacked with multiple dynamic types can produce hash collisions.',
        severity: 'medium',
        language: 'solidity',
        category: 'smart-contract',
        pattern: /keccak256\s*\(\s*abi\.encodePacked\s*\([^)]*,\s*(?:string|bytes)/,
        fix: 'Use abi.encode instead of abi.encodePacked for hashing multiple dynamic types.',
        cwe: 'CWE-327',
        swc: 'SWC-133'
    },
];

// ============================================
// RUST/ANCHOR (SOLANA) PATTERNS
// ============================================
export const solanaPatterns: Web3Pattern[] = [
    // Missing Signer Check
    {
        id: 'sol-missing-signer',
        name: 'Missing Signer Check',
        description: 'Authority account is not verified as transaction signer, allowing unauthorized access.',
        severity: 'critical',
        language: 'rust',
        category: 'smart-contract',
        pattern: /AccountInfo(?!.*Signer)|ctx\.accounts\.[a-z_]+(?!\.is_signer)/,
        fix: 'Use Anchor Signer type or manually check account.is_signer in instruction.',
    },
    // Missing Owner Check
    {
        id: 'sol-missing-owner',
        name: 'Missing Account Owner Check',
        description: 'Account owner is not validated, allowing attacker-controlled accounts to be passed.',
        severity: 'critical',
        language: 'rust',
        category: 'smart-contract',
        pattern: /AccountInfo[^>]*>(?!.*owner\s*=)/,
        fix: 'Use Anchor #[account(owner = <program_id>)] constraint or check account.owner manually.',
    },
    // Arbitrary CPI
    {
        id: 'sol-arbitrary-cpi',
        name: 'Arbitrary Cross-Program Invocation',
        description: 'CPI target program is not verified, allowing calls to malicious programs.',
        severity: 'critical',
        language: 'rust',
        category: 'smart-contract',
        pattern: /invoke\s*\([^,]*ctx\.accounts\.[a-z_]+\.to_account_info\(\)/,
        fix: 'Validate the program ID before CPI. Use Anchor Program type with explicit program ID.',
    },
    // PDA Seed Collision
    {
        id: 'sol-pda-collision',
        name: 'PDA Seed Collision Risk',
        description: 'PDA seeds lack uniqueness, potentially causing account collisions.',
        severity: 'high',
        language: 'rust',
        category: 'smart-contract',
        pattern: /Pubkey::find_program_address\s*\(\s*&\s*\[\s*b"/,
        fix: 'Include unique identifiers (user pubkey, random seed) in PDA seeds.',
    },
    // Unchecked Arithmetic
    {
        id: 'sol-unchecked-arithmetic',
        name: 'Unchecked Arithmetic Operations',
        description: 'Arithmetic without overflow checks can wrap in release builds.',
        severity: 'high',
        language: 'rust',
        category: 'smart-contract',
        pattern: /(?<!checked_)\b(add|sub|mul|div)\s*\(|[+\-*/]=?\s*(?!0\s*[;,)])/,
        fix: 'Use checked_add, checked_sub, checked_mul, checked_div. Enable overflow-checks in Cargo.toml.',
    },
    // Account Not Closed
    {
        id: 'sol-account-not-closed',
        name: 'Account Not Properly Closed',
        description: 'Accounts are not closed after use, leaving rent-exempt SOL locked.',
        severity: 'medium',
        language: 'rust',
        category: 'smart-contract',
        pattern: /close\s*=\s*[a-z_]+\)?(?!.*zero_lamports)/,
        fix: 'Use Anchor close constraint or manually zero lamports and reassign owner to System Program.',
    },
    // Type Confusion
    {
        id: 'sol-type-confusion',
        name: 'Account Type Confusion',
        description: 'Using AccountInfo instead of typed Account allows passing wrong account types.',
        severity: 'high',
        language: 'rust',
        category: 'smart-contract',
        pattern: /AccountInfo<'info>/,
        fix: 'Use typed Account<MyType> instead of AccountInfo where possible.',
    },
    // Insecure Initialization
    {
        id: 'sol-insecure-init',
        name: 'Insecure Initialization',
        description: 'Initialization can be front-run, allowing attacker to take control.',
        severity: 'critical',
        language: 'rust',
        category: 'smart-contract',
        pattern: /pub fn initialize\s*\(/,
        fix: 'Use Anchor init constraint with seeds. Add is_initialized check to prevent re-initialization.',
    },
    // Duplicate Mutable Accounts
    {
        id: 'sol-duplicate-mutable',
        name: 'Duplicate Mutable Accounts',
        description: 'Same account passed as multiple mutable parameters can cause unexpected behavior.',
        severity: 'high',
        language: 'rust',
        category: 'smart-contract',
        pattern: /#\[account\s*\(\s*mut\s*\)\]/g,
        fix: 'Use #[account(constraint = account_a.key() != account_b.key())] to prevent duplicates.',
    },
    // Missing Bump Validation
    {
        id: 'sol-missing-bump',
        name: 'Missing PDA Bump Validation',
        description: 'PDA bump is not validated, allowing use of non-canonical addresses.',
        severity: 'medium',
        language: 'rust',
        category: 'smart-contract',
        pattern: /seeds\s*=\s*\[[^\]]*\](?!.*bump)/,
        fix: 'Store and validate bump in account data: #[account(seeds = [...], bump = account.bump)]',
    },
    // Token Authority Attack (Cashio-style)
    {
        id: 'sol-token-authority',
        name: 'Token Account Authority Not Validated',
        description: 'Token account mint/authority is not checked, allowing fake tokens to be used.',
        severity: 'critical',
        language: 'rust',
        category: 'smart-contract',
        pattern: /TokenAccount(?!.*constraint.*mint\s*=)/,
        fix: 'Validate token account mint: #[account(constraint = token.mint == expected_mint.key())]',
    },
];

// ============================================
// MOVE (SUI/APTOS) PATTERNS
// ============================================
export const movePatterns: Web3Pattern[] = [
    {
        id: 'move-capability-leak',
        name: 'Capability Leak',
        description: 'Capabilities passed to untrusted code can be abused for unauthorized actions.',
        severity: 'critical',
        language: 'move',
        category: 'smart-contract',
        pattern: /public\s+fun\s+[^(]*\([^)]*&mut\s+[A-Z][a-zA-Z]*Cap/,
        fix: 'Never pass mutable references to capabilities to untrusted functions.',
    },
    {
        id: 'move-resource-exhaustion',
        name: 'Unbounded Resource Growth',
        description: 'Unbounded vectors or tables can grow indefinitely, exhausting storage.',
        severity: 'high',
        language: 'move',
        category: 'smart-contract',
        pattern: /vector::push_back|table::add/,
        fix: 'Add size limits and cleanup mechanisms for dynamic collections.',
    },
    {
        id: 'move-missing-abort',
        name: 'Missing Abort Condition',
        description: 'Function should abort on invalid conditions but continues execution.',
        severity: 'medium',
        language: 'move',
        category: 'smart-contract',
        pattern: /public\s+fun\s+[^{]*\{(?![\s\S]*assert!|[\s\S]*abort)/,
        fix: 'Add assert! or abort conditions for invalid states.',
    },
    {
        id: 'move-object-access',
        name: 'Missing Object Access Control',
        description: 'Shared or owned objects accessed without proper permission checks.',
        severity: 'high',
        language: 'move',
        category: 'smart-contract',
        pattern: /&mut\s+[A-Z][a-zA-Z]+(?!.*owner)/,
        fix: 'Verify object ownership or permissions before modification.',
    },
];

// ============================================
// FUNC (TON) PATTERNS
// ============================================
export const funcPatterns: Web3Pattern[] = [
    {
        id: 'func-replay-attack',
        name: 'Replay Attack Vulnerability',
        description: 'Message lacks replay protection, allowing duplicate processing.',
        severity: 'critical',
        language: 'func',
        category: 'smart-contract',
        pattern: /recv_internal\s*\([^)]*\)\s*\{(?![\s\S]*seqno)/,
        fix: 'Include and validate sequence numbers (seqno) in messages.',
    },
    {
        id: 'func-gas-exhaustion',
        name: 'Gas Exhaustion Risk',
        description: 'Contract may fail due to insufficient gas for operations.',
        severity: 'high',
        language: 'func',
        category: 'smart-contract',
        pattern: /while|repeat\s*\(/,
        fix: 'Add gas checks and limit loop iterations. Use buy_gas() appropriately.',
    },
    {
        id: 'func-bounce-handling',
        name: 'Missing Bounce Handling',
        description: 'Bounced messages not handled, potentially losing funds.',
        severity: 'medium',
        language: 'func',
        category: 'smart-contract',
        pattern: /recv_internal(?![\s\S]*bounced)/,
        fix: 'Implement recv_bounced handler for failed outgoing messages.',
    },
];

// ============================================
// DAPP WALLET SECURITY PATTERNS (JS/TS)
// ============================================
export const walletPatterns: Web3Pattern[] = [
    // Critical Signing Issues
    {
        id: 'wallet-eth-sign',
        name: 'Dangerous eth_sign Usage',
        description: 'eth_sign can sign arbitrary data and is prone to phishing attacks.',
        severity: 'critical',
        language: 'javascript',
        category: 'wallet',
        pattern: /eth_sign|personal_sign\s*\([^,]*,\s*[^)]*\)/,
        fix: 'Use eth_signTypedData_v4 (EIP-712) for structured, human-readable signing.',
    },
    {
        id: 'wallet-blind-signing',
        name: 'Blind Signing Request',
        description: 'Requesting signature without showing human-readable message to user.',
        severity: 'critical',
        language: 'javascript',
        category: 'wallet',
        pattern: /signMessage\s*\([^)]*\)(?![\s\S]{0,100}display|[\s\S]{0,100}show)/,
        fix: 'Always display the message content to users before requesting signature.',
    },
    {
        id: 'wallet-private-key-code',
        name: 'Hardcoded Private Key',
        description: 'Private key or mnemonic phrase hardcoded in source code (not from env).',
        severity: 'critical',
        language: 'javascript',
        category: 'wallet',
        // Match: privateKey = "0x..." or mnemonic: "word word..."
        // Don't match: privateKey = process.env.PRIVATE_KEY (safe!)
        pattern: /(?:privateKey|private_key|mnemonic|seedPhrase|seed_phrase)\s*[:=]\s*['"`](?!.*process\.env)[0-9a-fA-Fx]/i,
        fix: 'Never hardcode private keys. Use environment variables: process.env.PRIVATE_KEY',
    },
    // High Severity
    {
        id: 'wallet-unlimited-approval',
        name: 'Unlimited Token Approval in Frontend',
        description: 'Approving MAX_UINT256 tokens gives permanent unlimited access.',
        severity: 'high',
        language: 'javascript',
        category: 'wallet',
        pattern: /approve\s*\([^,]*,\s*(?:ethers\.constants\.MaxUint256|MAX_UINT|2n\s*\*\*\s*256n)/,
        fix: 'Approve only the amount needed. Prompt users to revoke approvals after use.',
    },
    {
        id: 'wallet-http-rpc',
        name: 'Insecure HTTP RPC Endpoint',
        description: 'Using HTTP instead of HTTPS for RPC allows man-in-the-middle attacks.',
        severity: 'critical',
        language: 'javascript',
        category: 'wallet',
        pattern: /http:\/\/(?!localhost|127\.0\.0\.1)[^'"`\s]+(?:rpc|api|infura|alchemy)/i,
        fix: 'Always use HTTPS for RPC endpoints.',
    },
    {
        id: 'wallet-no-chain-check',
        name: 'Missing Chain ID Validation',
        description: 'Not checking chain ID before transactions can result in wrong-network operations.',
        severity: 'high',
        language: 'javascript',
        category: 'wallet',
        pattern: /sendTransaction\s*\((?![\s\S]{0,200}chainId)/,
        fix: 'Validate chainId matches expected network before sending transactions.',
    },
    {
        id: 'wallet-address-storage',
        name: 'Wallet Address in localStorage',
        description: 'Storing wallet addresses in localStorage may leak user identity.',
        severity: 'medium',
        language: 'javascript',
        category: 'wallet',
        pattern: /localStorage\.setItem\s*\([^,]*(?:address|wallet|account)/i,
        fix: 'Use session storage or avoid storing wallet data persistently.',
    },
    {
        id: 'wallet-console-log',
        name: 'Logging Sensitive Wallet Data',
        description: 'Console logging wallet data can expose sensitive information.',
        severity: 'medium',
        language: 'javascript',
        category: 'wallet',
        pattern: /console\.log\s*\([^)]*(?:privateKey|mnemonic|signer|wallet)/i,
        fix: 'Remove console.log statements with sensitive wallet information.',
    },
    {
        id: 'wallet-no-simulation',
        name: 'Missing Transaction Simulation',
        description: 'Transaction sent without simulation to preview outcome.',
        severity: 'medium',
        language: 'javascript',
        category: 'wallet',
        pattern: /sendTransaction\s*\((?![\s\S]{0,300}simulate|[\s\S]{0,300}estimateGas)/,
        fix: 'Use eth_call or simulation services to preview transaction outcome.',
    },
    {
        id: 'wallet-hardcoded-mainnet',
        name: 'Hardcoded Mainnet Address',
        description: 'Production contract addresses hardcoded in development environment.',
        severity: 'high',
        language: 'javascript',
        category: 'wallet',
        pattern: /0x[a-fA-F0-9]{40}.*(?:mainnet|production)/i,
        fix: 'Use environment variables for contract addresses. Separate dev/prod configs.',
    },
    {
        id: 'wallet-no-address-validation',
        name: 'No Recipient Address Validation',
        description: 'Recipient address not validated, risking funds sent to wrong address.',
        severity: 'high',
        language: 'javascript',
        category: 'wallet',
        pattern: /sendTransaction\s*\(\s*\{[^}]*to\s*:\s*[a-zA-Z_][a-zA-Z0-9_]*(?!\s*\.isAddress)/,
        fix: 'Validate addresses with ethers.utils.isAddress() before sending.',
    },
];

// Combine all patterns
export const allWeb3Patterns: Web3Pattern[] = [
    ...solidityPatterns,
    ...solanaPatterns,
    ...movePatterns,
    ...funcPatterns,
    ...walletPatterns,
];

// Helper to detect file language
export function detectWeb3Language(filename: string): Web3Pattern['language'] | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, Web3Pattern['language']> = {
        'sol': 'solidity',
        'rs': 'rust',
        'move': 'move',
        'fc': 'func',
        'func': 'func',
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
    };
    return langMap[ext || ''] || null;
}

// Get patterns for a specific language
export function getPatternsForLanguage(language: Web3Pattern['language']): Web3Pattern[] {
    // TypeScript patterns are same as JavaScript
    const lang = language === 'typescript' ? 'javascript' : language;
    return allWeb3Patterns.filter(p => p.language === lang);
}
