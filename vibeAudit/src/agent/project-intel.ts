import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import crypto from 'crypto';

const execAsync = promisify(exec);

export interface ProjectFile {
    path: string;
    content: string;
    language: 'solidity' | 'rust' | 'move';
}

export interface ProjectIntel {
    files: ProjectFile[];
    projectType: string;
    isLocal: boolean;
    sourcePath: string;
}

const SUPPORTED_EXTENSIONS: Record<string, ProjectFile['language']> = {
    '.sol': 'solidity',
    '.rs': 'rust',
    '.move': 'move',
};

function detectProjectType(files: ProjectFile[]): string {
    const counts = {
        solidity: files.filter((f) => f.language === 'solidity').length,
        rust: files.filter((f) => f.language === 'rust').length,
        move: files.filter((f) => f.language === 'move').length,
    };

    if (counts.solidity >= counts.rust && counts.solidity >= counts.move) return 'EVM/Solidity';
    if (counts.rust >= counts.move) return 'Solana/Rust';
    return 'Sui/Move';
}

async function discoverProjectFiles(baseDir: string, maxFiles: number = 400): Promise<ProjectFile[]> {
    const files: ProjectFile[] = [];

    async function walk(dir: string): Promise<void> {
        if (files.length >= maxFiles) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (files.length >= maxFiles) break;

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (['node_modules', 'lib', '.git', 'out', 'cache', 'artifacts', 'build', 'broadcast', 'target'].includes(entry.name)) {
                    continue;
                }
                await walk(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;

            const ext = path.extname(entry.name).toLowerCase();
            const lang = SUPPORTED_EXTENSIONS[ext];
            if (!lang) continue;

            const content = await fs.readFile(fullPath, 'utf8');
            files.push({
                path: path.relative(baseDir, fullPath),
                content,
                language: lang,
            });
        }
    }

    await walk(baseDir);
    return files;
}

export async function gatherProjectIntel(targetPath: string): Promise<ProjectIntel> {
    console.log(chalk.cyan(`   📂 Gathering project intelligence on ${targetPath}...`));

    let workingDir = targetPath;
    let isLocal = true;
    let singleFileOverride: ProjectFile | null = null;

    if (targetPath.startsWith('http') || targetPath.startsWith('git@') || targetPath.includes('github.com')) {
        isLocal = false;
        const tmpId = crypto.randomUUID().substring(0, 8);
        workingDir = path.join(process.cwd(), '.vibe_tmp', `project_${tmpId}`);

        console.log(chalk.gray('     Cloning repository to temporary workspace...'));
        await execAsync(`git clone --depth 1 ${targetPath} ${workingDir}`)
            .catch((e) => {
                throw new Error(`Failed to clone repository: ${(e as Error).message}`);
            });
    } else {
        workingDir = path.resolve(process.cwd(), targetPath);
        const stat = await fs.stat(workingDir)
            .catch(() => {
                throw new Error('Target directory does not exist or is inaccessible.');
            });

        if (stat.isFile()) {
            const ext = path.extname(workingDir).toLowerCase();
            const language = SUPPORTED_EXTENSIONS[ext];
            if (!language) {
                throw new Error('Target file must be .sol, .rs, or .move');
            }

            const content = await fs.readFile(workingDir, 'utf8');
            singleFileOverride = {
                path: path.basename(workingDir),
                content,
                language,
            };
            workingDir = path.dirname(workingDir);
        } else if (!stat.isDirectory()) {
            throw new Error('Target path is not a directory or supported source file.');
        }
    }

    const files = singleFileOverride ? [singleFileOverride] : await discoverProjectFiles(workingDir);
    const projectType = detectProjectType(files);

    console.log(chalk.green(`     ✓ Found ${files.length} source files (${projectType}).`));

    return {
        files,
        projectType,
        isLocal,
        sourcePath: workingDir,
    };
}
