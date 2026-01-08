import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, MARKETING_BUILDER_SYSTEM_PROMPT } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sentiment, goals, channels, budget, timeline } = body;

        if (!sentiment || !goals?.length || !channels?.length || !budget || !timeline) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const prompt = `Create a detailed, personalized marketing strategy with these specifications:

**Brand Sentiment:** ${sentiment.name} - ${sentiment.desc}
**Example Tone:** "${sentiment.example}"

**Goals:** ${goals.join(", ")}

**Marketing Channels:** ${channels.join(", ")}

**Budget:** ${budget.name} (${budget.range}) - ${budget.desc}

**Timeline:** ${timeline.name} (${timeline.duration}) - ${timeline.desc}

Generate a comprehensive, actionable marketing strategy in markdown format. Include:
1. Brand voice guidelines with 3-5 do's and don'ts
2. Specific tactics for each goal
3. Channel-by-channel strategy with posting frequency
4. Budget allocation percentages
5. Detailed timeline with milestones
6. Content pillars tailored to the sentiment
7. Success metrics with realistic targets
8. A next steps checklist

Make it practical and immediately actionable. Use the brand sentiment consistently throughout.`;

        const response = await generateWithGemini(prompt, MARKETING_BUILDER_SYSTEM_PROMPT);

        return NextResponse.json({ success: true, data: response });
    } catch (error) {
        console.error("Marketing builder error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate marketing strategy" },
            { status: 500 }
        );
    }
}
