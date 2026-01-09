import { ScanResult } from "@/lib/scanData";

// Generate AI fix suggestion using Gemini
export async function generateFix(
    finding: ScanResult,
    codeContext?: string
): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        return "Add NEXT_PUBLIC_GEMINI_API_KEY to enable AI fix suggestions.";
    }

    const prompt = `You are a security expert. Provide a concise fix for this vulnerability:

**Issue:** ${finding.title}
**Severity:** ${finding.severity}
**Description:** ${finding.description}
**File:** ${finding.file}${finding.line ? `:${finding.line}` : ''}
${finding.cwe ? `**CWE:** ${finding.cwe}` : ''}
${codeContext ? `**Code:**\n\`\`\`\n${codeContext}\n\`\`\`` : ''}

Provide:
1. A brief explanation of the risk (1-2 sentences)
2. The fixed code (if applicable)
3. Best practice recommendation

Keep your response concise and actionable.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.3,
                    }
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate fix suggestion.";
    } catch (error) {
        console.error('AI fix generation error:', error);
        return "Failed to generate fix. Check API key and try again.";
    }
}

// Generate SARIF format for GitHub integration
export function generateSARIF(results: ScanResult[], repoUrl: string): string {
    const sarif = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "VibeLab Security Scanner",
                    "version": "2.0.0",
                    "informationUri": "https://vibelab.dev",
                    "rules": [...new Set(results.map(r => r.title))].map((title, i) => ({
                        "id": `VIBE${String(i + 1).padStart(3, '0')}`,
                        "name": title,
                        "shortDescription": { "text": title },
                    }))
                }
            },
            "results": results.map((r, i) => ({
                "ruleId": `VIBE${String(i + 1).padStart(3, '0')}`,
                "level": r.severity === 'critical' || r.severity === 'high' ? 'error' :
                    r.severity === 'medium' ? 'warning' : 'note',
                "message": { "text": r.description },
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": { "uri": r.file || "unknown" },
                        "region": { "startLine": r.line || 1 }
                    }
                }]
            }))
        }]
    };
    return JSON.stringify(sarif, null, 2);
}

// Generate JSON export
export function generateJSON(results: ScanResult[], repoUrl: string): string {
    return JSON.stringify({
        meta: {
            scanner: "VibeLab Security Scanner",
            version: "2.0.0",
            scannedAt: new Date().toISOString(),
            repository: repoUrl,
        },
        summary: {
            total: results.length,
            critical: results.filter(r => r.severity === 'critical').length,
            high: results.filter(r => r.severity === 'high').length,
            medium: results.filter(r => r.severity === 'medium').length,
            low: results.filter(r => r.severity === 'low').length,
            info: results.filter(r => r.severity === 'info').length,
        },
        findings: results,
    }, null, 2);
}
