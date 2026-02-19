/**
 * Reinforcement Learning Database — Self-Improving Security Analysis
 * 
 * Tracks vulnerability patterns, calibrates severity predictions,
 * optimizes triage feature weights, and enables cross-contract learning.
 * The agent gets measurably smarter with every analysis.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

// ─── Types ──────────────────────────────────────────────────────────

export interface VulnPattern {
    category: string;
    contractType: string;       // "ERC-20", "ERC-721", "DEX", "Bridge", "Other"
    totalPredictions: number;
    confirmed: number;
    denied: number;
    avgSeverityPredicted: number;   // 1-4 scale (INFO=0, LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4)
    avgSeverityConfirmed: number;
    confidence: number;             // confirmed / totalPredictions
    lastUpdated: string;
}

export interface SeverityCalibration {
    id: number;
    category: string;
    predictedSeverity: string;
    actualSeverity: string;         // "confirmed" | "denied" | adjusted severity
    contractAddress: string;
    chain: string;
    reason: string;                 // Why it was/wasn't exploitable
    timestamp: string;
}

export interface FeatureWeight {
    feature: string;                // e.g. "balance", "bytecodeSize", "hasSource", "isProxy"
    weight: number;                 // Current optimized weight for triage scoring
    updateCount: number;            // How many times this weight has been adjusted
    lastAdjustment: number;         // Last delta applied
    lastUpdated: string;
}

export interface LearningContext {
    category: string;
    contractType: string;
    wasConfirmed: boolean;
    predictedSeverity: string;
    contractAddress: string;
    chain: string;
    reason: string;
    features: Record<string, number>;   // Triage features that led to this analysis
}

export interface PatternMatch {
    category: string;
    confidence: number;
    avgSeverity: number;
    suggestion: string;
}

// ─── Learning Engine ────────────────────────────────────────────────

export class LearningEngine {
    private db: Database.Database;

    constructor(dbPath?: string) {
        const dir = path.join(process.cwd(), '.vibeaudit-agent');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new Database(dbPath || path.join(dir, 'learning.db'));
        this.db.pragma('journal_mode = WAL');
        this.init();
    }

    // ─── Schema ─────────────────────────────────────────────────

    private init(): void {
        this.db.exec(`
            -- Pattern confidence per (category, contractType)
            CREATE TABLE IF NOT EXISTS vulnerability_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                contract_type TEXT NOT NULL DEFAULT 'Other',
                total_predictions INTEGER DEFAULT 0,
                confirmed INTEGER DEFAULT 0,
                denied INTEGER DEFAULT 0,
                avg_severity_predicted REAL DEFAULT 0,
                avg_severity_confirmed REAL DEFAULT 0,
                confidence REAL DEFAULT 0,
                last_updated TEXT NOT NULL,
                UNIQUE(category, contract_type)
            );

            -- Individual severity calibrations (every prediction vs. reality)
            CREATE TABLE IF NOT EXISTS severity_calibration (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                predicted_severity TEXT NOT NULL,
                actual_severity TEXT NOT NULL,
                contract_address TEXT NOT NULL,
                chain TEXT NOT NULL,
                reason TEXT,
                timestamp TEXT NOT NULL
            );

            -- Triage feature weights (adaptive scoring)
            CREATE TABLE IF NOT EXISTS feature_weights (
                feature TEXT PRIMARY KEY,
                weight REAL NOT NULL DEFAULT 1.0,
                update_count INTEGER DEFAULT 0,
                last_adjustment REAL DEFAULT 0,
                last_updated TEXT NOT NULL
            );

            -- Cross-contract pattern matches (bytecode similarity)
            CREATE TABLE IF NOT EXISTS bytecode_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bytecode_hash TEXT NOT NULL,
                pattern_signature TEXT NOT NULL,
                contract_address TEXT NOT NULL,
                chain TEXT NOT NULL,
                vulnerability_categories TEXT NOT NULL,
                risk_score INTEGER DEFAULT 0,
                timestamp TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_patterns_cat ON vulnerability_patterns(category);
            CREATE INDEX IF NOT EXISTS idx_patterns_conf ON vulnerability_patterns(confidence DESC);
            CREATE INDEX IF NOT EXISTS idx_calibration_cat ON severity_calibration(category);
            CREATE INDEX IF NOT EXISTS idx_bytecode_hash ON bytecode_patterns(bytecode_hash);
            CREATE INDEX IF NOT EXISTS idx_bytecode_pattern ON bytecode_patterns(pattern_signature);
        `);

        // Seed default feature weights if empty
        const count = this.db.prepare('SELECT COUNT(*) as c FROM feature_weights').get() as any;
        if (count.c === 0) {
            this.seedDefaultWeights();
        }
    }

    private seedDefaultWeights(): void {
        const defaults: Record<string, number> = {
            balance_eth: 15,
            bytecode_size: 8,
            has_source: 12,
            is_proxy: 10,
            is_token: 5,
            tx_count: 6,
            unique_callers: 4,
            has_owner: 3,
            deploy_age_days: 5,
            contract_type_erc20: 7,
            contract_type_erc721: 6,
            contract_type_bridge: 15,
            contract_type_defi: 12,
            historical_vuln_rate: 20,
        };

        const stmt = this.db.prepare(`
            INSERT INTO feature_weights (feature, weight, update_count, last_adjustment, last_updated)
            VALUES (?, ?, 0, 0, ?)
        `);

        const now = new Date().toISOString();
        for (const [feature, weight] of Object.entries(defaults)) {
            stmt.run(feature, weight, now);
        }
    }

    // ─── Record Learning from Analysis ──────────────────────────

    /**
     * Record the outcome of a vulnerability prediction.
     * Called after simulation confirms or denies a finding.
     */
    recordOutcome(ctx: LearningContext): void {
        const severityNum = severityToNum(ctx.predictedSeverity);
        const now = new Date().toISOString();

        // 1. Update pattern confidence
        const existing = this.db.prepare(`
            SELECT * FROM vulnerability_patterns
            WHERE category = ? AND contract_type = ?
        `).get(ctx.category, ctx.contractType) as any;

        if (existing) {
            const newTotal = existing.total_predictions + 1;
            const newConfirmed = existing.confirmed + (ctx.wasConfirmed ? 1 : 0);
            const newDenied = existing.denied + (ctx.wasConfirmed ? 0 : 1);

            // Running average of predicted severity
            const newAvgPredicted = (
                existing.avg_severity_predicted * existing.total_predictions + severityNum
            ) / newTotal;

            // Running average of confirmed severity (only count confirmed)
            let newAvgConfirmed = existing.avg_severity_confirmed;
            if (ctx.wasConfirmed) {
                const prevConfCount = existing.confirmed || 1;
                newAvgConfirmed = (existing.avg_severity_confirmed * prevConfCount + severityNum) / newConfirmed;
            }

            const confidence = newConfirmed / newTotal;

            this.db.prepare(`
                UPDATE vulnerability_patterns
                SET total_predictions = ?, confirmed = ?, denied = ?,
                    avg_severity_predicted = ?, avg_severity_confirmed = ?,
                    confidence = ?, last_updated = ?
                WHERE category = ? AND contract_type = ?
            `).run(
                newTotal, newConfirmed, newDenied,
                newAvgPredicted, newAvgConfirmed,
                confidence, now,
                ctx.category, ctx.contractType,
            );
        } else {
            this.db.prepare(`
                INSERT INTO vulnerability_patterns
                (category, contract_type, total_predictions, confirmed, denied,
                 avg_severity_predicted, avg_severity_confirmed, confidence, last_updated)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
            `).run(
                ctx.category, ctx.contractType,
                ctx.wasConfirmed ? 1 : 0,
                ctx.wasConfirmed ? 0 : 1,
                severityNum,
                ctx.wasConfirmed ? severityNum : 0,
                ctx.wasConfirmed ? 1.0 : 0.0,
                now,
            );
        }

        // 2. Record severity calibration
        this.db.prepare(`
            INSERT INTO severity_calibration
            (category, predicted_severity, actual_severity, contract_address, chain, reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            ctx.category,
            ctx.predictedSeverity,
            ctx.wasConfirmed ? 'confirmed' : 'denied',
            ctx.contractAddress,
            ctx.chain,
            ctx.reason,
            now,
        );

        // 3. Adjust feature weights based on outcome
        this.adjustWeights(ctx);
    }

    // ─── Feature Weight Adjustment ──────────────────────────────

    private adjustWeights(ctx: LearningContext): void {
        const LEARNING_RATE = 0.05;
        const now = new Date().toISOString();

        for (const [feature, value] of Object.entries(ctx.features)) {
            if (value === 0) continue;

            const existing = this.db.prepare(
                'SELECT * FROM feature_weights WHERE feature = ?',
            ).get(feature) as any;

            if (!existing) continue;

            // Positive outcome (confirmed exploit) → boost weight
            // Negative outcome (denied) → reduce weight slightly
            const direction = ctx.wasConfirmed ? 1 : -0.3;
            const adjustmentMagnitude = LEARNING_RATE * direction * Math.min(value, 1);

            // Apply diminishing adjustments (more updates → smaller changes)
            const dampening = 1 / (1 + existing.update_count * 0.01);
            const adjustment = adjustmentMagnitude * dampening;

            const newWeight = Math.max(0.1, Math.min(50, existing.weight + adjustment));

            this.db.prepare(`
                UPDATE feature_weights
                SET weight = ?, update_count = update_count + 1,
                    last_adjustment = ?, last_updated = ?
                WHERE feature = ?
            `).run(newWeight, adjustment, now, feature);
        }
    }

    // ─── Querying Learned Knowledge ─────────────────────────────

    /**
     * Get pattern confidence for a specific vulnerability category.
     * Returns null if we have no data on this category.
     */
    getPatternConfidence(category: string, contractType?: string): VulnPattern | null {
        const query = contractType
            ? this.db.prepare('SELECT * FROM vulnerability_patterns WHERE category = ? AND contract_type = ?')
            : this.db.prepare('SELECT * FROM vulnerability_patterns WHERE category = ?');

        const row = (contractType ? query.get(category, contractType) : query.get(category)) as any;
        if (!row) return null;

        return {
            category: row.category,
            contractType: row.contract_type,
            totalPredictions: row.total_predictions,
            confirmed: row.confirmed,
            denied: row.denied,
            avgSeverityPredicted: row.avg_severity_predicted,
            avgSeverityConfirmed: row.avg_severity_confirmed,
            confidence: row.confidence,
            lastUpdated: row.last_updated,
        };
    }

    /**
     * Get all patterns sorted by confidence (most reliable first).
     */
    getTopPatterns(limit: number = 20): VulnPattern[] {
        return (this.db.prepare(`
            SELECT * FROM vulnerability_patterns
            WHERE total_predictions >= 3
            ORDER BY confidence DESC
            LIMIT ?
        `).all(limit) as any[]).map(row => ({
            category: row.category,
            contractType: row.contract_type,
            totalPredictions: row.total_predictions,
            confirmed: row.confirmed,
            denied: row.denied,
            avgSeverityPredicted: row.avg_severity_predicted,
            avgSeverityConfirmed: row.avg_severity_confirmed,
            confidence: row.confidence,
            lastUpdated: row.last_updated,
        }));
    }

    /**
     * Get current feature weights for triage scoring.
     */
    getFeatureWeights(): Record<string, number> {
        const rows = this.db.prepare('SELECT feature, weight FROM feature_weights').all() as any[];
        const weights: Record<string, number> = {};
        for (const row of rows) {
            weights[row.feature] = row.weight;
        }
        return weights;
    }

    /**
     * Get severity miscalibration data — cases where AI prediction didn't match reality.
     * Used to augment AI prompts with "you were wrong about X because Y" feedback.
     */
    getMiscalibrations(category: string, limit: number = 5): SeverityCalibration[] {
        return (this.db.prepare(`
            SELECT * FROM severity_calibration
            WHERE category = ? AND actual_severity = 'denied'
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(category, limit) as any[]).map(row => ({
            id: row.id,
            category: row.category,
            predictedSeverity: row.predicted_severity,
            actualSeverity: row.actual_severity,
            contractAddress: row.contract_address,
            chain: row.chain,
            reason: row.reason,
            timestamp: row.timestamp,
        }));
    }

    /**
     * Get calibration context for AI prompts — tells the AI where it was wrong before.
     */
    getCalibrationContext(category: string): string {
        const miscal = this.getMiscalibrations(category, 3);
        if (miscal.length === 0) return '';

        const lines = miscal.map(m =>
            `- You rated a ${m.category} finding as ${m.predictedSeverity} ` +
            `for ${m.contractAddress.substring(0, 12)}... but it was NOT exploitable. ` +
            `Reason: ${m.reason || 'simulation failed'}`,
        );

        return `\n⚠ CALIBRATION FEEDBACK (learn from past errors):\n${lines.join('\n')}\n`;
    }

    // ─── Cross-Contract Pattern Matching ────────────────────────

    /**
     * Record a bytecode pattern associated with vulnerabilities.
     */
    recordBytecodePattern(
        bytecodeHash: string,
        patternSignature: string,
        contractAddress: string,
        chain: string,
        vulnerableCategories: string[],
        riskScore: number,
    ): void {
        this.db.prepare(`
            INSERT INTO bytecode_patterns
            (bytecode_hash, pattern_signature, contract_address, chain, vulnerability_categories, risk_score, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            bytecodeHash,
            patternSignature,
            contractAddress,
            chain,
            JSON.stringify(vulnerableCategories),
            riskScore,
            new Date().toISOString(),
        );
    }

    /**
     * Check if a bytecode hash matches known vulnerable patterns.
     */
    checkBytecodeMatch(bytecodeHash: string): PatternMatch[] {
        const rows = this.db.prepare(`
            SELECT * FROM bytecode_patterns WHERE bytecode_hash = ?
        `).all(bytecodeHash) as any[];

        return rows.map(row => {
            const categories = JSON.parse(row.vulnerability_categories);
            return {
                category: categories.join(', '),
                confidence: 0.9,    // Same bytecode = very high confidence
                avgSeverity: row.risk_score / 25, // Normalize to 0-4 scale
                suggestion: `This bytecode was previously found vulnerable (${categories.join(', ')}) at ${row.contract_address} on ${row.chain}`,
            };
        });
    }

    /**
     * Get the optimized triage score for a contract based on learned weights.
     */
    calculateTriageScore(features: Record<string, number>): number {
        const weights = this.getFeatureWeights();
        let score = 0;
        let totalWeight = 0;

        for (const [feature, value] of Object.entries(features)) {
            const weight = weights[feature] || 1;
            score += value * weight;
            totalWeight += weight;
        }

        // Normalize to 0-100
        return totalWeight > 0 ? Math.min(100, Math.max(0, (score / totalWeight) * 100)) : 50;
    }

    // ─── Statistics ─────────────────────────────────────────────

    getStats(): {
        totalPredictions: number;
        totalConfirmed: number;
        totalDenied: number;
        overallAccuracy: number;
        topCategories: VulnPattern[];
        featureWeights: Record<string, number>;
    } {
        const totals = this.db.prepare(`
            SELECT
                COALESCE(SUM(total_predictions), 0) as total_p,
                COALESCE(SUM(confirmed), 0) as total_c,
                COALESCE(SUM(denied), 0) as total_d
            FROM vulnerability_patterns
        `).get() as any;

        return {
            totalPredictions: totals.total_p,
            totalConfirmed: totals.total_c,
            totalDenied: totals.total_d,
            overallAccuracy: totals.total_p > 0 ? totals.total_c / totals.total_p : 0,
            topCategories: this.getTopPatterns(10),
            featureWeights: this.getFeatureWeights(),
        };
    }

    close(): void {
        this.db.close();
    }
}

// ─── Helpers ────────────────────────────────────────────────────────

function severityToNum(severity: string): number {
    switch (severity.toUpperCase()) {
        case 'CRITICAL': return 4;
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        case 'INFO': return 0;
        default: return 1;
    }
}
