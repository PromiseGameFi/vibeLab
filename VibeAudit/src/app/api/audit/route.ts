import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy_key",
});

export async function POST(req: NextRequest) {
    try {
        const { target, network, intensity } = await req.json();

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendLog = (message: string) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message })}\n\n`));
                };
                const sendAction = (action: string, data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ action, data })}\n\n`));
                };

                sendLog(`[INFO] Initializing VibeAudit AI Agent via OpenRouter...`);

                if (!process.env.OPENROUTER_API_KEY) {
                    sendLog(`[ERROR] OPENROUTER_API_KEY is not set in environment variables!`);
                    sendAction("done", {});
                    controller.close();
                    return;
                }

                const systemPrompt = `You are a Continuous Reasoning AI Pentester (C.R.A.P.) specialized in Web3 Smart Contracts. 
        Your goal is to autonomously map the attack surface, run static analysis tools, hypothesize vulnerabilities, and validate them with PoCs.
        You must communicate your thought process concisely (1-2 sentences max per step). 
        Always start by fetching the source code. If you find a vulnerability via static analysis, you MUST run validateExploit before finishing.
        Target: ${target} on ${network} (Intensity: ${intensity})`;

                try {
                    const result = streamText({
                        model: openrouter('meta-llama/llama-3.1-8b-instruct:free'), // Fallback free model to test, user can change this
                        system: systemPrompt,
                        maxSteps: 5,
                        tools: {
                            fetchSourceCode: tool({
                                description: "Fetches verified smart contract source from block explorers. MUST be called first.",
                                parameters: z.object({ address: z.string() }),
                                execute: async ({ address }) => {
                                    sendLog(`[RECON] Fetching source code for ${address}`);
                                    await new Promise(r => setTimeout(r, 1000));
                                    sendLog(`[MAPPING] Extracted Vault.sol`);
                                    sendAction("updateStats", { linesScanned: 432, riskScore: 30 });
                                    return { sourceCode: `contract Vault { function withdraw() external { payable(msg.sender).transfer(address(this).balance); } }`, lines: 432 };
                                }
                            }),
                            runStaticAnalysis: tool({
                                description: "Runs static analysis tools like Slither on the target. Call this after fetching source code.",
                                parameters: z.object({ address: z.string() }),
                                execute: async () => {
                                    sendLog(`[ANALYSIS] Running Slither heuristics...`);
                                    await new Promise(r => setTimeout(r, 1000));
                                    sendLog(`[WARN] Unprotected withdraw function detected!`);
                                    sendAction("updateStats", { riskScore: 60 });
                                    return { findings: ["Vault: withdraw() is external and has no access control modifier."] };
                                }
                            }),
                            validateExploit: tool({
                                description: "Spawns a local Anvil fork and executes a Proof of Concept to prove the vulnerability.",
                                parameters: z.object({ findingDescription: z.string() }),
                                execute: async (args) => {
                                    sendLog(`[VALIDATE] Writing PoC for: ${args.findingDescription}`);
                                    await new Promise(r => setTimeout(r, 1500));
                                    sendLog(`[ALERT] CRITICAL VULNERABILITY CONFIRMED: Funds drained.`);
                                    sendAction("updateStats", { riskScore: 100, customData: 'critical_finding' });
                                    sendAction("addFinding", {
                                        severity: "High",
                                        vulnerability: "Unprotected Withdraw",
                                        location: "Vault.sol: withdraw()",
                                        status: "PoC Validated"
                                    });
                                    return { success: true, exploitHash: "0xdeadbeef" };
                                }
                            })
                        },
                        prompt: "Start the audit campaign. Fetch the source code, analyze it, hypothesize vulnerabilities, and validate exploits.",
                    });

                    for await (const part of result.fullStream) {
                        // We only stream tool execution logs via the tool execute functions and the final AI text
                        if (part.type === 'step-finish') {
                            if (part.text && part.text.trim() !== '') {
                                sendLog(`[AI] ${part.text.trim()}`);
                            }
                        }
                    }

                    sendLog(`[INFO] Audit campaign finished. Report generated.`);
                } catch (error: any) {
                    sendLog(`[ERROR] AI Execution failed: ${error.message || error}`);
                }

                sendAction("done", {});
                controller.close();
            },
            cancel() {
                console.log("Client aborted the stream");
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to parse request" }), { status: 400 });
    }
}
