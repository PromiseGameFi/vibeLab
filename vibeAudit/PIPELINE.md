# 6-Stage Exploit Generation Pipeline

## Overview

The VibeAudit pipeline has two modes:
1. **Autonomous Agent Loop** (Multi-Chain: EVM, Solana, SUI)
2. **Exploit Generation Pipeline** (EVM Only: Ethereum, Arbitrum, Base, BSC)

---

## 🌍 Mode 1: Autonomous Agent (Multi-Chain)

The agent runs continuously, watching chains for new contracts and high-value targets.

**Supported Chains**: Ethereum, Sepolia, BSC, Arbitrum, Base, Solana, SUI.

1. **Discovery**: Monitor blocks/mempool for new deployments or large transfers.
2. **Triage**: Score targets based on TVL, code size, and complexity.
3. **Intelligence Gathering**:
   - **EVM**: Decompile bytecode, detect proxies, fetch source from Etherscan.
   - **Solana**: Fetch Anchor IDL, disassemble BPF, check SPL metadata.
   - **SUI**: Reconstruct Move modules from on-chain package data.
4. **4-Layer Analysis** (Deep, Process, Frontend, Bridge):
   - AI prompts adapt to the specific language (Solidity / Rust / Move).
   - Generates a **Security Report** with risk scores and theoretical vulnerabilities.

---

## ⚡ Mode 2: Exploit Generation (EVM Only)

For EVM targets, the pipeline continues into active exploitation:

### Stage 1: Reconnaissance (`pipeline/recon.ts`)
- Deep ABI analysis.
- Storage slot mapping.
- Inherited contract graph.
- Function permission check (onlyOwner, etc).

### Stage 2: Static Analysis (`pipeline/static-analysis.ts`)
- Identify low-hanging fruit: reentrancy, integer overflow (pre-0.8.0), unchecked return values, tx.origin usage.

### Stage 3: AI Vulnerability Analysis (`pipeline/ai-analysis.ts`)
- Feeds contract source + static findings to **Groq LLM**.
- Asks for specific logical bugs: business logic flaws, access control bypasses, price manipulation.

### Stage 4: Strategy Formulation (`pipeline/strategy.ts`)
- Converts vulnerabilities into concrete attack plans.
- Example: *"Flash loan 1000 ETH -> call `deposit()` -> call `exploit()` -> repay loan -> profit."*

### Stage 5: Exploit Generation (`pipeline/exploit-gen.ts`)
- AI writes a complete **Foundry test file** (`Exploit.t.sol`).
- Includes necessary interfaces, setUp() logic, and the attack sequence.

### Stage 6: Execution & Verification (`pipeline/executor.ts`)
- Runs `forge test --fork-url <RPC>`.
- **Self-Healing**: If compilation fails, valid output errors are fed back to the AI to fix the code (up to 3 retries).
- **Confirmation**: If the test passes and profit is realized, the exploit is confirmed.
