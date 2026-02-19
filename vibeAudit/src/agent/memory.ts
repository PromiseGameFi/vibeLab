/**
 * Agent Memory — Persistent SQLite store
 * Remembers every contract analyzed, what worked, what failed.
 * The agent gets smarter over time.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── Types ──────────────────────────────────────────────────────────

export interface ContractRecord {
    address: string;
    chain: string;
    bytecodeHash: string;
    name?: string;
    source?: string;
    balance: string;
    firstSeen: string;
    lastAnalyzed?: string;
    totalFindings: number;
    confirmedExploits: number;
    status: 'queued' | 'triaged' | 'analyzing' | 'completed' | 'skipped';
}

export interface FindingRecord {
    id: string;
    contractAddress: string;
    chain: string;
    category: string;
    severity: string;
    title: string;
    score: number;
    exploitPassed: boolean;
    exploitCode?: string;
    attempts: number;
    timestamp: string;
}

export interface PatternStat {
    category: string;
    totalFound: number;
    totalConfirmed: number;
    successRate: number;
}

export interface AgentStats {
    totalContracts: number;
    totalAnalyzed: number;
    totalFindings: number;
    totalConfirmed: number;
    successRate: number;
    topCategories: PatternStat[];
    uptimeStart: string;
}

// ─── Memory Class ───────────────────────────────────────────────────

export class AgentMemory {
    private db: Database.Database;

    constructor(dbPath?: string) {
        const dir = path.join(process.cwd(), '.vibeaudit-agent');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const fullPath = dbPath || path.join(dir, 'memory.db');
        this.db = new Database(fullPath);
        this.db.pragma('journal_mode = WAL');
        this.init();
    }

    private init() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS contracts (
                address TEXT NOT NULL,
                chain TEXT NOT NULL,
                bytecode_hash TEXT NOT NULL,
                name TEXT,
                source TEXT,
                balance TEXT DEFAULT '0',
                first_seen TEXT NOT NULL,
                last_analyzed TEXT,
                total_findings INTEGER DEFAULT 0,
                confirmed_exploits INTEGER DEFAULT 0,
                status TEXT DEFAULT 'queued',
                PRIMARY KEY (address, chain)
            );

            CREATE TABLE IF NOT EXISTS findings (
                id TEXT PRIMARY KEY,
                contract_address TEXT NOT NULL,
                chain TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                exploit_passed INTEGER DEFAULT 0,
                exploit_code TEXT,
                attempts INTEGER DEFAULT 0,
                timestamp TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS agent_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                data TEXT
            );

            CREATE TABLE IF NOT EXISTS analysis_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_address TEXT NOT NULL,
                chain TEXT NOT NULL,
                contract_name TEXT,
                risk_score INTEGER DEFAULT 0,
                report_json TEXT NOT NULL,
                report_markdown TEXT NOT NULL,
                timestamp TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_findings_contract ON findings(contract_address, chain);
            CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
            CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
            CREATE INDEX IF NOT EXISTS idx_contracts_bytecode ON contracts(bytecode_hash);
            CREATE INDEX IF NOT EXISTS idx_reports_address ON analysis_reports(contract_address, chain);
            CREATE INDEX IF NOT EXISTS idx_reports_score ON analysis_reports(risk_score DESC);
        `);
    }

    // ─── Contract Operations ────────────────────────────────────

    hasContract(address: string, chain: string): boolean {
        const row = this.db.prepare(
            'SELECT 1 FROM contracts WHERE address = ? AND chain = ?'
        ).get(address, chain);
        return !!row;
    }

    hasBytecode(bytecodeHash: string): boolean {
        const row = this.db.prepare(
            'SELECT 1 FROM contracts WHERE bytecode_hash = ?'
        ).get(bytecodeHash);
        return !!row;
    }

    addContract(record: ContractRecord): void {
        this.db.prepare(`
            INSERT OR REPLACE INTO contracts
            (address, chain, bytecode_hash, name, source, balance, first_seen, last_analyzed,
             total_findings, confirmed_exploits, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            record.address, record.chain, record.bytecodeHash,
            record.name || null, record.source || null,
            record.balance, record.firstSeen, record.lastAnalyzed || null,
            record.totalFindings, record.confirmedExploits, record.status,
        );
    }

    updateContractStatus(address: string, chain: string, status: string): void {
        this.db.prepare(
            'UPDATE contracts SET status = ?, last_analyzed = ? WHERE address = ? AND chain = ?'
        ).run(status, new Date().toISOString(), address, chain);
    }

    updateContractResults(address: string, chain: string, findings: number, confirmed: number): void {
        this.db.prepare(`
            UPDATE contracts SET
                total_findings = ?, confirmed_exploits = ?,
                status = 'completed', last_analyzed = ?
            WHERE address = ? AND chain = ?
        `).run(findings, confirmed, new Date().toISOString(), address, chain);
    }

    getContract(address: string, chain: string): ContractRecord | null {
        const row = this.db.prepare(
            'SELECT * FROM contracts WHERE address = ? AND chain = ?'
        ).get(address, chain) as any;
        if (!row) return null;
        return {
            address: row.address,
            chain: row.chain,
            bytecodeHash: row.bytecode_hash,
            name: row.name,
            source: row.source,
            balance: row.balance,
            firstSeen: row.first_seen,
            lastAnalyzed: row.last_analyzed,
            totalFindings: row.total_findings,
            confirmedExploits: row.confirmed_exploits,
            status: row.status,
        };
    }

    // ─── Findings Operations ────────────────────────────────────

    addFinding(finding: FindingRecord): void {
        this.db.prepare(`
            INSERT OR REPLACE INTO findings
            (id, contract_address, chain, category, severity, title, score,
             exploit_passed, exploit_code, attempts, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            finding.id, finding.contractAddress, finding.chain,
            finding.category, finding.severity, finding.title, finding.score,
            finding.exploitPassed ? 1 : 0, finding.exploitCode || null,
            finding.attempts, finding.timestamp,
        );
    }

    getConfirmedFindings(limit: number = 50): FindingRecord[] {
        const rows = this.db.prepare(
            'SELECT * FROM findings WHERE exploit_passed = 1 ORDER BY timestamp DESC LIMIT ?'
        ).all(limit) as any[];
        return rows.map(mapFinding);
    }

    // ─── Pattern Learning ───────────────────────────────────────

    getPatternStats(): PatternStat[] {
        const rows = this.db.prepare(`
            SELECT
                category,
                COUNT(*) as total_found,
                SUM(CASE WHEN exploit_passed = 1 THEN 1 ELSE 0 END) as total_confirmed
            FROM findings
            GROUP BY category
            ORDER BY total_confirmed DESC
        `).all() as any[];

        return rows.map(r => ({
            category: r.category,
            totalFound: r.total_found,
            totalConfirmed: r.total_confirmed,
            successRate: r.total_found > 0 ? r.total_confirmed / r.total_found : 0,
        }));
    }

    /**
     * Get categories that historically produce confirmed exploits.
     * Used by triage to prioritize targets.
     */
    getSuccessfulCategories(): string[] {
        const rows = this.db.prepare(`
            SELECT category FROM findings
            WHERE exploit_passed = 1
            GROUP BY category
            HAVING COUNT(*) >= 1
            ORDER BY COUNT(*) DESC
        `).all() as any[];
        return rows.map(r => r.category);
    }

    // ─── Agent Logging ──────────────────────────────────────────

    log(level: 'info' | 'warn' | 'error' | 'exploit', message: string, data?: any): void {
        this.db.prepare(
            'INSERT INTO agent_log (timestamp, level, message, data) VALUES (?, ?, ?, ?)'
        ).run(new Date().toISOString(), level, message, data ? JSON.stringify(data) : null);
    }

    getRecentLogs(limit: number = 100): { timestamp: string; level: string; message: string }[] {
        return this.db.prepare(
            'SELECT timestamp, level, message FROM agent_log ORDER BY id DESC LIMIT ?'
        ).all(limit) as any[];
    }

    // ─── Aggregate Stats ────────────────────────────────────────

    getStats(): AgentStats {
        const contracts = this.db.prepare('SELECT COUNT(*) as count FROM contracts').get() as any;
        const analyzed = this.db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'completed'").get() as any;
        const findings = this.db.prepare('SELECT COUNT(*) as count FROM findings').get() as any;
        const confirmed = this.db.prepare('SELECT COUNT(*) as count FROM findings WHERE exploit_passed = 1').get() as any;
        const topCategories = this.getPatternStats();
        const firstLog = this.db.prepare('SELECT timestamp FROM agent_log ORDER BY id ASC LIMIT 1').get() as any;

        return {
            totalContracts: contracts.count,
            totalAnalyzed: analyzed.count,
            totalFindings: findings.count,
            totalConfirmed: confirmed.count,
            successRate: findings.count > 0 ? confirmed.count / findings.count : 0,
            topCategories,
            uptimeStart: firstLog?.timestamp || new Date().toISOString(),
        };
    }

    // ─── Analysis Reports ────────────────────────────────────────

    addReport(address: string, chain: string, contractName: string, riskScore: number, reportJson: string, reportMarkdown: string): void {
        this.db.prepare(`
            INSERT INTO analysis_reports
            (contract_address, chain, contract_name, risk_score, report_json, report_markdown, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(address, chain, contractName, riskScore, reportJson, reportMarkdown, new Date().toISOString());
    }

    getReport(address: string, chain: string): { riskScore: number; markdown: string; timestamp: string } | null {
        const row = this.db.prepare(
            'SELECT risk_score, report_markdown, timestamp FROM analysis_reports WHERE contract_address = ? AND chain = ? ORDER BY id DESC LIMIT 1'
        ).get(address, chain) as any;
        if (!row) return null;
        return { riskScore: row.risk_score, markdown: row.report_markdown, timestamp: row.timestamp };
    }

    getTopRisks(limit: number = 20): { address: string; chain: string; name: string; riskScore: number; timestamp: string }[] {
        const rows = this.db.prepare(
            'SELECT contract_address, chain, contract_name, risk_score, timestamp FROM analysis_reports ORDER BY risk_score DESC LIMIT ?'
        ).all(limit) as any[];
        return rows.map(r => ({
            address: r.contract_address,
            chain: r.chain,
            name: r.contract_name || 'Unknown',
            riskScore: r.risk_score,
            timestamp: r.timestamp,
        }));
    }

    getRecentReports(limit: number = 20): { address: string; chain: string; name: string; riskScore: number; timestamp: string }[] {
        const rows = this.db.prepare(
            'SELECT contract_address, chain, contract_name, risk_score, timestamp FROM analysis_reports ORDER BY id DESC LIMIT ?'
        ).all(limit) as any[];
        return rows.map(r => ({
            address: r.contract_address,
            chain: r.chain,
            name: r.contract_name || 'Unknown',
            riskScore: r.risk_score,
            timestamp: r.timestamp,
        }));
    }

    close(): void {
        this.db.close();
    }
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapFinding(row: any): FindingRecord {
    return {
        id: row.id,
        contractAddress: row.contract_address,
        chain: row.chain,
        category: row.category,
        severity: row.severity,
        title: row.title,
        score: row.score,
        exploitPassed: !!row.exploit_passed,
        exploitCode: row.exploit_code,
        attempts: row.attempts,
        timestamp: row.timestamp,
    };
}
