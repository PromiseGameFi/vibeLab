# VibeAudit 🏴‍☠️

**Offensive AI-Powered Smart Contract Attack Tool**

VibeAudit uses **Gemini 2.0 Flash (via OpenRouter)** to find exploitable vulnerabilities in Solidity smart contracts, generate **weaponized Foundry exploit tests**, and **run them automatically** to confirm attacks.

> ⚠️ **DISCLAIMER**: For authorized testing and educational purposes only.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your OpenRouter API key
```

**Requirements**: [Foundry](https://book.getfoundry.sh/) must be installed for exploit execution.

## ⚔️ Three Attack Modes

### 1. Attack an On-Chain Contract
Paste an address → fetch source → AI generates exploits → Foundry runs them:
```bash
npm run attack -- -a 0xContractAddress -r https://rpc-url
```

### 2. Exploit a Local File
Point at `.sol` files → AI generates Foundry tests → auto-runs them:
```bash
npm run exploit -- ./contracts/Target.sol
npm run exploit -- ./contracts/           # entire directory
```

### 3. MEV Scanner
Scan recent blocks for profitable exploit opportunities:
```bash
npm run mev -- -r https://rpc-url -b 100
```

## 📄 Output

Reports are generated in `audit_reports/` with:
- **Confirmed exploits** that passed `forge test`
- **Weaponized PoC code** ready to copy-paste
- **Profit estimates** and attack vectors
- **MEV opportunities** ranked by potential value

## 🧪 Test It

A deliberately vulnerable contract is included:
```bash
npm run exploit -- ./test-contracts/VulnerableVault.sol
```

## ⚙️ Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Required. Your OpenRouter API key |
| `AI_MODEL` | AI model (default: `google/gemini-2.0-flash-exp:free`) |
| `DEFAULT_RPC` | Default RPC for on-chain ops |
| `ETHERSCAN_API_KEY` | Optional. For fetching verified source code |
| `FORK_BLOCK` | Block number for Foundry fork tests |
