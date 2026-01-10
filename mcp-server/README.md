# VibeLab Memory MCP Server

MCP (Model Context Protocol) server that exposes your AI memories to compatible tools like Cursor, Claude Desktop, and VS Code.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

### Cursor

Add to your Cursor settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "vibelab-memory": {
      "command": "node",
      "args": ["/path/to/vibeLab/mcp-server/index.js"]
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "vibelab-memory": {
      "command": "node",
      "args": ["/path/to/vibeLab/mcp-server/index.js"]
    }
  }
}
```

## Available Resources

| Resource URI | Description |
|--------------|-------------|
| `memory://all` | All stored memories |
| `memory://recent` | Memories from last 24 hours |
| `memory://context` | Token-optimized context (max 4000 tokens) |
| `memory://id/{id}` | Specific memory by ID |

## Available Tools

### `add_memory`
Save a new memory.

```
add_memory(title: "Project Requirements", content: "The API should...", tags: ["project"])
```

### `search_memories`
Search through memories.

```
search_memories(query: "authentication", maxResults: 5)
```

### `get_context`
Get optimized context within token budget.

```
get_context(maxTokens: 2000, useSummaries: true, tags: ["project"])
```

### `list_memories`
List all memories with metadata.

```
list_memories(limit: 10)
```

### `delete_memory`
Delete a memory by ID.

```
delete_memory(id: "mem_123...")
```

## Storage

Memories are stored in `~/.vibelab/memories.json`.

## Usage Examples

In Cursor or Claude Desktop, you can:

1. **Read context**: "Read the memory://context resource to understand our project"
2. **Save decisions**: "Use add_memory to save that we're using PostgreSQL"
3. **Search**: "Search memories for authentication"
4. **Get context**: "Get context with max 1000 tokens about the API"
