# How VibeAudit Works

VibeAudit runs a Continuous Reasoning (ReAct) loop with explicit human approval gates for active execution.

## Runtime Flow

1. **Engagement Context**
- A run context is created (`runId`, target type, chain, mode, approval state, attack tree, evidence).

2. **Planning**
- `AttackStrategist` seeds attack vectors.
- Project mode uses `load_project_files` + `analyze_architecture` for systemic maps.

3. **ReAct Execution**
- The loop performs `Thought -> Tool Action -> Observation` until terminal state.
- Operator instructions are injected live during a run.

4. **Guarded Execution**
- `execute_exploit`, `generate_fuzz_campaign`, and non-EVM live simulations require per-run approval.
- Approval is granted via CLI `--approve` or `POST /api/approve`.

5. **Evidence + Export**
- Tool observations are stored as run evidence.
- Run bundle exports to `reports/<runId>/` with summary + attack tree + chain artifacts.

## Chain Support

- EVM: Foundry-based exploit validation.
- Solana: live simulation via `simulateTransaction` path.
- Sui: live simulation via `devInspectTransactionBlock` path.

Broadcasting is disabled by default in defensive mode.
