import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

export interface ContractFile {
    name: string;
    path: string;
    content: string;
}

export async function scanDirectory(targetPath: string): Promise<ContractFile[]> {
    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
        if (!targetPath.endsWith('.sol')) {
            throw new Error('Target must be a .sol file or directory');
        }
        const content = await fs.readFile(targetPath, 'utf-8');
        return [{
            name: path.basename(targetPath),
            path: targetPath,
            content
        }];
    }

    const files = await glob(`${targetPath}/**/*.sol`, { ignore: 'node_modules/**' });

    const contracts: ContractFile[] = [];
    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        contracts.push({
            name: path.basename(file),
            path: file,
            content
        });
    }

    return contracts;
}
