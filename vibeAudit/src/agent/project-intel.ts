import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import crypto from 'crypto';

const execAsync = promisify(exec);

export interface ProjectIntel {
    files: { path: string; content: string }[];
    projectType: string;
    isLocal: boolean;
    sourcePath: string;
}

export async function gatherProjectIntel(targetPath: string): Promise<ProjectIntel> {
    console.log(chalk.cyan(`   📂 Gathering project intelligence on ${targetPath}...`));

    let workingDir = targetPath;
    let isLocal = true;

    // Check if it's a GitHub URL
    if (targetPath.startsWith('http') || targetPath.startsWith('git@') || targetPath.includes('github.com')) {
        isLocal = false;
        const tmpId = crypto.randomUUID().substring(0, 8);
        workingDir = path.join(process.cwd(), '.vibe_tmp', `project_${tmpId}`);

        console.log(chalk.gray(`     Cloning repository to temporary workspace...`));
        try {
            await execAsync(`git clone --depth 1 ${targetPath} ${workingDir}`);
        } catch (e) {
            throw new Error(`Failed to clone repository: ${(e as Error).message}`);
        }
    } else {
        // Resolve local path
        workingDir = path.resolve(process.cwd(), targetPath);
        try {
            const stat = await fs.stat(workingDir);
            if (!stat.isDirectory()) {
                throw new Error('Target path is not a directory.');
            }
        } catch {
            throw new Error('Target directory does not exist or is inaccessible.');
        }
    }

    const files: { path: string; content: string }[] = [];

    // Recursive directory reader
    async function readSolidityFiles(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip common ignore dirs
            if (entry.isDirectory()) {
                if (['node_modules', 'lib', '.git', 'out', 'cache', 'artifacts', 'build', 'broadcast'].includes(entry.name)) {
                    continue;
                }
                await readSolidityFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.sol')) {
                const content = await fs.readFile(fullPath, 'utf8');
                // Store relative path for context
                const relPath = path.relative(workingDir, fullPath);
                files.push({ path: relPath, content });
            }
        }
    }

    await readSolidityFiles(workingDir);

    console.log(chalk.green(`     ✓ Found ${files.length} Solidity files.`));

    return {
        files,
        projectType: 'EVM/Solidity', // Easily extended to detect Cargo.toml etc.
        isLocal,
        sourcePath: workingDir
    };
}
