#!/usr/bin/env node

/**
 * VibeLab Memory MCP Server
 * 
 * Exposes AI memories as resources and tools for MCP-compatible clients
 * like Cursor, Claude Desktop, and VS Code.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import os from "os";

// Memory storage path
const MEMORY_FILE = path.join(os.homedir(), ".vibelab", "memories.json");

// Ensure directory exists
function ensureDir() {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Load memories from file
function loadMemories() {
    ensureDir();
    if (!fs.existsSync(MEMORY_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(MEMORY_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Save memories to file
function saveMemories(memories) {
    ensureDir();
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2));
}

// Generate unique ID
function generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Estimate tokens
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Generate summary
function generateSummary(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let summary = "";
    for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence.trim() + ". ";
    }
    return summary.trim() || content.slice(0, maxLength) + "...";
}

// Create MCP server
const server = new Server(
    {
        name: "vibelab-memory",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const memories = loadMemories();

    const resources = [
        {
            uri: "memory://all",
            name: "All Memories",
            description: `All ${memories.length} memories (${memories.reduce((sum, m) => sum + m.tokenCount, 0)} tokens)`,
            mimeType: "text/plain",
        },
        {
            uri: "memory://recent",
            name: "Recent Memories",
            description: "Memories from the last 24 hours",
            mimeType: "text/plain",
        },
        {
            uri: "memory://context",
            name: "Optimized Context",
            description: "Token-optimized context (max 4000 tokens)",
            mimeType: "text/plain",
        },
    ];

    // Add individual memories as resources
    memories.slice(0, 10).forEach(memory => {
        resources.push({
            uri: `memory://id/${memory.id}`,
            name: memory.title,
            description: `${memory.source} | ${memory.tokenCount} tokens`,
            mimeType: "text/plain",
        });
    });

    return { resources };
});

// Read a specific resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const memories = loadMemories();

    if (uri === "memory://all") {
        const content = memories.map(m => {
            return `## ${m.title}\nSource: ${m.source} | Tokens: ${m.tokenCount}\n\n${m.content}`;
        }).join("\n\n---\n\n");

        return {
            contents: [{
                uri,
                mimeType: "text/plain",
                text: content || "No memories stored yet.",
            }],
        };
    }

    if (uri === "memory://recent") {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent = memories.filter(m => new Date(m.createdAt).getTime() > oneDayAgo);

        const content = recent.map(m => {
            return `## ${m.title}\n${m.summary || m.content}`;
        }).join("\n\n---\n\n");

        return {
            contents: [{
                uri,
                mimeType: "text/plain",
                text: content || "No recent memories.",
            }],
        };
    }

    if (uri === "memory://context") {
        // Token-optimized: use summaries, prioritize by relevance
        let totalTokens = 0;
        const maxTokens = 4000;
        const selected = [];

        // Sort by recency
        const sorted = [...memories].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        for (const memory of sorted) {
            const tokens = memory.summaryTokenCount || memory.tokenCount;
            if (totalTokens + tokens <= maxTokens) {
                selected.push(memory);
                totalTokens += tokens;
            }
        }

        const content = selected.map(m => {
            return `## ${m.title}\n${m.summary || m.content}`;
        }).join("\n\n---\n\n");

        return {
            contents: [{
                uri,
                mimeType: "text/plain",
                text: `# AI Memory Context (${totalTokens} tokens, ${selected.length} memories)\n\n${content}`,
            }],
        };
    }

    // Individual memory by ID
    if (uri.startsWith("memory://id/")) {
        const id = uri.replace("memory://id/", "");
        const memory = memories.find(m => m.id === id);

        if (!memory) {
            return { contents: [{ uri, mimeType: "text/plain", text: "Memory not found." }] };
        }

        return {
            contents: [{
                uri,
                mimeType: "text/plain",
                text: `# ${memory.title}\n\nSource: ${memory.source}\nCreated: ${memory.createdAt}\nTokens: ${memory.tokenCount}\n\n---\n\n${memory.content}`,
            }],
        };
    }

    return { contents: [{ uri, mimeType: "text/plain", text: "Unknown resource." }] };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add_memory",
                description: "Add a new memory to VibeLab. Use this to save important context, decisions, or information for future reference.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "Short title for the memory" },
                        content: { type: "string", description: "Full content to remember" },
                        tags: { type: "array", items: { type: "string" }, description: "Optional tags for organization" },
                        source: { type: "string", description: "Source: manual, chatgpt, claude, gemini, cursor" },
                    },
                    required: ["title", "content"],
                },
            },
            {
                name: "search_memories",
                description: "Search through stored memories by keyword or tag.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query" },
                        maxResults: { type: "number", description: "Maximum results to return (default 5)" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_context",
                description: "Get optimized context from memories within a token budget.",
                inputSchema: {
                    type: "object",
                    properties: {
                        maxTokens: { type: "number", description: "Maximum tokens (default 2000)" },
                        tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
                        useSummaries: { type: "boolean", description: "Use summaries instead of full content (default true)" },
                    },
                },
            },
            {
                name: "list_memories",
                description: "List all memories with their titles and metadata.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: { type: "number", description: "Maximum memories to list (default 20)" },
                    },
                },
            },
            {
                name: "delete_memory",
                description: "Delete a memory by ID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "Memory ID to delete" },
                    },
                    required: ["id"],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const memories = loadMemories();

    switch (name) {
        case "add_memory": {
            const now = new Date().toISOString();
            const content = args.content;
            const summary = generateSummary(content);

            const memory = {
                id: generateId(),
                title: args.title,
                content,
                summary,
                tags: args.tags || [],
                source: args.source || "cursor",
                createdAt: now,
                updatedAt: now,
                tokenCount: estimateTokens(content),
                summaryTokenCount: estimateTokens(summary),
                relevanceScore: 100,
                tier: "hot",
            };

            memories.unshift(memory);
            saveMemories(memories);

            return {
                content: [{
                    type: "text",
                    text: `✓ Memory saved: "${memory.title}" (${memory.tokenCount} tokens)\nID: ${memory.id}`,
                }],
            };
        }

        case "search_memories": {
            const query = args.query.toLowerCase();
            const maxResults = args.maxResults || 5;

            const results = memories.filter(m =>
                m.title.toLowerCase().includes(query) ||
                m.content.toLowerCase().includes(query) ||
                m.tags.some(t => t.toLowerCase().includes(query))
            ).slice(0, maxResults);

            if (results.length === 0) {
                return { content: [{ type: "text", text: `No memories found for "${args.query}"` }] };
            }

            const text = results.map(m =>
                `**${m.title}** (${m.source}, ${m.tokenCount} tokens)\n${m.summary || m.content.slice(0, 100)}...`
            ).join("\n\n");

            return { content: [{ type: "text", text: `Found ${results.length} memories:\n\n${text}` }] };
        }

        case "get_context": {
            const maxTokens = args.maxTokens || 2000;
            const useSummaries = args.useSummaries !== false;
            const filterTags = args.tags || [];

            let filtered = memories;
            if (filterTags.length > 0) {
                filtered = memories.filter(m => filterTags.some(t => m.tags.includes(t)));
            }

            // Sort by recency
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            let totalTokens = 0;
            const selected = [];

            for (const memory of filtered) {
                const tokens = useSummaries ? (memory.summaryTokenCount || memory.tokenCount) : memory.tokenCount;
                if (totalTokens + tokens <= maxTokens) {
                    selected.push(memory);
                    totalTokens += tokens;
                }
            }

            const text = selected.map(m => {
                const content = useSummaries ? (m.summary || m.content) : m.content;
                return `## ${m.title}\n${content}`;
            }).join("\n\n---\n\n");

            return {
                content: [{
                    type: "text",
                    text: `# Context (${totalTokens} tokens, ${selected.length} memories)\n\n${text}`,
                }],
            };
        }

        case "list_memories": {
            const limit = args.limit || 20;
            const list = memories.slice(0, limit);

            if (list.length === 0) {
                return { content: [{ type: "text", text: "No memories stored." }] };
            }

            const text = list.map((m, i) =>
                `${i + 1}. **${m.title}** (${m.source}, ${m.tokenCount} tokens)\n   ID: ${m.id}`
            ).join("\n");

            return {
                content: [{
                    type: "text",
                    text: `${memories.length} memories total:\n\n${text}`,
                }],
            };
        }

        case "delete_memory": {
            const index = memories.findIndex(m => m.id === args.id);
            if (index === -1) {
                return { content: [{ type: "text", text: `Memory not found: ${args.id}` }] };
            }

            const deleted = memories.splice(index, 1)[0];
            saveMemories(memories);

            return {
                content: [{
                    type: "text",
                    text: `✓ Deleted: "${deleted.title}"`,
                }],
            };
        }

        default:
            return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[VibeLab Memory MCP] Server started");
}

main().catch(console.error);
