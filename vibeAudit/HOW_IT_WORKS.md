# How VibeAudit Works 🛠️

VibeAudit is an autonomous security intelligence agent that uses **Reinforcement Learning (RL)** and **4-layer AI Analysis** to find vulnerabilities in smart contracts across **EVM, Solana, and SUI**.

---

## 🏗️ Architecture

The system is built on 4 layers:

1. **Layer 1: Core Tools** (Scanning & Execution)
2. **Layer 2: Pipeline Engine** (6-Stage Exploit Generation)
3. **Layer 3: Autonomous Agent** (Discovery, Intelligence, Simulation, Learning)
4. **Layer 4: Testing UI** (Interactive Dashboard)

### New: Chain Provider Abstraction

Unlike typical tools that are hardcoded for EVM (ethers.js), VibeAudit uses a **Chain Provider Layer** (`src/chains/`) to abstract blockchain interactions:

- **EVM Provider**: Wraps ethers.js + Etherscan. Handles proxy detection, token info, AI decompilation.
- **Solana Provider**: Wraps `@solana/web3.js`. Handles Anchor IDL, SPL Tokens, BPF AI disassembly.
- **SUI Provider**: Wraps `@mysten/sui`. Handles Move packages, Coin detection, on-chain module reconstruction.

This allows the **same autonomous agent logic** to work across completely different blockchain architectures.

---

## 🧠 The Agent Loop

The agent runs an infinite loop of:

1. **Discovery**: Watches for new contracts, high-value transactions, and suspicious patterns across all supported chains.
2. **Triage**: Rapidly scores targets based on TVL, code complexity, and past learnings.
3. **Intelligence**: Gathers deep on-chain data (bytecode, source provided/decompiled, storage slots, transaction history) via the appropriate Chain Provider.
4. **Analysis**: Runs 4 specialized AI analyzers in parallel:
   - **Deep Contract**: Architecture, access control, fund flow.
   - **Process Flow**: State machine transitions, user journeys.
   - **Frontend Interaction**: ABI surface, phishing vectors.
   - **Bridge Security**: Cross-chain messaging patterns.
5. **Simulation** (EVM only): Generates Foundry exploit tests, runs them on a forked mainnet, and confirms/denies findings.
6. **Learning**: Updates the RL database with results — effectively "learning" which patterns are real vulnerabilities vs false positives.

---

## 🤖 4-Layer Analysis

Each layer uses specialized AI prompts that are **chain-aware**:

- **Solidity**: Checks reentrancy, overflow, delegatecall risks.
- **Rust/Anchor**: Checks PDA derivation, account validation, CPI constraints.
- **Move**: Checks resource safety, capability permissions, shared object access.

### 1. Deep Analyis (`contract-deep.ts`)
Analyzes the structural integrity. Does it follow standards (ERC-20/SPL)? Are admin controls centralized?

### 2. Process Flow (`process-flow.ts`)
Maps the contract as a state machine. What are the valid transitions? Where can a user get stuck?

### 3. Frontend Interaction (`frontend-interaction.ts`)
Analyzes the ABI surface. Are there phishing vectors? Can a transaction be front-run?

### 4. Bridge Security (`bridge-security.ts`)
Checks for known cross-chain patterns (Wormhole, LayerZero, etc.) and specific vulnerabilities like signature replay or validator compromise.

---

## 🧪 Simulation & Verification

For EVM chains (Ethereum, Arbitrum, Base, etc.), VibeAudit goes a step further:

1. **Generate**: AI writes a complete `Foundry` test file (`Exploit.t.sol`) targeting the specific vulnerability.
2. **Execute**: Runs `forge test --fork-url <RPC>` to execute the exploit against the real mainnet state.
3. **Validate**: If the test passes (e.g., balance increases), the vulnerability is **CONFIRMED**. If it fails, it's marked **DENIED**.

> **Note**: For Solana and SUI, simulation is currently AI-based confidence scoring, as on-chain fork testing tools (like Foundry) are not yet fully integrated.

---

## 📚 Reinforcement Learning

The agent uses a persistent SQLite database (`memory.sqlite`) to learn:

- **Pattern Confidence**: "This Reentrancy pattern was false positive 80% of the time -> lower score."
- **Severity Calibration**: "This 'High' usage of `tx.origin` never results in an exploit -> demote to 'Low'."
- **Triage Weights**: "Contracts with >$1M TVL and unverified source yield the most bugs -> prioritize."

This means VibeAudit **gets smarter the longer it runs**.
