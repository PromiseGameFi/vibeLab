// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableVault
 * @dev A deliberately vulnerable contract for testing VibeAudit.
 *      Contains multiple known vulnerabilities:
 *      1. Reentrancy in withdraw()
 *      2. Missing access control on emergencyWithdraw()
 *      3. Integer manipulation in reward calculation
 *      4. No slippage protection
 */
contract VulnerableVault {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewardDebt;
    
    address public owner;
    uint256 public totalDeposits;
    uint256 public rewardRate = 100; // basis points

    constructor() {
        owner = msg.sender;
    }

    // ─── VULNERABILITY 1: Reentrancy ────────────────────────
    // Sends ETH BEFORE updating state
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // BUG: External call BEFORE state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // State update happens AFTER the call — reentrancy!
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
    }

    // ─── VULNERABILITY 2: Missing Access Control ────────────
    // Anyone can drain ALL funds
    function emergencyWithdraw() external {
        // BUG: No onlyOwner modifier!
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ─── VULNERABILITY 3: Manipulable Reward Calculation ────
    // Reward is based on current balance, which can be manipulated
    function calculateReward(address user) public view returns (uint256) {
        // BUG: Uses current contract balance for calculation
        // An attacker can inflate this with a flash loan deposit
        return (balances[user] * rewardRate * address(this).balance) / (totalDeposits * 10000);
    }

    function claimReward() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward");
        
        rewardDebt[msg.sender] += reward;
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");
    }

    // ─── VULNERABILITY 4: tx.origin Phishing ────────────────
    function changeOwner(address newOwner) external {
        // BUG: Uses tx.origin instead of msg.sender
        require(tx.origin == owner, "Not owner");
        owner = newOwner;
    }

    receive() external payable {}
}
