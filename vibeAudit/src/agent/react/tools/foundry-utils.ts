import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const CANDIDATE_LIB_DIRS = [
    path.join(process.cwd(), 'lib'),
    path.join(process.cwd(), '.vibeaudit-pipeline', 'lib'),
];

export async function resolveFoundryLibDir(): Promise<string> {
    for (const dir of CANDIDATE_LIB_DIRS) {
        try {
            const stat = await fs.stat(path.join(dir, 'forge-std', 'src'));
            if (stat.isDirectory()) return dir;
        } catch {
            // continue
        }
    }

    throw new Error(
        'Missing forge-std library. Expected at ./lib/forge-std or ./.vibeaudit-pipeline/lib/forge-std',
    );
}

export async function prepareFoundryWorkspace(rootDir: string, profile: string): Promise<void> {
    await fs.mkdir(path.join(rootDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(rootDir, 'test'), { recursive: true });

    await fs.writeFile(path.join(rootDir, 'foundry.toml'), profile, 'utf8');
    await fs.writeFile(path.join(rootDir, 'remappings.txt'), 'forge-std/=lib/forge-std/src/', 'utf8');

    const libDir = await resolveFoundryLibDir();
    const linkedLib = path.join(rootDir, 'lib');
    try {
        await fs.symlink(libDir, linkedLib, 'dir');
    } catch {
        await execAsync(`cp -R ${libDir} ${linkedLib}`);
    }
}

export function parseForgeOutput(rawOutput: string): {
    passed: boolean;
    hasCompilerError: boolean;
    failureReason?: string;
} {
    const output = rawOutput || '';
    const passed = output.includes('PASS') && !output.includes('FAIL');

    const compilerMarkers = [
        'Compiler run failed',
        'Error (',
        'ParserError',
        'DeclarationError',
        'TypeError',
    ];

    const hasCompilerError = compilerMarkers.some((marker) => output.includes(marker));

    const failureReason = !passed
        ? output.split('\n').slice(0, 30).join('\n')
        : undefined;

    return { passed, hasCompilerError, failureReason };
}

export async function cleanupDir(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true }).catch(() => undefined);
}
