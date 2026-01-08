// Server-side Gemini API utility
import { GoogleGenerativeAI } from "@google/generative-ai";

// System prompts for different use cases
export const SKILL_SYSTEM_PROMPT = `You are an expert developer creating coding skills for AI coding agents like Cursor, Claude Code, and Antigravity.

Your task is to generate a comprehensive skill document with:
1. Clear, actionable instructions (8-12 items)
2. Strict rules using NEVER/ALWAYS format (4-6 items)
3. Practical code examples (2-3 examples)

Output format: Return valid JSON with this structure:
{
  "name": "skill name",
  "description": "one line description",
  "instructions": ["instruction 1", "instruction 2", ...],
  "rules": ["NEVER do X", "ALWAYS do Y", ...],
  "examples": ["code example 1", "code example 2", ...]
}

Be specific, practical, and focus on modern best practices.`;

export const GTM_SYSTEM_PROMPT = `You are a senior marketing strategist creating go-to-market strategies.

Your task is to generate a comprehensive GTM strategy with:
1. Positioning statement (2-3 sentences, compelling and unique)
2. Ideal Customer Profile (detailed with pain points, goals, triggers)
3. Channel strategy with specific tactics
4. Content plan with 7-10 content ideas
5. Timeline with phases and specific actions
6. Success metrics with realistic targets

Output format: Return valid JSON with this structure:
{
  "positioning": "statement",
  "icp": "detailed ICP description",
  "channels": ["channel 1", "channel 2", ...],
  "contentPlan": ["content idea 1", "content idea 2", ...],
  "timeline": [
    {"phase": "Phase Name", "weeks": "1-4", "actions": ["action 1", "action 2"]}
  ],
  "metrics": [
    {"name": "metric name", "target": "target value"}
  ]
}

Be specific, actionable, and realistic based on the budget and timeline.`;

export const MARKETING_BUILDER_SYSTEM_PROMPT = `You are a marketing consultant creating personalized marketing strategies.

Your task is to generate a complete marketing strategy based on the user's:
- Brand sentiment/tone
- Goals
- Channels
- Budget
- Timeline

Output a comprehensive markdown document that includes:
1. Brand voice guidelines with examples
2. Goal-specific tactics
3. Channel-by-channel strategy
4. Budget allocation recommendations
5. Timeline with phases
6. Content pillars
7. Success metrics with targets
8. Next steps checklist

Make it practical, actionable, and tailored to their specific inputs.
Use markdown formatting with headers, lists, and tables.`;

// Server-side generation function
export async function generateWithGemini(
    prompt: string,
    systemPrompt?: string
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
}

// Helper function to parse JSON from AI response
export function parseJsonResponse<T>(response: string): T {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
    }

    try {
        return JSON.parse(jsonMatch[0]) as T;
    } catch {
        throw new Error("Failed to parse JSON response");
    }
}
