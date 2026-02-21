import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getProvider } from '../../chains';
import { AnalyzeArchitectureTool } from './tools/analyze-architecture';
import { LoadProjectFilesTool } from './tools/load-project-files';

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

function dedupeVectors(vectors: AttackPlan['prioritizedVectors']): AttackPlan['prioritizedVectors'] {
    const seen = new Set<string>();
    const deduped: AttackPlan['prioritizedVectors'] = [];

    for (const vector of vectors) {
        const key = vector.vector.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(vector);
    }

    return deduped;
}

export class AttackStrategist {
    async generateInitialPlan(target: string, chain: string, isProject: boolean = false): Promise<AttackPlan> {
        const defaultPlan: AttackPlan = {
            prioritizedVectors: [{
                vector: 'General Reconnaissance & Reentrancy',
                reasoning: 'Baseline fallback vector when architecture context is limited.',
                toolsNeeded: ['read_source', 'analyze_code'],
            }],
        };

        try {
            if (isProject) {
                const loader = new LoadProjectFilesTool();
                const loadedRaw = await loader.execute({ projectPath: target });
                const loaded = JSON.parse(loadedRaw);

                if (!loaded.ok) {
                    return defaultPlan;
                }

                const architectureTool = new AnalyzeArchitectureTool();
                const analysisRaw = await architectureTool.execute({
                    files: loaded.files,
                    projectType: loaded.projectType,
                });
                const analysisPayload = JSON.parse(analysisRaw);

                const seedVectors = analysisPayload.ok
                    ? ((analysisPayload.analysis?.attackTreeSeeds || []).map((seed: any) => ({
                        vector: seed.vector || 'Systemic Architecture Risk',
                        reasoning: seed.rationale || 'Generated from architecture analysis.',
                        toolsNeeded: ['load_project_files', 'analyze_architecture', 'analyze_code'],
                    })))
                    : [];

                const plan = {
                    prioritizedVectors: dedupeVectors([
                        ...seedVectors,
                        ...defaultPlan.prioritizedVectors,
                    ]),
                };

                return plan;
            }

            const provider = await getProvider(chain);
            const intel = await provider.gatherIntel(target);
            const priors = intel.extra?.characteristics?.attackPriors as string[] | undefined;

            let codePreview = '';
            if (intel.sourceCode) {
                codePreview = intel.sourceCode.substring(0, 10000);
            } else if (intel.bytecode) {
                codePreview = (await provider.decompileOrDisassemble(intel.bytecode)).substring(0, 10000);
            } else {
                return {
                    prioritizedVectors: [
                        {
                            vector: 'Blind Fuzzing / Transaction Analysis',
                            reasoning: 'No source code or bytecode available for static analysis.',
                            toolsNeeded: ['get_transactions', 'check_storage'],
                        },
                    ],
                };
            }

            const prompt = `You are a master smart contract hacker planning an attack tree.
Target chain: ${chain}
Code preview:\n${codePreview}

Return JSON with:
{
  "prioritizedVectors": [
    {"vector": "...", "reasoning": "...", "toolsNeeded": ["read_source", "analyze_code"]}
  ]
}`;

            const response = await getLLM().chat.completions.create({
                model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = response.choices[0].message.content;
            if (!content) return defaultPlan;

            const llmPlan = JSON.parse(content) as AttackPlan;
            const priorVectors = (priors || []).map((prior) => ({
                vector: prior.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
                reasoning: `High-probability exploit prior for ${chain}.`,
                toolsNeeded: ['read_source', 'analyze_code', 'generate_exploit'],
            }));

            return {
                prioritizedVectors: dedupeVectors([
                    ...priorVectors,
                    ...(llmPlan.prioritizedVectors || []),
                    ...defaultPlan.prioritizedVectors,
                ]),
            };
        } catch {
            return defaultPlan;
        }
    }
}
