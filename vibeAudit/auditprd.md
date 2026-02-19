# VibeAudit — Product Requirements & Architecture Document

> **Version**: 2.0.0 (Enterprise ReAct Edition)
> **Last Updated**: 2026-02-19  
> **Status**: Transitioning to autonomous ReAct Tool-calling engine with HitL and Fuzzing.

---

## 1. Vision

VibeAudit is an **autonomous AI-powered security intelligence agent** for smart contracts across **EVM, Solana, and SUI**. It has evolved from a static pipeline into a dynamic **ReAct (Reasoning and Acting)** loop. The agent dynamically explores smart contracts, maps dependencies with `analyze_architecture`, builds physical attack trees, interacts with operators via a Human-in-the-Loop (`ask_human`) tool, and spins up `generate_fuzz_campaign` invariant properties until a "Proof of Hack" can be exported to Immunefi.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI (main.ts)                            │
│  attack │ exploit │ mev │ evmbench │ agent │ analyze │ ui      │
└────┬────────┬────────┬──────┬────────┬────────┬────────┬───────┘
     │        │        │      │        │        │        │
     ▼        ▼        ▼      ▼        ▼        ▼        ▼
┌─────────┐ ┌─────┐ ┌─────┐ ┌──────┐ ┌────────────────┐ ┌──────┐
│pipeline/│ │audit│ │mev  │ │evmbe│ │  agent/         │ │ui/   │
│ (EVM)   │ │or.ts│ │scan │ │nch  │ │  (autonomous)   │ │test  │
│         │ │     │ │     │ │     │ │                 │ │server│
└─────────┘ └─────┘ └─────┘ └──────┘ └───────┬────────┘ └──────┘
                                             │
      ┌──────────────────────────────────────▼─────────────────────┐
      │  Chain Provider Abstraction (src/chains/)                  │
      │ ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
      │ │ EVMProvider │  │SolanaProvider│  │ SUIProvider  │       │
      │ └─────────────┘  └──────────────┘  └──────────────┘       │
      └────────────────────────────────────────────────────────────┘
```

The codebase has **3 distinct layers**, now with a **Chain Abstraction Layer**:

| Layer | Purpose | Files |
|---|---|---|
| **Layer 1: Core Toolset** | Single-shot capabilities exposed to the LLM (read_source, check_storage, generate_fuzz_campaign, ask_human). | `src/agent/react/tools/*` |
| **Layer 2: ReAct Engine** | The autonomous Thought -> Action -> Observation loop that drives target exploration. | `src/agent/react/loop.ts`, `memory.ts` |
| **Layer 3: Attack Strategist** | Builds dynamic node-based attack trees based on chain priors and actively prunes failed branches. | `src/agent/react/strategist.ts` |
| **Layer 4: Dashboard & UI** | Cypherpunk-themed interactive testing UI with live node-graphs, web3 wallet loading, and "Live Chat" agent steering. | `src/ui/testing-server.ts` |
| **Chain Layer** | Abstracts EVM, Solana, SUI differences | `src/chains/chain-provider.ts`, `evm-provider.ts`, `solana-provider.ts`, `sui-provider.ts` |

---

## 3. Codebase Inventory

### 3.1 Total Size
- **38 TypeScript source files**
- **~10,600 lines of code**
- **~300 KB** of source

### 3.2 Key Modules

#### Chain Providers (`src/chains/`)
- **chain-provider.ts**: Interface + shared types (`ChainIntel`, `ProgramInfo`)
- **evm-provider.ts**: Wraps ethers.js + Etherscan. Handles proxy detection, token info, AI decompilation.
- **solana-provider.ts**: Wraps `@solana/web3.js`. Handles Anchor IDL, SPL Tokens, BPF AI disassembly.
- **sui-provider.ts**: Wraps `@mysten/sui`. Handles Move packages, Coin detection, on-chain module reconstruction.

#### Agent Layer (`src/agent/`)
- **intel-gatherer.ts**: Delegates to appropriate chain provider for deep intelligence.
- **exploit-simulator.ts**:
  - **EVM**: Runs `forge test` on forked chain.
  - **Solana/SUI**: Runs AI-only confidence analysis (simulation strictly EVM for now).
- **analyzers/**: All 4 analysis modules (`contract-deep`, `process-flow`, `frontend-interaction`, `bridge-security`) use **chain-aware AI prompts** adapting to Solidity, Rust/Anchor, or Move.

---

## 4. Supported Chains

| Chain | Type | Features |
|---|---|---|
| **Ethereum** | EVM | Full support (Intel + Analysis + Simulation) |
| **Sepolia** | EVM | Full support |
| **BSC** | EVM | Full support |
| **Arbitrum** | EVM | Full support |
| **Base** | EVM | Full support |
| **Solana** | Non-EVM | Intel + AI Analysis (Rust/Anchor aware) |
| **SUI** | Non-EVM | Intel + AI Analysis (Move aware) |

---

## 5. Technology Stack

| Component | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js (ts-node) |
| AI Provider | **Groq** (`llama-3.3-70b-versatile` via OpenAI SDK) |
| EVM Interaction | ethers.js v6 |
| Solana Interaction | @solana/web3.js |
| SUI Interaction | @mysten/sui |
| Exploit Execution | Foundry (forge test) - EVM only |
| Database | better-sqlite3 (learning + memory) |
| Web Server | Express.js |
| Real-time | Server-Sent Events (SSE) |

---

## 6. Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Groq API key |
| `SOLANA_RPC` | ❌ | `https://api.mainnet-beta.solana.com` | Solana RPC |
| `SUI_RPC` | ❌ | `https://fullnode.mainnet.sui.io:443` | SUI RPC |
| `DEFAULT_RPC` | ❌ | `https://dream-rpc.somnia.network` | EVM RPC |
| `ETHERSCAN_API_KEY` | ❌ | — | For fetching verified EVM source |
| `FORK_BLOCK` | ❌ | `latest` | Block number for forge fork tests |

---

## 7. Current Status

### ✅ Complete
- [x] Core scanning & exploit tools (Layer 1)
- [x] 6-stage pipeline engine (Layer 2)
- [x] Autonomous agent loop (Layer 3)
- [x] **Multi-Chain Support** (EVM, Solana, SUI) via provider abstraction
- [x] 4-layer AI analysis modules (Chain-aware)
- [x] Deep on-chain intelligence gathering (Chain-specific)
- [x] Fork-based exploit simulation (EVM)
- [x] Reinforcement learning database
- [x] Interactive testing UI with SSE progress (VibeLab design system)
- [x] Groq API integration

### 🔲 Remaining (V2 Enterprise Features)
- [ ] Implement `analyze_architecture` module and tool for Project-Level auditing.
- [ ] Implement `ask_human` tool with backend pause/resume suspension logic.
- [ ] Generate fully standalone "Proof of Hack" exploit packages.
- [ ] Implement `generate_fuzz_campaign` and background fuzzer polling.
- [ ] Build the interactive node-based Attack Tree Visualization in HTML.
- [ ] Restyle the UI to a Cypherpunk/Terminal hacking aesthetic.
- [ ] Add Web3 Wallet connection to fetch users' recent deployments.
- [ ] Implement "Live Chat" prompt steering to inject context into running `AgentMemory`.

---

## 8. Running the Project

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your Groq API key

# Analyze an EVM contract
npm start analyze 0xContractAddress --chain ethereum

# Analyze a Solana program
npm start analyze ProgramID --chain solana

# Analyze a SUI package
npm start analyze PackageID --chain sui

# Launch testing UI
npm run ui
# Open http://localhost:4041
```
