# VibeAudit — Product Requirements & Architecture Document

> **Version**: 1.0.0  
> **Last Updated**: 2026-02-19  
> **Status**: Phase 1–3 Complete (Core + Intelligence + Testing UI)

---

## 1. Vision

VibeAudit is an **autonomous AI-powered security intelligence agent** for smart contracts. It goes beyond static analysis — it discovers targets on-chain, gathers deep intelligence, runs 4-layer AI analysis, simulates exploits on forked chains, and **learns from every engagement** to get better over time.

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
│ 6-stage │ │or.ts│ │scan │ │nch  │ │  (autonomous)   │ │test  │
│ engine  │ │     │ │     │ │     │ │                 │ │server│
└─────────┘ └─────┘ └─────┘ └──────┘ └────────────────┘ └──────┘
```

The codebase has **3 distinct layers**:

| Layer | Purpose | Files |
|---|---|---|
| **Layer 1: Core Tools** | Single-shot scanning, AI exploit gen, Foundry execution | `scanner.ts`, `auditor.ts`, `onchain.ts`, `exploit-runner.ts`, `reporter.ts`, `mev-scanner.ts`, `evmbench.ts` |
| **Layer 2: Pipeline Engine** | 6-stage automated pipeline (recon → static → AI → strategy → exploit-gen → execution) | `pipeline/index.ts`, `recon.ts`, `static-analysis.ts`, `ai-analysis.ts`, `strategy.ts`, `exploit-gen.ts`, `executor.ts` |
| **Layer 3: Autonomous Agent** | Self-running agent with discovery, triage, intelligence, simulation, and reinforcement learning | `agent/agent.ts`, `watcher.ts`, `mempool.ts`, `queue.ts`, `triage.ts`, `memory.ts`, `dashboard.ts`, `notify.ts`, `intel-gatherer.ts`, `exploit-simulator.ts`, `learning.ts`, `analyzers/*`, `report-generator.ts` |
| **Layer 4: Testing UI** | Web interface for interactive pipeline runs with SSE progress | `ui/testing-server.ts` |

---

## 3. Codebase Inventory

### 3.1 Total Size
- **33 TypeScript source files**
- **~9,857 lines of code**
- **~280 KB** of source

### 3.2 File Map

```
vibeAudit/
├── src/
│   ├── main.ts                        (511 lines)  CLI entry — 7 commands
│   ├── scanner.ts                      (39 lines)  Directory .sol scanner
│   ├── auditor.ts                     (183 lines)  AI vulnerability detection
│   ├── onchain.ts                     (154 lines)  Etherscan + RPC contract fetcher
│   ├── exploit-runner.ts              (263 lines)  Foundry test runner
│   ├── reporter.ts                    (150 lines)  Markdown report generator
│   ├── mev-scanner.ts                 (113 lines)  MEV opportunity scanner
│   ├── evmbench.ts                    (257 lines)  EVM exploit benchmark
│   ├── utils.ts                        (46 lines)  Foundry check, RPC helper
│   │
│   ├── pipeline/                      (6-stage engine)
│   │   ├── index.ts                   (245 lines)  Pipeline orchestrator
│   │   ├── recon.ts                   (416 lines)  Deep reconnaissance
│   │   ├── static-analysis.ts         (286 lines)  Pattern-based static checks
│   │   ├── ai-analysis.ts            (319 lines)  AI vulnerability analysis
│   │   ├── strategy.ts               (229 lines)  Attack strategy planner
│   │   ├── exploit-gen.ts            (160 lines)  AI exploit code generator
│   │   └── executor.ts               (334 lines)  Foundry self-healing runner
│   │
│   ├── agent/                         (autonomous intelligence)
│   │   ├── agent.ts                   (500 lines)  Main agent loop
│   │   ├── watcher.ts                 (297 lines)  Multi-chain block watcher
│   │   ├── mempool.ts                 (153 lines)  Pending tx mempool monitor
│   │   ├── queue.ts                   (160 lines)  Priority target queue
│   │   ├── triage.ts                  (219 lines)  Target triage + RL scoring
│   │   ├── memory.ts                  (356 lines)  SQLite persistent memory
│   │   ├── dashboard.ts              (206 lines)  Terminal dashboard (blessed)
│   │   ├── notify.ts                  (220 lines)  Webhook/Telegram notifications
│   │   ├── intel-gatherer.ts          (708 lines)  Deep on-chain intelligence
│   │   ├── exploit-simulator.ts       (476 lines)  Fork-based exploit simulation
│   │   ├── learning.ts               (500 lines)  RL database & pattern learning
│   │   └── analyzers/
│   │       ├── contract-deep.ts       (170 lines)  Contract architecture analysis
│   │       ├── process-flow.ts        (174 lines)  State machine / flow analysis
│   │       ├── frontend-interaction.ts(194 lines)  ABI surface / phishing vectors
│   │       ├── bridge-security.ts     (228 lines)  Bridge-specific analysis
│   │       └── report-generator.ts    (422 lines)  Unified security report
│   │
│   └── ui/
│       └── testing-server.ts         (1169 lines)  Express + SSE testing UI
│
├── test-contracts/
│   └── VulnerableVault.sol                          Test target
│
├── .env.example                                     Configuration template
├── package.json                                     Dependencies
├── tsconfig.json                                    TypeScript config
├── README.md                                        User guide
├── HOW_IT_WORKS.md                                  Architecture docs
├── PIPELINE.md                                      Pipeline docs
└── research.md                                      Research notes
```

---

## 4. CLI Commands

| Command | Script | Description |
|---|---|---|
| `attack` | `npm run attack -- -a 0x...` | Fetch on-chain contract → AI exploit gen → Foundry execution |
| `exploit` | `npm run exploit -- ./file.sol` | Local .sol file → full 6-stage pipeline |
| `mev` | `npm run mev -- -r <rpc>` | Scan recent blocks for MEV opportunities |
| `evmbench` | `npm run evmbench` | Run EVM exploit benchmarks |
| `agent` | `npm run agent` | Start autonomous agent (discover → triage → analyze → simulate → learn) |
| `analyze` | `npm start analyze <addr>` | Single-shot full intelligence pipeline on a contract |
| `ui` | `npm run ui` | Launch interactive web testing UI on port 4041 |

---

## 5. Module Deep-Dive

### 5.1 Layer 1: Core Tools

| Module | What It Does |
|---|---|
| **scanner.ts** | Walks directories to find `.sol` files |
| **auditor.ts** | Sends Solidity to Groq AI, extracts vulnerability findings as structured JSON |
| **onchain.ts** | Fetches contract source (Etherscan), bytecode, balance, name via RPC + API |
| **exploit-runner.ts** | Creates Foundry projects, writes exploit tests, runs `forge test`, parses results |
| **reporter.ts** | Generates markdown attack/MEV reports |
| **mev-scanner.ts** | Scans blocks for high-value transactions and MEV patterns |
| **evmbench.ts** | Benchmark suite for AI exploit detection and attack generation |

### 5.2 Layer 2: Pipeline Engine (6 Stages)

```
Recon → Static Analysis → AI Analysis → Strategy → Exploit Gen → Execution
```

| Stage | File | What It Does |
|---|---|---|
| 1. **Recon** | `recon.ts` | ABI extraction, inheritance mapping, function classification, permission analysis, state variable cataloging |
| 2. **Static** | `static-analysis.ts` | Pattern-based checks: reentrancy, overflow, access control, oracle manipulation, flash loan, frontrunning |
| 3. **AI Analysis** | `ai-analysis.ts` | Groq LLM deep analysis with contract context, generates rated vulnerability list |
| 4. **Strategy** | `strategy.ts` | Maps vulnerabilities to attack strategies with setup/execution/profit steps |
| 5. **Exploit Gen** | `exploit-gen.ts` | AI generates complete Foundry test code per strategy |
| 6. **Execution** | `executor.ts` | Runs exploits via `forge test`, self-heals compilation errors (up to N retries) |

### 5.3 Layer 3: Autonomous Agent

The agent runs a continuous loop:

```
┌──────────┐    ┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐
│ Discover │───▶│ Triage │───▶│  Intel   │───▶│ 4-Layer  │───▶│ Simulate │───▶│  Learn   │───▶│ Report │
│ (watch)  │    │(score) │    │(gather)  │    │ Analysis │    │ (fork)   │    │ (RL DB)  │    │(notify)│
└──────────┘    └────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘
```

| Module | Lines | What It Does |
|---|---|---|
| **agent.ts** | 500 | Main loop: dequeue → triage → intel → analyze → simulate → learn → report → notify |
| **watcher.ts** | 297 | Multi-chain block watcher (Ethereum, BSC, Sepolia, Base, Arbitrum). Monitors new contracts, high-value txs, suspicious patterns |
| **mempool.ts** | 153 | Pending transaction monitor for frontrunning / sandwich detection |
| **queue.ts** | 160 | Priority queue with balance-weighted scoring, dedup, persistence |
| **triage.ts** | 219 | Quick evaluation before expensive pipeline. Checks: already analyzed? code size? balance? learned weights? |
| **memory.ts** | 356 | SQLite persistent memory — targets, reports, findings, stats. Survives restarts |
| **dashboard.ts** | 206 | Live terminal dashboard with stats, queue, recent findings |
| **notify.ts** | 220 | High-risk alert delivery: webhooks, Telegram, Discord |
| **intel-gatherer.ts** | 708 | Deep on-chain collection: bytecode, source/decompile, ABI, storage slots, proxy detection, token info, tx history, deployer, owner, related contracts. AI-powered decompilation fallback |
| **exploit-simulator.ts** | 476 | AI generates Foundry exploit tests → runs on forked chain → confirms/denies each finding |
| **learning.ts** | 500 | SQLite RL database. Records outcomes (confirmed/denied per category/contract type), learns pattern confidence, severity calibration, adaptive triage weights, bytecode pattern matching |

### 5.4 Analysis Modules (4-Layer)

| Analyzer | Lines | What It Analyzes |
|---|---|---|
| **contract-deep.ts** | 170 | Token compliance, upgrade mechanics, access control, fund flow, dependencies, overall risk |
| **process-flow.ts** | 174 | State machine, transitions, user journeys, ordering risks, time dependencies, economic flows |
| **frontend-interaction.ts** | 194 | ABI surface, approval chains, tx ordering risks, gas patterns, phishing vectors, event reliance |
| **bridge-security.ts** | 228 | Bridge type detection, message verification, lock/mint mechanics, finality risks, admin key risks, known exploit patterns |
| **report-generator.ts** | 422 | Combines all 4 analyses into unified SecurityReport with overall risk score (0-100) |

### 5.5 Testing UI

| Module | Lines | What It Does |
|---|---|---|
| **testing-server.ts** | 1169 | Express server + SSE. Premium dark UI (VibeLab design system). 6-step progress visualization, contract intelligence grid, findings with simulation badges, analysis history, learning stats |

---

## 6. Data Flow (analyze command)

```
User: npm start analyze 0xContractAddress --chain ethereum

1. gatherIntel()
   → RPC: eth_getCode, eth_getBalance, eth_getTransactionCount
   → Etherscan: source code, ABI, contract name
   → AI decompile (if no source)
   → Storage slot reads (proxy detection, owner, admin)
   → Token detection (ERC-20/721/1155)
   → Returns: ContractIntel object

2. Four parallel AI analysis calls:
   → analyzeContractDeep(code)    → ContractDeepAnalysis
   → analyzeProcessFlow(code)     → ProcessFlowAnalysis
   → analyzeFrontendInteraction() → FrontendAnalysis
   → analyzeBridgeSecurity()      → BridgeAnalysis

3. extractFindings(code, intel)
   → AI extracts structured VulnerabilityFinding[] with severity, category, affected function

4. simulateExploits(intel, findings, rpcUrl)
   → For each finding: AI generates Foundry test
   → Fork mainnet at current block
   → Run forge test → parse pass/fail
   → Returns: SimulationReport (confirmed/denied counts)

5. LearningEngine.recordOutcome()
   → Stores: category, contractType, wasConfirmed, severity, features
   → Updates: pattern confidence, severity calibration
   → Matches: bytecode patterns from past encounters

6. generateSecurityReport()
   → Combines all analyses → overallRiskScore (0-100)
   → Saves .md and .json to audit_reports/
```

---

## 7. Technology Stack

| Component | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js (ts-node) |
| AI Provider | **Groq** (`llama-3.3-70b-versatile` via OpenAI SDK) |
| Blockchain | ethers.js v6 |
| Exploit Execution | Foundry (forge test) |
| Database | better-sqlite3 (learning + memory) |
| Web Server | Express.js |
| Real-time | Server-Sent Events (SSE) |
| CLI Framework | Commander.js |
| Notifications | Webhooks, Telegram, Discord |

---

## 8. Dependencies

```json
{
  "axios": "^1.13.5",        // HTTP requests
  "chalk": "^4.1.2",         // Terminal colors
  "commander": "^11.1.0",    // CLI framework
  "dotenv": "^16.4.5",       // Env config
  "ethers": "^6.16.0",       // Blockchain interactions
  "glob": "^10.3.10",        // File globbing
  "openai": "^4.28.4",       // Groq API (OpenAI-compatible)
  "better-sqlite3": "^11.7.0", // Persistent storage
  "express": "^4.21.0",      // Testing UI server
  "ws": "^8.18.0"            // WebSocket (dashboard)
}
```

---

## 9. Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Groq API key |
| `AI_MODEL` | ❌ | `llama-3.3-70b-versatile` | AI model for all analysis |
| `DEFAULT_RPC` | ❌ | `https://dream-rpc.somnia.network` | Default RPC endpoint |
| `ETHERSCAN_API_KEY` | ❌ | — | For fetching verified source code |
| `FORK_BLOCK` | ❌ | `latest` | Block number for forge fork tests |
| `POLL_INTERVAL` | ❌ | `12000` | Block polling interval (ms) |
| `LOOP_INTERVAL` | ❌ | `5000` | Agent main loop interval (ms) |
| `WEBHOOK_URL` | ❌ | — | High-risk alert webhook |
| `TELEGRAM_BOT_TOKEN` | ❌ | — | Telegram alerts |
| `DISCORD_WEBHOOK` | ❌ | — | Discord alerts |

---

## 10. Current Status

### ✅ Complete
- [x] Core scanning & exploit tools (Layer 1)
- [x] 6-stage pipeline engine (Layer 2)
- [x] Autonomous agent with discovery, triage, queue, memory (Layer 3)
- [x] 4-layer AI analysis modules (contract-deep, process-flow, frontend, bridge)
- [x] Deep on-chain intelligence gathering (708-line intel module)
- [x] Fork-based exploit simulation (AI-generated Foundry tests)
- [x] Reinforcement learning database (pattern confidence, severity calibration, adaptive triage)
- [x] Interactive testing UI with SSE progress (VibeLab design system)
- [x] Groq API integration (switched from OpenRouter)
- [x] TypeScript compiles cleanly (0 errors)

### 🔲 Remaining
- [ ] End-to-end test on Sepolia testnet
- [ ] Production deployment (Docker)
- [ ] CI/CD pipeline
- [ ] Rate limiting & retry logic for Groq API
- [ ] Multi-model support (different models for different analysis types)
- [ ] Historical trend analysis in learning engine
- [ ] Export learning database for team sharing

---

## 11. Running the Project

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your Groq API key

# Quick test
npm run exploit -- ./test-contracts/VulnerableVault.sol

# Full analysis of an on-chain contract
npm start analyze 0xContractAddress --chain ethereum

# Start autonomous agent
npm run agent

# Launch testing UI
npm run ui
# Open http://localhost:4041
```

---

## 12. Design Decisions

1. **Groq over OpenRouter**: Faster inference, simpler pricing, OpenAI-compatible SDK
2. **SQLite for Learning**: Zero-config persistence, survives restarts, single-file database
3. **Fork-based Simulation**: No real transactions, safe testing on mainnet state
4. **4-Layer Analysis**: Each layer catches different vulnerability classes — defense in depth
5. **SSE over WebSockets**: Simpler for unidirectional progress streaming, auto-reconnect built-in
6. **VibeLab Design System**: Consistent dark aesthetic across all VibeLab products
