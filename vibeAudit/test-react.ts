import fs from 'fs';
import { ReActEngine } from './src/agent/react/loop';
import { EVMProvider } from './src/chains/evm-provider';

// Fake address
const TARGET_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
    console.log('Loading local VulnerableVault.sol...');
    const sourceCode = fs.readFileSync('test-contracts/VulnerableVault.sol', 'utf8');

    // Seed provider mock 
    console.log('Patching getProvider to serve local source...');
    // EVMProvider defaults will be used, we just override gatherIntel and getSourceCode

    // We must intercept require to mock getProvider globally, or just monkeypatch the evm provider instance
    // Instead of intercepting the module require, the tools call getProvider(args.chain, args.rpcUrl)
    // which calls EVMProvider.connect(). Let's monkeypatch EVMProvider.prototype.

    const origGatherIntel = EVMProvider.prototype.gatherIntel;
    EVMProvider.prototype.gatherIntel = async function (address: string) {
        if (address.toLowerCase() === TARGET_ADDRESS.toLowerCase()) {
            return {
                chainType: 'evm',
                chainName: 'ethereum',
                address: TARGET_ADDRESS,
                programName: 'VulnerableVault',
                bytecode: '0x1234',
                bytecodeSize: 2,
                balance: '10.0',
                sourceCode: sourceCode,
                language: 'solidity',
                isUpgradeable: false,
                detectedFunctions: ['deposit', 'withdraw'],
                totalTxCount: 0,
                extra: {}
            };
        }
        return origGatherIntel.call(this, address);
    };

    const origGetSourceCode = EVMProvider.prototype.getSourceCode;
    EVMProvider.prototype.getSourceCode = async function (address: string) {
        if (address.toLowerCase() === TARGET_ADDRESS.toLowerCase()) {
            return sourceCode;
        }
        return origGetSourceCode.call(this, address);
    };

    // Replace the connect so it doesn't crash on invalid RPC during tests
    EVMProvider.prototype.connect = async function () { };

    console.log('\n--- RUNNING REACT ENGINE ---');
    console.log(`Target: ${TARGET_ADDRESS} (Mocked VulnerableVault)`);

    // The ReAct engine will emit thoughts and actions, let's log them cleanly
    const engine = new ReActEngine('test_run');

    engine.onThought = (t) => { }; // loop.ts console.logs thoughts already
    engine.onAction = (a, args) => { }; // logic already logged
    engine.onObservation = (o) => { }; // logged

    // Since we patched EVMProvider, read_source tool will succeed and return the source code
    // execute_exploit tool will create a test, drop source code into Target.sol, and run it locally

    const result = await engine.run(TARGET_ADDRESS, 'ethereum');

    console.log('\n=======================================');
    console.log('--- FINAL AGENT RESULT ---');
    console.log(`Status: ${result.status}`);
    console.log(`Details:\n${result.details}`);
    console.log('=======================================');
}

main().catch(console.error);
