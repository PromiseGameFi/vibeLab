import { Command } from 'commander';
import dotenv from 'dotenv';
import { scanDirectory } from './scanner';
import { auditContract } from './auditor';
import { generateReport } from './reporter';
import chalk from 'chalk';

dotenv.config();

const program = new Command();

program
    .name('vibeAudit')
    .description('AI-powered smart contract vulnerability scanner')
    .version('0.1.0');

program
    .command('scan')
    .argument('<path>', 'Path to a .sol file or directory')
    .action(async (path) => {
        console.log(chalk.blue(`🔍 Scanning ${path}...`));

        try {
            const files = await scanDirectory(path);
            if (files.length === 0) {
                console.log(chalk.yellow('⚠️  No .sol files found.'));
                return;
            }

            console.log(chalk.cyan(`Found ${files.length} contracts. Starting audit with ${process.env.AI_MODEL || 'Gemini'}...`));

            const results = [];
            for (const file of files) {
                console.log(`Analyzing ${file.name}...`);
                const findings = await auditContract(file.content, file.name);
                results.push({ file: file.name, findings });
            }

            const reportPath = await generateReport(results);
            console.log(chalk.green(`\n✅ Audit Complete! Report saved to: ${reportPath}`));

        } catch (error) {
            console.error(chalk.red('❌ Audit failed:'), error);
            process.exit(1);
        }
    });

program.parse();
