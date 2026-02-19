import re
import sys

with open('src/agent/agent.ts', 'r') as f:
    code = f.read()

# 1. Replace imports
imports_to_remove = [
    r"import \{ gatherIntel, getAnalyzableCode, ContractIntel \} from './intel-gatherer';\n",
    r"import \{ simulateExploits, extractFindings, VulnerabilityFinding, SimulationReport \} from './exploit-simulator';\n",
    r"import \{ analyzeContractDeep \} from './analyzers/contract-deep';\n",
    r"import \{ analyzeProcessFlow \} from './analyzers/process-flow';\n",
    r"import \{ analyzeFrontendInteraction \} from './analyzers/frontend-interaction';\n",
    r"import \{ analyzeBridgeSecurity \} from './analyzers/bridge-security';\n",
    r"import \{ generateSecurityReport, saveReport, SecurityReport \} from './analyzers/report-generator';\n"
]

for imp in imports_to_remove:
    code = re.sub(imp, '', code)

# Add new import
code = code.replace(
    "import { LearningEngine } from './learning';\n",
    "import { LearningEngine } from './learning';\nimport { ReActEngine } from './react/loop';\n"
)

# 2. Update main loop
main_loop_old = """                const report = await this.analyzeTarget(target, triageResult);

                // Store results
                if (report) {
                    this.targetsProcessed++;
                    this.storeReport(target, report.securityReport);

                    // Notify on high-risk findings
                    if (report.securityReport.overallRiskScore >= 60) {
                        this.confirmedVulns += report.simulationReport?.confirmedVulnerabilities || 0;
                        await this.notifyHighRisk(target, report.securityReport, report.simulationReport);
                    }
                }"""

main_loop_new = """                await this.analyzeTarget(target, triageResult);
                this.targetsProcessed++;"""

code = code.replace(main_loop_old, main_loop_new)

# 3. Replace analyzeTarget and remove storeReport + notifyHighRisk
# We will find the start of analyzeTarget and replace everything until getStatus()
start_marker = "    // ─── Full Analysis Pipeline ────────────────────────────────"
end_marker = "    // ─── Status ─────────────────────────────────────────────────"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_pipeline = """    // ─── Full Analysis Pipeline ────────────────────────────────

    private async analyzeTarget(
        target: QueueTarget,
        triageResult: TriageResult,
    ): Promise<void> {

        console.log(chalk.cyan(`   🤖 Starting ReAct Intelligence Engine...`));
        const reactEngine = new ReActEngine();
        
        // Stream thoughts to UI (memory system can also pick this up if needed)
        reactEngine.onThought = (thought) => {
             // In the future: emit SSE to dashboard here
        };
        
        const result = await reactEngine.run(target.address, target.chain);
        
        let riskScore = 0;
        let isConfirmed = 0;

        if (result.status === 'exploited') {
            riskScore = 100;
            isConfirmed = 1;
            console.log(chalk.red(`\\n   💀 EXPLOIT CONFIRMED:\\n${result.details}`));
        } else if (result.status === 'secure') {
            riskScore = 10;
            console.log(chalk.green(`\\n   🛡️ TARGET SECURE:\\n${result.details}`));
        } else {
            riskScore = 50;
            console.log(chalk.yellow(`\\n   ⏱️ RUN ENDED (${result.status}):\\n${result.details}`));
        }

        // Store results in Agent Memory
        this.memory.updateContractResults(
            target.address, target.chain,
            riskScore, isConfirmed
        );

        this.memory.addReport(
            target.address,
            target.chain,
            `Target ${target.address.substring(0, 8)}`,
            riskScore,
            JSON.stringify({ reactStatus: result.status, details: result.details }),
            `# ReAct Security Report\\n\\n**Status:** ${result.status}\\n\\n**Details:**\\n${result.details}`
        );

        this.memory.log('info', `ReAct Analysis complete for ${target.address}`, {
            status: result.status,
            riskScore: riskScore,
        });

        if (isConfirmed && this.notifier.isConfigured()) {
            this.confirmedVulns++;
            await this.notifier.alertStatus(
                `🛡️ HIGH-RISK CONTRACT EXPLOITED\\n\\n` +
                `Chain: ${target.chain}\\n` +
                `Address: ${target.address}\\n\\n` +
                `Details:\\n${result.details}`
            );
        }
    }

"""

code = code[:start_idx] + new_pipeline + code[end_idx:]

with open('src/agent/agent.ts', 'w') as f:
    f.write(code)

print("Rewrote agent.ts successfully")
