# VibeAudit 🛡️

**Autonomous AI-Powered Security Intelligence Agent (V2 ReAct Engine)**

VibeAudit is an enterprise-grade autonomous security agent. Powered by a dynamic **ReAct (Reasoning and Acting)** loop, it autonomously discovers contracts, maps architectures, builds dynamic attack trees, and executes exploits via a sophisticated Tool Registry.

> ⚠️ **DISCLAIMER**: For authorized testing and educational purposes only.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Groq API key
```

## 🧪 Testing UI

Launch the interactive web interface:
```bash
npm run ui
# Open http://localhost:4041
```

## ⚔️ Commands

### Analyze a Single Contract/Program
The standalone pipeline has been replaced by the autonomous ReAct Engine. The agent will read sources, analyze code, and run simulated exploits iteratively.

```bash
# EVM (Ethereum, Arbitrum, Base, BSC, Sepolia)
npm start analyze 0xContractAddress --chain ethereum

# Solana (Mainnet, Devnet)
npm start analyze ProgramID --chain solana

# SUI (Mainnet, Testnet)
npm start analyze PackageID --chain sui
```

### Attack Mode (EVM Only)
Fetch on-chain contract → AI generates exploits → Foundry runs them:
```bash
npm run attack -- -a 0xContractAddress -r https://rpc-url
```

### Exploit Local Files (EVM Only)
Point at `.sol` files → full 6-stage pipeline:
```bash
npm run exploit -- ./contracts/Target.sol
npm run exploit -- ./contracts/
```

### Autonomous Agent
Continuously discover, triage, analyze, simulate, and learn (all supported chains):
```bash
npm run agent
```

### MEV Scanner (EVM Only)
Scan recent blocks for profitable exploit opportunities:
```bash
npm run mev -- -r https://rpc-url -b 100
```

## 📄 Output

Reports are generated in `audit_reports/` with:
- **Risk score** (0–100) across 4 analysis layers (Deep, Flow, Frontend, Bridge)
- **Confirmed exploits** packaged as standalone Foundry `Target.t.sol` proofs (Proof of Hack)
- **Contract intelligence** (proxy, token, balance, deployer, source)
- **Attack Tree Analytics** tracking the agent's pivoted paths and logic

## 🧪 Test It

A deliberately vulnerable contract is included:
```bash
npm run exploit -- ./test-contracts/VulnerableVault.sol
```

## ⚙️ Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Required. Your Groq API key |
| `SOLANA_RPC` | Optional. Solana RPC URL |
| `SUI_RPC` | Optional. SUI RPC URL |
| `DEFAULT_RPC` | Optional. EVM Default RPC |
| `ETHERSCAN_API_KEY` | Optional. For fetching verified EVM source |
| `FORK_BLOCK` | Block number for Foundry fork tests |

## 📐 Architecture

See [auditprd.md](./auditprd.md) for the full architecture document.

```
src/
├── main.ts              CLI entry
├── chains/              Chain Providers (EVM, Solana, SUI)
├── agent/               Autonomous intelligence agent
│   ├── agent.ts         Main ReAct loop entrypoint
│   └── react/           Core AI reasoning engine
│       ├── tools/       Capabilities (read_source, generate_fuzz_campaign, ask_human)
│       ├── strategist.ts Dynamic attack tree generation
│       ├── loop.ts      The core ReAct Thought/Action/Observation matrix
│       └── memory.ts    LLM context and scratchpad management
└── ui/                  Interactive testing UI with Attack Tree Visualization
```
