# VibeAudit 🛡️

**Autonomous AI-Powered Smart Contract Security Intelligence Agent**

VibeAudit discovers contracts on-chain, gathers deep intelligence, runs 4-layer AI analysis, simulates exploits on forked chains, and **learns from every engagement** via reinforcement learning.

> ⚠️ **DISCLAIMER**: For authorized testing and educational purposes only.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Groq API key
```

**Requirements**: [Foundry](https://book.getfoundry.sh/) for exploit execution (optional).

## 🧪 Testing UI

Launch the interactive web interface:
```bash
npm run ui
# Open http://localhost:4041
```

## ⚔️ Commands

### Analyze a Deployed Contract
Full autonomous pipeline: intel → analysis → findings → simulation → learning → report
```bash
npm start analyze 0xContractAddress --chain ethereum
```

### Attack Mode
Fetch on-chain contract → AI generates exploits → Foundry runs them:
```bash
npm run attack -- -a 0xContractAddress -r https://rpc-url
```

### Exploit Local Files
Point at `.sol` files → full 6-stage pipeline:
```bash
npm run exploit -- ./contracts/Target.sol
npm run exploit -- ./contracts/           # entire directory
```

### Autonomous Agent
Continuously discover, triage, analyze, simulate, and learn:
```bash
npm run agent
```

### MEV Scanner
Scan recent blocks for profitable exploit opportunities:
```bash
npm run mev -- -r https://rpc-url -b 100
```

## 📄 Output

Reports are generated in `audit_reports/` with:
- **Risk score** (0–100) across 4 analysis layers
- **Confirmed exploits** verified on forked chain
- **Contract intelligence** (proxy, token, balance, deployer)
- **Learning data** fed back to the RL database

## 🧪 Test It

A deliberately vulnerable contract is included:
```bash
npm run exploit -- ./test-contracts/VulnerableVault.sol
```

## ⚙️ Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Required. Your Groq API key |
| `AI_MODEL` | AI model (default: `llama-3.3-70b-versatile`) |
| `DEFAULT_RPC` | Default RPC for on-chain ops |
| `ETHERSCAN_API_KEY` | Optional. For fetching verified source code |
| `FORK_BLOCK` | Block number for Foundry fork tests |

## 📐 Architecture

See [auditprd.md](./auditprd.md) for the full architecture document.

```
src/
├── main.ts              CLI entry (7 commands)
├── pipeline/            6-stage exploit pipeline
├── agent/               Autonomous intelligence agent
│   ├── agent.ts         Main loop
│   ├── intel-gatherer   Deep on-chain collection
│   ├── exploit-simulator Fork-based testing
│   ├── learning.ts      Reinforcement learning DB
│   └── analyzers/       4-layer analysis modules
└── ui/                  Interactive testing UI
```
