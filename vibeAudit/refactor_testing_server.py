import re
import sys

with open('src/ui/testing-server.ts', 'r') as f:
    code = f.read()

# 1. Update imports
imports_to_remove = [
    r"import \{ extractFindings, simulateExploits, VulnerabilityFinding, SimulationReport \} from '../agent/exploit-simulator';\n",
    r"import \{ analyzeContractDeep \} from '../agent/analyzers/contract-deep';\n",
    r"import \{ analyzeProcessFlow \} from '../agent/analyzers/process-flow';\n",
    r"import \{ analyzeFrontendInteraction \} from '../agent/analyzers/frontend-interaction';\n",
    r"import \{ analyzeBridgeSecurity \} from '../agent/analyzers/bridge-security';\n",
    r"import \{ generateSecurityReport, saveReport, SecurityReport \} from '../agent/analyzers/report-generator';\n"
]

for imp in imports_to_remove:
    code = re.sub(imp, '', code)

# Add ReAct Engine import
code = code.replace(
    "import { checkFoundryInstalled, getDefaultRpc } from '../utils';\n",
    "import { checkFoundryInstalled, getDefaultRpc } from '../utils';\nimport { ReActEngine } from '../agent/react/loop';\nimport { AttackStrategist } from '../agent/react/strategist';\n"
)

# 2. Add ReAct event types to AnalysisRun interface (optional but good)
# Actually, I'll just change the progress array logic

# 3. Replace runAnalysis function
start_marker = "async function runAnalysis(run: AnalysisRun, rpcUrl: string, simulate: boolean): Promise<void> {"
end_marker = "function generateHTML(): string {"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_run_analysis = """async function runAnalysis(run: AnalysisRun, rpcUrl: string, simulate: boolean): Promise<void> {
    const runId = run.id;

    try {
        sendProgress(runId, 1, 3, 'Initializing Agent', `Starting ReAct engine for ${run.address}...`);
        
        // 1. Optional: Gather initial intel for the UI (not strictly required by ReAct, but good for dashboard)
        const intel = await gatherIntel(run.address, run.chain, rpcUrl);
        run.intel = intel;
        sendEvent(runId, 'intel', {
            contractName: intel.contractName,
            bytecodeSize: intel.bytecodeSize,
            balance: intel.balance,
            hasSource: !!intel.sourceCode,
            isProxy: intel.isProxy,
            tokenInfo: intel.tokenInfo,
            functionsDetected: intel.detectedFunctions.length,
            txCount: intel.totalTxCount,
            deployer: intel.deployer,
            owner: intel.owner,
        });

        // 2. Generate Initial Attack Plan (Strategist)
        sendProgress(runId, 2, 3, 'Planning', `Building attack tree...`);
        const strategist = new AttackStrategist();
        const plan = await strategist.generateInitialPlan(run.address, run.chain);
        sendEvent(runId, 'plan', { plan: plan.prioritizedVectors });

        // 3. ReAct Loop Execution
        sendProgress(runId, 3, 3, 'Agent Execution', 'Executing ReAct Loop...');
        const engine = new ReActEngine();

        // Stream thoughts, actions, and observations to the UI!
        engine.onThought = (thought) => {
            sendEvent(runId, 'thought', { text: thought });
        };
        engine.onAction = (actionName, args) => {
            sendEvent(runId, 'action', { name: actionName, args });
        };
        engine.onObservation = (observation) => {
            // Truncate observation for UI if huge
            const safeObs = observation.length > 2000 ? observation.substring(0, 2000) + '...[Truncated]' : observation;
            sendEvent(runId, 'observation', { text: safeObs });
        };

        const result = await engine.run(run.address, run.chain);

        // Map ReAct result back to the old UI formats for now, or just send a completion event
        run.status = 'complete';
        run.completedAt = new Date().toISOString();

        sendEvent(runId, 'analysis_complete', {
            status: result.status,
            details: result.details,
            isExploited: result.status === 'exploited'
        });

    } catch (error) {
        console.error(chalk.red(`\\n❌ Analysis Error:`), error);
        run.status = 'error';
        run.error = (error as Error).message;
        sendEvent(runId, 'error', { message: (error as Error).message });
    }
}

// ─── Frontend HTML ──────────────────────────────────────────────────

"""

code = code[:start_idx] + new_run_analysis + code[end_idx:]

with open('src/ui/testing-server.ts', 'w') as f:
    f.write(code)

print("Rewrote testing-server.ts successfully")
