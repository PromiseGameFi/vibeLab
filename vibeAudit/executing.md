# Executing: True Agentic Architecture Refactor

Currently executing a massive refactor to shift VibeAudit from a rigid pipeline to a true, reasoning **ReAct Agent** (Reasoning + Acting) with a dedicated toolkit.

## The Goal
Replace the fixed 6-stage pipeline (`recon` -> `static analysis` -> `AI analysis` -> `exploit gen`) with a dynamic loop where the agent *decides* what to do based on observations.

## The Plan

1. **Tool Registry (`src/agent/react/tools/`)**
   - Create specific tools the LLM can call: `read_source`, `analyze_code`, `gather_intel`, `generate_exploit`, `execute_exploit`, `check_storage`.
   - Wrap our existing EVM/Solana/SUI functionality into these tool interfaces.

2. **ReAct Engine (`src/agent/react/`)**
   - `loop.ts`: Implements the `THOUGHT -> ACTION -> OBSERVATION` loop.
   - `memory.ts`: Manages the scratchpad context for a single run to prevent the LLM from getting stuck or hallucinating past states.

3. **Attack Tree Planner (`src/agent/react/strategist.ts`)**
   - Implements dynamic attack path generation. The agent will formulate a tree of possible attacks and traverse them, pivoting if one branch fails (e.g., if a reentrancy exploit fails due to a balance check, it pivots to oracle manipulation).

4. **Integration**
   - Connect the new ReAct engine into the main `runPipeline` and `agent.ts`.
   - Update the UI to stream the agent's live thoughts and actions via SSE.

We are currently in the **Planning Phase**. Next step is to build the Tool Registry.
