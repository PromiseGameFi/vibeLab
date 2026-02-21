# VibeAudit 🛡️

Autonomous, human-in-the-loop smart contract security platform using a Continuous Reasoning (ReAct) engine.

> Authorized defensive testing only.

## Quick Start

```bash
npm install
cp .env.example .env
# set GROQ_API_KEY and RPC/explorer keys as needed
```

## Core Commands

```bash
# Single target (contract/program)
npm start -- analyze <target> --chain ethereum --mode validate

# Project/repository engagement
npm start -- analyze <path-or-repo> --project --chain ethereum --mode exploit --approve

# Compatibility shims
npm run exploit -- <target> --chain ethereum --approve
npm run attack -- <target> --chain ethereum --approve

# Autonomous watcher agent (EVM deployment discovery)
npm run agent

# Testing UI
npm run ui
# http://localhost:4041
```

## Defensive Execution Guard

Execution actions (exploit run, fuzz campaign, non-EVM live simulation) are blocked unless the run is explicitly approved.

- CLI: pass `--approve` for per-run approval.
- UI: use `Approve Execution` button (calls `POST /api/approve`).

## HTTP Endpoints (UI Server)

- `POST /api/analyze` start run
- `POST /api/approve` grant run-scoped execution token
- `POST /api/reply` send human reply/injected operator instruction
- `GET /api/run/:runId` includes `reactStatus`, `reactDetails`, `approvalState`, `attackTree`
- `GET /api/history` persisted run summary (not inferred)
- `GET /api/export/:runId` returns exported run summary

## Output Bundles

Each run exports to `reports/<runId>/` with:

- `summary.json`
- `attack-tree.json`
- `evidence/events.json`
- `evidence/simulation.json` (when available)
- `Exploit.t.sol` + `foundry.toml` (EVM PoH path)
- `HARNESS_TEMPLATE.md` (Solana/Sui simulation replay guidance)

## Chains

- EVM: `ethereum`, `sepolia`, `bsc`, `arbitrum`, `base`, `somnia`
- Solana: `solana`, `solana-devnet`
- Sui: `sui`, `sui-testnet`

## Notes

- `mev` and `evmbench` are intentionally constrained in defensive mode and return explicit guidance.
- Agent watcher discovery remains EVM-oriented; cross-chain analysis/execution is supported in `analyze` and UI flows.
