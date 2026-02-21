# VibeAudit Execution Pipeline

## Modes

1. **Analyze Mode (`analyze`)**
- Works for single targets and project/repo paths.
- Supports `recon | validate | exploit` engagement modes.
- Multi-chain execution path (EVM/Solana/Sui).

2. **Autonomous Agent Mode (`agent`)**
- EVM-focused deployment watcher + triage queue + ReAct execution.

3. **UI Mode (`ui`)**
- Run orchestration, live stream of thoughts/actions/observations,
- approval controls,
- attack-tree updates,
- export retrieval.

## Stages (Analyze/UI)

1. Target/context initialization
2. Intelligence gathering (provider-based, chain-agnostic)
3. Attack strategy seeding
4. Optional approval grant for execution scopes
5. ReAct loop execution with tool calls
6. Bundle export (`reports/<runId>/...`)

## Defensive Guardrails

Execution scopes are blocked until approved:
- `execute_exploit`
- `generate_fuzz_campaign`
- non-EVM chain simulation execution path

Approval is run-scoped and time-bound.
