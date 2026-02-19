/**
 * ReAct Tool Interface
 * Defines the contract that all tools available to the ReAct agent must follow.
 */

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
}

export interface ReActTool {
    /**
     * The OpenAI-compatible function definition for the tool.
     */
    definition: ToolDefinition;

    /**
     * Executes the tool with the given arguments.
     * @param args The arguments parsed from the LLM's tool call.
     * @returns A string representation of the observation (e.g., text, JSON, or error message).
     */
    execute(args: any): Promise<string>;
}
