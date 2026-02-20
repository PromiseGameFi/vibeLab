import { ReActTool } from './index';
import { ReadSourceTool } from './read-source';
import { AnalyzeCodeTool } from './analyze-code';
import { GenerateExploitTool } from './generate-exploit';
import { ExecuteExploitTool } from './execute-exploit';
import { GetTransactionsTool } from './get-transactions';
import { CheckStorageTool } from './check-storage';

import { AnalyzeArchitectureTool } from './analyze-architecture';
import { AskHumanTool } from './ask-human';
import { GenerateFuzzCampaignTool } from './generate-fuzz-campaign';

export const getAvailableTools = (): ReActTool[] => [
    new ReadSourceTool(),
    new AnalyzeCodeTool(),
    new AnalyzeArchitectureTool(),
    new AskHumanTool(),
    new GenerateFuzzCampaignTool(),
    new GenerateExploitTool(),
    new ExecuteExploitTool(),
    new GetTransactionsTool(),
    new CheckStorageTool(),
];

export const getToolDefinition = (name: string): ReActTool | undefined => {
    return getAvailableTools().find((t) => t.definition.name === name);
};
