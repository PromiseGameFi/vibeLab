# VibeAudit PRD (V2 Hardening)

## Product Direction

VibeAudit is an autonomous, human-in-the-loop security platform for protocol and contract analysis using a Continuous Reasoning (ReAct) engine.

### Enforced Defaults

- Authorized defensive mode
- Explicit per-run execution approval
- Incremental architecture hardening (no greenfield rewrite)
- Multi-chain execution path in one codebase (EVM, Solana, Sui)

## Key Interfaces

### CLI

- `analyze <target> --chain <chain> [--project] [--rpc <url>] [--mode recon|validate|exploit] [--approve]`
- `exploit <target>` compatibility shim
- `attack <target>` compatibility shim
- `agent`, `ui`
- `mev`, `evmbench` explicit defensive-mode constraints

### HTTP (UI Server)

- `POST /api/analyze`
- `POST /api/approve`
- `POST /api/reply`
- `GET /api/run/:runId` (includes `approvalState`, `attackTree`)
- `GET /api/history`
- `GET /api/export/:runId`

### ReAct Tool Contract

Stateful/execution tools require `runId` and return structured JSON:
- `generate_exploit`
- `execute_exploit`
- `generate_fuzz_campaign`
- `ask_human`
- `load_project_files`
- `analyze_architecture`

## Core Components

1. `src/agent/engagement.ts`
- Run context, approval snapshot, attack tree, operator note injection, evidence.

2. `src/agent/approval.ts`
- Run-scoped token grants (TTL + scopes).

3. `src/chains/*`
- Provider abstraction + chain-native simulation API.
- Broadcast disabled by default in defensive mode.

4. `src/agent/react/loop.ts`
- ReAct loop with context injection, tool execution, evidence capture, export path.

5. `src/agent/exporter.ts`
- Deterministic run bundle export to `reports/<runId>/`.

## Acceptance Criteria

- Documented commands resolve to real code paths.
- Execution/fuzz/simulation blocked without approval.
- `/api/run/:runId` and `/api/history` return persisted run truth.
- Attack tree streamed in UI and exported in run bundle.
- Findings feed memory for triage priors.
