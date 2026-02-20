import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getProvider } from '../../chains';

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

export interface AttackPlan {
    prioritizedVectors: {
        vector: string;
        reasoning: string;
        toolsNeeded: string[];
    }[];
}

export class AttackStrategist {
    /**
     * Seeds the initial attack plan by looking at the raw bytecode/source of the target contract.
     */
    async generateInitialPlan(address: string, chain: string): Promise<AttackPlan> {
        const provider = await getProvider(chain);

        const intel = await provider.gatherIntel(address);
        let codePreview = '';

        if (intel.sourceCode) {
            codePreview = intel.sourceCode.substring(0, 10000); // Send up to 10k chars of source
        } else if (intel.bytecode) {
            codePreview = (await provider.decompileOrDisassemble(address)).substring(0, 10000);
        } else {
            return {
                prioritizedVectors: [
                    {
                        vector: 'Blind Fuzzing / Transaction Analysis',
                        reasoning: 'No source code or bytecode available to statically analyze.',
                        toolsNeeded: ['get_transactions', 'check_storage'],
                    }
                ]
            };
        }

        const prompt = `You are a master smart contract hacker. You are planning an attack tree for a target contract.
Target Chain: ${chain}
Target Code Preview (Truncated):
\`\`\`
${codePreview}
\`\`\`

Generate an initial ATTACK PLAN. Identify 1 to 3 high-probability attack vectors based on this code.
Return ONLY valid JSON matching this schema:
{
  "prioritizedVectors": [
    {
      "vector": "Name of the attack vector (e.g. Flash Loan Reentrancy)",
      "reasoning": "Why this is a viable attack path based on the code",
      "toolsNeeded": ["read_source", "analyze_code", ...]
    }
  ]
}`;

        try {
            const response = await getLLM().chat.completions.create({
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error('Empty response from LLM');

            const llmPlan = JSON.parse(content) as AttackPlan;

            // Initialize strategy from chain priors
            const plan: AttackPlan = {
                prioritizedVectors: [],
            };

            if (intel.extra?.characteristics?.attackPriors) {
                const priors = intel.extra.characteristics.attackPriors as string[];
                plan.prioritizedVectors = priors.map(prior => ({
                    vector: prior.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    reasoning: `High-probability exploit vector for ${chain} networks based on chain metadata.`,
                    toolsNeeded: ['read_source', 'analyze_code', 'generate_exploit']
                }));
            } else {
                // Fallback empty plan ready for ReAct engine
                plan.prioritizedVectors.push({
                    vector: 'General Reconnaissance & Reentrancy',
                    reasoning: 'Scan all external calls and state changes for typical vulnerabilities.',
                    toolsNeeded: ['read_source', 'analyze_code']
                });
            }

            // Merge LLM plan into strategy if available
            if (llmPlan.prioritizedVectors && llmPlan.prioritizedVectors.length > 0) {
                llmPlan.prioritizedVectors.forEach((vector) => {
                    plan.prioritizedVectors.push(vector);
                });
            }

            return plan;

        } catch (error) {
            console.error('Failed to generate attack plan:', error);
            // Fallback safe plan
            return {
                prioritizedVectors: [
                    {
                        vector: 'Standard Code Review',
                        reasoning: 'Fallback deep analysis plan due to strategy generation failure.',
                        toolsNeeded: ['read_source', 'analyze_code']
                    }
                ]
            };
        }
    }
}
