import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, GTM_SYSTEM_PROMPT, parseJsonResponse } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productName, productDescription, industry, targetAudience, channels, budget, timeline } = body;

        if (!productName || !productDescription || !targetAudience) {
            return NextResponse.json(
                { error: "Product name, description, and target audience are required" },
                { status: 400 }
            );
        }

        const prompt = `Create a detailed go-to-market strategy for:

**Product:** ${productName}
**Description:** ${productDescription}
**Industry:** ${industry || "Technology"}
**Target Audience:** ${targetAudience}
**Marketing Channels:** ${channels?.join(", ") || "X, LinkedIn, Blog"}
**Budget:** ${budget === "bootstrap" ? "$0-$1k (organic focus)" : budget === "funded" ? "$1k-$10k (mix of organic and paid)" : "$10k+ (full-funnel campaigns)"}
**Timeline:** ${timeline === "sprint" ? "2 weeks (quick launch)" : timeline === "quarter" ? "3 months (balanced approach)" : "12 months (comprehensive strategy)"}

Generate a comprehensive, actionable GTM strategy with specific tactics, realistic metrics, and a clear timeline.`;

        const response = await generateWithGemini(prompt, GTM_SYSTEM_PROMPT);
        const parsed = parseJsonResponse(response);

        return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
        console.error("GTM generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate GTM strategy" },
            { status: 500 }
        );
    }
}
