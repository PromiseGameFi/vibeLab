import OpenAI from 'openai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { AgentMemory } from './memory';
import { getAvailableTools, getToolDefinition } from './tools/registry';
import {
    appendAttackTreeNode,
    appendEvidence,
    createEngagement,
    drainOperatorInstructions,
    getEngagement,
    updateAttackTreeNodeStatus,
    updateEngagement,
} from '../engagement';
import { exportProofBundle } from '../exporter';

dotenv.config();

let _openai: OpenAI | null = null;
function getLLM(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY || 'dummy',
            baseURL: 'https://api.groq.com/openai/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://vibelab.app',
                'X-Title': 'VibeAudit',
            },
        });
    }
    return _openai;
}

const REACT_SYSTEM_PROMPT = `You are VibeAudit, an autonomous smart contract security tester operating in authorized defensive mode.

Goal:
- Identify and validate high-impact vulnerabilities.
- Build and update attack paths based on observations.
- Use tools for every material action.

Rules:
1. Think like an attacker, but stay in authorized defensive mode.
2. If execution/fuzzing is blocked due to approval, use ask_human to request run approval scope.
3. Prefer deterministic evidence: chain simulation output, exploit traces, reproducible code.
4. If exploit is confirmed, call finish_exploit.
5. If no exploit is confirmed after investigation, call finish_secure.`;

export interface ReActRunResult {
    status: 'exploited' | 'secure' | 'timeout' | 'error';
    details: string;
    exportPath?: string;
}

function tryParseJson(content: string): any | null {
    if (!content) return null;
    try {
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function extractLatestTestCode(history: any[]): string | undefined {
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];

        if (msg.role === 'tool' && typeof msg.content === 'string') {
            const parsed = tryParseJson(msg.content);
            if (parsed?.testCode) return parsed.testCode;
        }

        if (msg.role === 'assistant' && msg.tool_calls) {
            for (const tc of msg.tool_calls) {
                try {
                    const args = JSON.parse(tc.function.arguments);
                    if (args?.testCode) return args.testCode;
                } catch {
                    // continue
                }
            }
        }
    }

    return undefined;
}

function extractLatestExecutionResult(history: any[]): unknown {
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role !== 'tool' || typeof msg.content !== 'string') continue;
        const parsed = tryParseJson(msg.content);
        if (parsed?.mode === 'evm_foundry' || parsed?.mode === 'simulation') {
            return parsed;
        }
    }
    return undefined;
}

export class ReActEngine {
    private memory: AgentMemory;
    private maxSteps: number = 18;

    public onThought?: (thought: string) => void;
    public onAction?: (actionName: string, args: any) => void;
    public onObservation?: (observation: string) => void;

    constructor(private runId: string) {
        this.memory = new AgentMemory();
    }

