# VibeAudit

**AI-Powered Smart Contract Security Scanner**

VibeAudit is a defensive tool that uses **Gemini 2.0 Flash (via OpenRouter)** to audit your local Solidity smart contracts for common vulnerabilities.

## 🚀 Quick Start

### 1. Installation
```bash
cd vibeAudit
npm install
cp .env.example .env
```

### 2. Configuration
Edit `.env` and add your OpenRouter API key:
```ini
OPENROUTER_API_KEY=sk-or-vv-...
AI_MODEL=google/gemini-2.0-flash-exp:free
```

### 3. Usage
Scan a single file or a directory:
```bash
# Scan a specific file
npm run scan -- ./contracts/MyContract.sol

# Scan a directory
npm run scan -- ./contracts
```

## 🛡️ Capabilities

VibeAudit uses static analysis (AI) to detect:
- **Reentrancy**: Unsafe external calls before state updates.
- **Access Control**: Missing `onlyOwner` or similar modifiers.
- **Integer Overflow/Underflow**: (Mostly relevant for Solidity <0.8.0).
- **Unchecked Return Values**: Ignoring return data from low-level calls.
- **Phishing**: `tx.origin` usage.

**Note:** This is a **static analysis tool**. It does not execute code or guarantee safety. Always use professional audits for mainnet deployments.
