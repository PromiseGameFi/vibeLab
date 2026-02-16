# Smart Contract Vulnerability Research (Defensive Audit Guide)

This document catalogues common EVM attack vectors and vulnerabilities to guide the **VibeAudit** tool's detection logic. It focuses on the *mechanism* of each exploit to ensure accurate identification and remediation.

## 1. Reentrancy
**Severity**: Critical
**Mechanism**:
An external malicious contract calls back into the vulnerable contract before the first function execution is complete. This exploits the gap between *checks* (validating state) and *effects* (updating state).

**Attack Vector**:
1. Victim contract checks balance: `require(balance[msg.sender] > 0)`.
2. Victim sends ETH: `msg.sender.call{value: amount}("")`.
3. Malicious `fallback()` function in `msg.sender` receives ETH and immediately calls `withdraw()` again.
4. Since `balance[msg.sender]` hasn't been set to 0 yet, the loop continues until funds are drained.

**Detection Signals (for AI/Static Analysis)**:
- Usage of `.call{value: ...}` before updating state variables.
- Absence of `nonReentrant` modifiers on external functions that make calls.

---

## 2. Flash Loan Attacks
**Severity**: High
**Mechanism**:
Attackers borrow massive liquidity (e.g., $100M) for a single transaction to skew pool ratios or manipulate governance.

**Attack Vector**:
1. Borrow huge amount of Token A from dYdX/Aave.
2. Swap Token A for Token B on a DEX to artificially inflate Token B's price.
3. Call a function in the Victim Protocol that relies on the spot price of Token B (Oracle Manipulation).
4. Profit from the mispricing using the borrowed funds.
5. Repay the loan.

**Detection Signals**:
- Protocol relies on spot prices from a single DEX pair (e.g., `UniswapV2Pair.getReserves`).
- Lack of Time-Weighted Average Price (TWAP) usage.

---

## 3. Oracle Manipulation
**Severity**: Critical
**Mechanism**:
Feeding incorrect data to a smart contract to trigger improper logic (e.g., liquidations).

**Attack Vector**:
- **Spot Price Manipulation**: Relying on the current ratio of a Uniswap pool, which can be manipulated atomically (see Flash Loans).
- **Centralized Oracle**: Relying on a single `owner` or API endpoint to push prices.

**Detection Signals**:
- Direct calls to `pair.getReserves()` for pricing.
- Lack of deviation checks or staleness checks on Chainlink feeds.

---

## 4. Front-Running (MEV)
**Severity**: Medium/High
**Mechanism**:
Bots observe a pending transaction in the mempool and submit their own transaction with higher gas to get executed *first*.

**Attack Vector**:
- **Sandwich Attack**: User tries to buy Token X. Bot buys Token X before them (pushing price up), then sells immediately after the user buys (for profit).
- **Displacement**: User finds a bug/solution to a riddle. Bot sees the solution in mempool and submits it first.

**Detection Signals**:
- Logic dependent on transaction ordering.
- Lack of slippage protection (e.g., `amountOutMin`) in swap functions.

---

## 5. Integer Overflow/Underflow
**Severity**: High (Low in Solidity >= 0.8.0)
**Mechanism**:
Exceeding the storage capacity of a data type (e.g., `uint256`). `2**256 - 1 + 1` wraps around to `0`.

**Attack Vector**:
- **Batch Overflow**: `uint total = amount * recipients.length`. If user passes huge inputs, `total` overflows to a small number, bypassing balance checks, but the loop sends real tokens.

**Detection Signals**:
- solidity version < 0.8.0 without `SafeMath`.
- `unchecked` blocks in Solidity >= 0.8.0 (auditor should verify safety).

---

## 6. Access Control Failures
**Severity**: Critical
**Mechanism**:
Missing or incorrect authorization checks on sensitive functions.

**Attack Vector**:
- **Missing Modifier**: `function withdraw() public { ... }` (forgot `onlyOwner`).
- **tx.origin Phishing**: `require(tx.origin == owner)`. Attacker tricks owner into clicking a link/contract, which calls the victim contract. `msg.sender` is the attacker contract, but `tx.origin` is the owner.

**Detection Signals**:
- Public/External functions modifying state without `onlyOwner` or roles.
- Use of `tx.origin` for auth.
- `delegatecall` to untrusted addresses.

---

## 7. Signature Replay
**Severity**: High
**Mechanism**:
Using the same valid signature multiple times or across different chains.

**Attack Vector**:
- User signs "Transfer 10 tokens to Bob".
- Bob submits the signature to the contract.
- Bob submits the *same* signature again. If the contract doesn't track "used nonces", it pays out again.

**Detection Signals**:
- `ecrecover` usage without a `nonce` mapping.
- Lack of `chainid` in the signed data (EIP-712 violation permits cross-chain replay).

---

## Research Sources & Tools
- **OWASP Smart Contract Top 10**
- **SWC Registry**: Comprehensive catalogue of weaknesses.
- **Rekt.news**: Archive of high-profile DeFi exploits.
- **Tools**: Foundry (Fuzzing), Slither (Static Analysis), Mythril (Symbolic Execution).

---

## 8. Novel & Zero-Day Detection (AI)
**Mechanism**:
Traditional tools (Slither) only look for *known* patterns. AI (Gemini/OpenAI) can detect **novel conceptual logic errors** or "new algorithms" of exploitation by analyzing the *intent* vs. *implementation*.

**Detection Strategy**:
- **Invariance Analysis**: Checking if "X should always be equal to Y" holds true under extreme conditions.
- **Economic Logic**: "Can a user extract more value than they put in?" (regardless of the specific code path).

## 9. Exploitation & Verification (PoC)
To "attack" a vulnerability safely, we generate a **Proof of Concept (PoC)** test case.

**Mechanism**:
Instead of running a bot on mainnet (which is illegal/unethical), we generate a **Foundry/Hardhat test script** that:
1.  Forks the chain state.
2.  Deploys the victim contract.
3.  Simulates the attack (e.g., Flash Loan -> Reenter -> Profit).
4.  Asserts that the attack successfully drained funds.

**VibeAudit Capability**:
The AI will now attempt to **generate this PoC code** for every vulnerability it finds, allowing you to "attack" your own code locally to prove the bug exists.