    async run(target: string, chain: string, isProject: boolean = false): Promise<ReActRunResult> {
        let engagement = getEngagement(this.runId);
        if (!engagement) {
            engagement = createEngagement({
                runId: this.runId,
                target,
                targetType: isProject ? 'project' : 'contract',
                chain,
                mode: 'validate',
                approvalRequired: true,
            });
        }

        this.memory.clear();
        this.memory.addMessage('system', REACT_SYSTEM_PROMPT);

        const initialPrompt = isProject
            ? `START ENGAGEMENT\nRun: ${this.runId}\nTarget Project: ${target}\nChain Context: ${chain}\nMode: ${engagement.mode}\n\nBuild systemic attack paths. Use load_project_files and analyze_architecture first.`
            : `START ENGAGEMENT\nRun: ${this.runId}\nTarget: ${target}\nChain: ${chain}\nMode: ${engagement.mode}\n\nBuild attack paths, validate findings, and produce reproducible evidence.`;

        this.memory.addMessage('user', initialPrompt);

        let steps = 0;

        while (steps < this.maxSteps) {
            steps++;
            console.log(chalk.gray(`\n[ReAct Loop] Step ${steps}/${this.maxSteps}`));

            const injected = drainOperatorInstructions(this.runId);
            for (const note of injected) {
                this.memory.addMessage('user', `Operator Instruction: ${note}`);
            }

            try {
                const tools = getAvailableTools().map((tool) => ({
                    type: 'function' as const,
                    function: tool.definition,
                }));

                tools.push({
                    type: 'function' as const,
                    function: {
                        name: 'finish_exploit',
                        description: 'Call when exploit or simulation evidence confirms an actionable vulnerability.',
                        parameters: {
                            type: 'object',
                            properties: {
                                exploitSummary: { type: 'string' },
                                valueExtracted: { type: 'string' },
                            },
                            required: ['exploitSummary'],
                        },
                    },
                });

                tools.push({
                    type: 'function' as const,
                    function: {
                        name: 'finish_secure',
                        description: 'Call when no exploit path is validated after sufficient testing.',
                        parameters: {
                            type: 'object',
                            properties: {
                                reasoning: { type: 'string' },
                            },
                            required: ['reasoning'],
                        },
                    },
                });

                const response = await getLLM().chat.completions.create({
                    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                    messages: this.memory.getHistory() as any,
                    tools,
                    tool_choice: 'auto',
                    temperature: 0.2,
                });

                const message = response.choices[0].message;

                if (message.content) {
                    console.log(chalk.magenta(`\n🧠 Thought:\n${message.content}`));
                    if (this.onThought) this.onThought(message.content);
                }

                this.memory.addMessage('assistant', message.content || '', undefined, undefined, message.tool_calls);

                if (!message.tool_calls || message.tool_calls.length === 0) {
                    this.memory.addMessage('user', 'You must call a tool or call finish_secure/finish_exploit.');
                    continue;
                }

                for (let idx = 0; idx < message.tool_calls.length; idx++) {
                    const toolCall = message.tool_calls[idx];
                    const actionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments || '{}');

                    console.log(chalk.yellow(`\n🛠️  Action: ${actionName}(${JSON.stringify(args)})`));
                    if (this.onAction) this.onAction(actionName, args);

                    const nodeId = `step_${steps}_${idx}_${actionName}`;
                    appendAttackTreeNode(this.runId, {
                        id: nodeId,
                        label: actionName,
                        type: 'action',
                        status: 'active',
                        metadata: { args },
                    });

                    if (actionName === 'finish_exploit') {
                        const history = this.memory.getHistory();
                        const pocCode = extractLatestTestCode(history);
                        const executionResult = extractLatestExecutionResult(history);

                        const exportPath = await exportProofBundle({
                            runId: this.runId,
                            target,
                            chain,
                            status: 'exploited',
                            summary: args.exploitSummary,
                            valueExtracted: args.valueExtracted,
                            pocCode,
                            executionResult,
                        });

                        updateEngagement(this.runId, {
                            reactStatus: 'exploited',
                            reactDetails: args.exploitSummary,
                        });

                        appendEvidence(this.runId, {
                            type: 'terminal',
                            action: 'finish_exploit',
                            summary: args.exploitSummary,
                        });

                        updateAttackTreeNodeStatus(this.runId, nodeId, 'complete');

                        return {
                            status: 'exploited',
                            details: args.exploitSummary,
                            exportPath,
                        };
                    }

                    if (actionName === 'finish_secure') {
                        const exportPath = await exportProofBundle({
                            runId: this.runId,
                            target,
                            chain,
                            status: 'secure',
                            summary: args.reasoning,
                        });

                        updateEngagement(this.runId, {
                            reactStatus: 'secure',
                            reactDetails: args.reasoning,
                        });

                        appendEvidence(this.runId, {
                            type: 'terminal',
                            action: 'finish_secure',
                            summary: args.reasoning,
                        });

                        updateAttackTreeNodeStatus(this.runId, nodeId, 'complete');

                        return {
                            status: 'secure',
                            details: args.reasoning,
                            exportPath,
                        };
                    }

                    const tool = getToolDefinition(actionName);
                    let observation = '';

                    if (!tool) {
                        observation = JSON.stringify({ ok: false, error: `Tool ${actionName} not found.` });
                    } else {
                        if (tool.definition.parameters?.properties?.runId) {
                            args.runId = this.runId;
                        }
                        observation = await tool.execute(args);
                    }

                    const parsedObservation = tryParseJson(observation);
                    if (parsedObservation) {
                        appendEvidence(this.runId, {
                            type: 'tool_observation',
                            actionName,
                            observation: parsedObservation,
                        });

                        const status = parsedObservation.ok === false ? 'failed' : 'complete';
                        updateAttackTreeNodeStatus(this.runId, nodeId, status);
                    } else {
                        updateAttackTreeNodeStatus(this.runId, nodeId, 'complete');
                    }

                    const safeObservation = observation.length > 15000
                        ? `${observation.substring(0, 15000)}\n...[TRUNCATED FOR LENGTH]...`
                        : observation;

                    console.log(chalk.green(`\n👀 Observation:\n${safeObservation.substring(0, 500)}${safeObservation.length > 500 ? '...' : ''}`));
                    if (this.onObservation) this.onObservation(safeObservation);

                    this.memory.addMessage('tool', safeObservation, actionName, toolCall.id);
                }
            } catch (error) {
                const err = (error as Error).message;
                console.error(chalk.red(`\n❌ ReAct Engine Error: ${err}`));
                updateEngagement(this.runId, { reactStatus: 'error', reactDetails: err });

                await exportProofBundle({
                    runId: this.runId,
                    target,
                    chain,
                    status: 'error',
                    summary: err,
                }).catch(() => undefined);

                return { status: 'error', details: err };
            }
        }

        const timeoutDetails = `Hit max steps limit (${this.maxSteps}).`;
        updateEngagement(this.runId, { reactStatus: 'timeout', reactDetails: timeoutDetails });

        await exportProofBundle({
            runId: this.runId,
            target,
            chain,
            status: 'timeout',
            summary: timeoutDetails,
        }).catch(() => undefined);

        return {
            status: 'timeout',
            details: timeoutDetails,
        };
    }
}
