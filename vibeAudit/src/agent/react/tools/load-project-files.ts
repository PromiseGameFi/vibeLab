import { ReActTool } from './index';
import { gatherProjectIntel } from '../../project-intel';

export interface LoadProjectFilesResult {
    projectPath: string;
    projectType: string;
    fileCount: number;
    files: { path: string; content: string; language: string }[];
}

export class LoadProjectFilesTool implements ReActTool {
    definition = {
        name: 'load_project_files',
        description: 'Loads smart contract source files from a local path or repository URL for project-wide architecture analysis.',
        parameters: {
            type: 'object',
            properties: {
                projectPath: {
                    type: 'string',
                    description: 'Local project directory path or git repository URL.',
                },
            },
            required: ['projectPath'],
        },
    };

    async execute(args: { projectPath: string }): Promise<string> {
        if (!args.projectPath) {
            return JSON.stringify({ ok: false, error: 'Missing projectPath.' });
        }

        try {
            const intel = await gatherProjectIntel(args.projectPath);
            const payload: LoadProjectFilesResult = {
                projectPath: intel.sourcePath,
                projectType: intel.projectType,
                fileCount: intel.files.length,
                files: intel.files,
            };

            return JSON.stringify({ ok: true, ...payload });
        } catch (error) {
            return JSON.stringify({
                ok: false,
                error: (error as Error).message,
            });
        }
    }
}
