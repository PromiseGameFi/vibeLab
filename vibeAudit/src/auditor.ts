import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'https://vibelab.app',
        'X-Title': 'VibeAudit',
    },
});

export interface AuditFinding {
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
    title: string;
    description: string;
    line?: number;
    recommendation: string;
}

const SYSTEM_PROMPT = `You are an expert Smart Contract Auditor and Red Teamer. 
Your task is to analyze Solidity code for security vulnerabilities, including KOWN patterns (Reentrancy, etc.) and NOVEL logic errors.

For every vulnerability found, you MUST provide a "Proof of Concept" (PoC) attack scenario.

FORMAT YOUR RESPONSE AS JSON ONLY.
Structure:
[
  {
    "severity": "Critical/High/Medium/Low",
    "title": "Short Title",
    "description": "Detailed explanation of the exploit",
    "exploit_poc": "// Solidity/Foundry test code snippet demonstrating the attack",
    "line": 10,
    "recommendation": "How to fix it"
  }
]
If no issues are found, return an empty JSON array [].`;

export async function auditContract(code: string, filename: string): Promise<AuditFinding[]> {
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Analyze this contract (${filename}):\n\n${code}` }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content || '[]';
        // Clean potential markdown code blocks
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as AuditFinding[];
    } catch (error) {
        console.error(`Error auditing ${filename}:`, error);
        return [{
            severity: 'Info',
            title: 'Audit Failed',
            description: `AI Analysis failed: ${(error as Error).message}`,
            recommendation: 'Check API key or try again.'
        }];
    }
}
