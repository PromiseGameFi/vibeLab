export class AgentMemory {
    private history: any[] = [];
    private maxTokens: number = 8000;

    constructor() { }

    addMessage(role: string, content: string, name?: string, toolCallId?: string, toolCalls?: any[]) {
        const msg: any = { role, content: content || '' };
        if (name) msg.name = name;
        if (toolCallId) msg.tool_call_id = toolCallId;
        if (toolCalls) msg.tool_calls = toolCalls;

        this.history.push(msg);
    }

    getHistory(): any[] {
        return this.history;
    }

    getSummary(): string {
        return this.history.map(m => `[${m.role.toUpperCase()}] ${m.content ? m.content.substring(0, 100) : 'TOOL CALL'}`).join('\n');
    }

    clear() {
        this.history = [];
    }
}
