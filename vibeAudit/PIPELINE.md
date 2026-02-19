# VibeAudit — 6-Stage Attack Pipeline

## What Was Built

VibeAudit now runs a **6-stage automated attack algorithm** instead of a single AI pass.

## The Pipeline

```mermaid
graph TD
    A[Target .sol] --> B["Stage 1: Recon<br/>Parse functions, state vars,<br/>external calls, attack surface"]
    B --> C["Stage 2: Static Analysis<br/>8 deterministic checks<br/>(reentrancy, access control, etc)"]
    C --> D["Stage 3: Multi-Vector AI<br/>5 focused passes:<br/>reentrancy, economic, access,<br/>logic, attack chaining"]
    D --> E["Stage 4: Strategy Builder<br/>Dedup, score, rank<br/>attack strategies"]
    E --> F["Stage 5: Exploit Gen<br/>Generate complete<br/>Foundry test code"]
    F --> G["Stage 6: Self-Healing Executor<br/>Run forge test,<br/>if FAIL → feed error to AI,<br/>get fixed code, retry"]
    G -->|FAIL after N retries| H[Report]
    G -->|PASS| H
```

## Pipeline Files

| File | Purpose |
|------|---------|
| `src/pipeline/recon.ts` | Contract parsing — functions, state vars, external calls, attack surface |
| `src/pipeline/static-analysis.ts` | 8 deterministic checks (reentrancy, access control, tx.origin, etc) |
| `src/pipeline/ai-analysis.ts` | 5 focused AI passes (reentrancy, economic, access, logic, chains) |
| `src/pipeline/strategy.ts` | Dedup + score + rank strategies |
| `src/pipeline/exploit-gen.ts` | Generate complete Foundry test files |
| `src/pipeline/executor.ts` | Self-healing: run → fail → AI fix → retry (up to 3x) |
| `src/pipeline/index.ts` | Pipeline orchestrator + report generation |

## Usage

```bash
# Full pipeline (default)
npm run exploit -- ./test-contracts/VulnerableVault.sol

# With more retries for self-healing
npm run exploit -- ./contracts/ --retries 5

# Old single-pass mode
npm run exploit -- ./contracts/ --simple
```

## Verification
- ✅ TypeScript compiles with zero errors
- Pipeline wired into both `attack` and `exploit` commands
