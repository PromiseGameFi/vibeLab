import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, SKILL_SYSTEM_PROMPT, parseJsonResponse } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, category } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const fullPrompt = `Create a comprehensive coding skill for: ${prompt}

Category: ${category || "General"}

Generate a skill that will help AI coding agents write better code following best practices.`;

        const response = await generateWithGemini(fullPrompt, SKILL_SYSTEM_PROMPT);
        const parsed = parseJsonResponse(response);

        return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
        console.error("Skill generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate skill" },
            { status: 500 }
        );
    }
}
