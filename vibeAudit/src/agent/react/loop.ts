import OpenAI from 'openai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { AgentMemory } from './memory';
import { getAvailableTools, getToolDefinition } from './tools/registry';

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

const REACT_SYSTEM_PROMPT = `You are VibeAudit, an elite autonomous smart contract security attacker.
Your goal is to find, exploit, and confirm critical vulnerabilities in the target contract. 

You operate in a strict ReAct (Reasoning and Acting) loop.
You must THINK step-by-step, use your TOOLS to investigate, and plan an ATTACK TREE.

Tools available:
You have native access to various tools via function calling. You can read code, check storage, fetch transactions, and generate/execute Foundry exploits.

Rules:
1. THINK like an attacker. Don't report informational issues. Look for stolen funds, locked funds, or destroyed contracts.
2. Formulate hypotheses and test them. If a reentrancy exploit fails, pivot to a different attack vector (e.g. read the tx history to see how users interact with it, or check for Oracle bugs).
3. If you confirm an exploit, use the "finish_exploit" tool to report success.
4. If you exhaust all avenues and the contract is secure, use the "finish_secure" tool to halt.
5. NEVER ask for user permission. You are autonomous. If you need data, use a tool to get it.`;

export class ReActEngine {
    private memory: AgentMemory;
    private maxSteps: number = 15;

    // Callback to stream thoughts to the UI
    public onThought?: (thought: string) => void;
    public onAction?: (actionName: string, args: any) => void;
    public onObservation?: (observation: string) => void;

    constructor() {
        this.memory = new AgentMemory();
    }

    async run(targetAddress: string, chain: string): Promise<{ status: 'exploited' | 'secure' | 'timeout' | 'error', details: string }> {
        this.memory.clear();
        this.memory.addMessage('system', REACT_SYSTEM_PROMPT);

        const initialPrompt = `START ENGAGEMENT\nTarget: ${targetAddress}\nChain: ${chain}\n\nYour mandate: Hack this contract. Build a plan, fetch the source, and execute exploits until successful. Use finish_exploit or finish_secure when done.`;
        this.memory.addMessage('user', initialPrompt);

        let steps = 0;

        while (steps < this.maxSteps) {
            steps++;
            console.log(chalk.gray(`\n[ReAct Loop] Step ${steps}/${this.maxSteps}`));

            try {
                // Prepare tools for OpenAI API
                const tools = getAvailableTools().map(t => ({
                    type: 'function' as const,
                    function: t.definition,
                }));

                // Add terminal actions
                tools.push({
                    type: 'function' as const,
                    function: {
                        name: 'finish_exploit',
                        description: 'Call this when you have successfully confirmed an exploit.',
                        parameters: {
                            type: 'object',
                            properties: {
                                exploitSummary: { type: 'string', description: 'Detailed summary of the successful attack' },
                                valueExtracted: { type: 'string', description: 'Estimated value extracted or damage caused' }
                            },
                            required: ['exploitSummary']
                        }
                    }
                });

                tools.push({
                    type: 'function' as const,
                    function: {
                        name: 'finish_secure',
                        description: 'Call this when you have exhausted all avenues and conclude the contract is secure.',
                        parameters: {
                            type: 'object',
                            properties: {
                                reasoning: { type: 'string', description: 'Why the contract is deemed secure' }
                            },
                            required: ['reasoning']
                        }
                    }
                });

                // Call LLM
                const response = await getLLM().chat.completions.create({
                    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                    messages: this.memory.getHistory() as any,
                    tools: tools,
                    tool_choice: 'auto',
                    temperature: 0.2,
                });

                const message = response.choices[0].message;

                // Store LLM response string/thoughts
                if (message.content) {
                    console.log(chalk.magenta(`\n🧠 Thought:\n${message.content}`));
                    if (this.onThought) this.onThought(message.content);
                }

                this.memory.addMessage('assistant', message.content || '', undefined, undefined, message.tool_calls);

                // Handle Tool Calls
                if (message.tool_calls && message.tool_calls.length > 0) {
                    for (const toolCall of message.tool_calls) {
                        const actionName = toolCall.function.name;
                        const args = JSON.parse(toolCall.function.arguments);

                        console.log(chalk.yellow(`\n🛠️  Action: ${actionName}(${JSON.stringify(args)})`));
                        if (this.onAction) this.onAction(actionName, args);

                        // Handle terminal states
                        if (actionName === 'finish_exploit') {
                            return { status: 'exploited', details: args.exploitSummary };
                        }
                        if (actionName === 'finish_secure') {
                            return { status: 'secure', details: args.reasoning };
                        }

                        // Execute standard tool
                        const tool = getToolDefinition(actionName);
                        let observation = '';

                        if (tool) {
                            observation = await tool.execute(args);
                        } else {
                            observation = `Error: Tool ${actionName} not found.`;
                        }

                        // Limit observation size to prevent context overflow (especially for source code)
                        if (observation.length > 15000) {
                            observation = observation.substring(0, 15000) + '\n...[TRUNCATED FOR LENGTH]...';
                        }

                        console.log(chalk.green(`\n👀 Observation:\n${observation.substring(0, 500)}${observation.length > 500 ? '...' : ''}`));
                        if (this.onObservation) this.onObservation(observation);

                        this.memory.addMessage('tool', observation, actionName, toolCall.id);
                    }
                } else {
                    // No tool call, but not finished. Prompt it to use a tool or finish.
                    this.memory.addMessage('user', 'You did not invoke a tool or finish. You must use tools to gather intel or exploit, or call finish_secure/finish_exploit to halt.');
                }

            } catch (error) {
                console.error(chalk.red(`\n❌ ReAct Engine Error: ${(error as Error).message}`));
                return { status: 'error', details: (error as Error).message };
            }
        }

        return { status: 'timeout', details: `Hit max steps limit (${this.maxSteps}).` };
    }
}
