import { NextRequest, NextResponse } from "next/server";
import { generateWithGroq } from "@/lib/groq";

export async function POST(req: NextRequest) {
    try {
        const { projectName, description } = await req.json();

        if (!projectName || !description) {
            return NextResponse.json(
                { error: "Project name and description are required" },
                { status: 400 }
            );
        }

        const systemPrompt = `You are an expert Senior Software Architect.
Your task is to generate a complete set of project documentation files for a new software project.
You must return the output as a valid JSON object where keys are file paths and values are the file content.

The files to generate are:
1. "prd.md": Product Requirements Document
2. "progress.md": Project Progress Tracker
3. "structure.md": Codebase Structure & Architecture
4. "PROMPT.md": Current Context Memory
5. "Ui/design_system.md": UI/UX Specifications
6. "content.md": Static Content & Data
7. "CONTRIBUTING.md": Developer Guidelines
8. ".agent/rules/rules.md": AI Agent Rules
9. ".agent/workflows/docs-sync.md": Documentation Workflow

Ensure the content is tailored to the user's project description.
For "structure.md", include the new files in the file tree.
For ".agent/rules/rules.md", include specific tech stack rules based on the description (default to Next.js App Router/Tailwind if not specified).

Output format:
{
  "prd.md": "# Project Name...",
  "progress.md": "# Progress...",
  ...
}
`;

        const userPrompt = `Project Name: ${projectName}
Description: ${description}

Generate the documentation files. Return ONLY the JSON object.`;

        const response = await generateWithGroq(userPrompt, systemPrompt);

        // Clean up response if it contains markdown code blocks
        const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();

        let files;
        try {
            files = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("Failed to parse JSON", cleanResponse);
            // Fallback manual parsing or retry could go here
            return NextResponse.json({ error: "Failed to generate valid JSON" }, { status: 500 });
        }

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Error generating brain:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
