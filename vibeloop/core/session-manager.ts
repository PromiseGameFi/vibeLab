// Session Manager - Preserves context across loop iterations

import * as fs from 'fs';
import * as path from 'path';
import { Session } from './types';

export interface SessionManagerConfig {
    sessionFile: string;        // Path to session file
    historyFile: string;        // Path to history file
    expirationHours: number;    // Session expiration time
    maxHistoryEntries: number;  // Max history entries to keep
}

const DEFAULT_CONFIG: SessionManagerConfig = {
    sessionFile: '.vibeloop_session',
    historyFile: '.vibeloop_history',
    expirationHours: 24,
    maxHistoryEntries: 50,
};

export class SessionManager {
    private config: SessionManagerConfig;
    private projectRoot: string;
    private currentSession: Session | null = null;

    constructor(projectRoot: string, config: Partial<SessionManagerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.projectRoot = projectRoot;
    }

    /**
     * Get or create a session
     */
    async getSession(): Promise<Session> {
        if (this.currentSession && !this.isExpired(this.currentSession)) {
            return this.currentSession;
        }

        // Try to load from file
        const loaded = await this.load();
        if (loaded && !this.isExpired(loaded)) {
            this.currentSession = loaded;
            return loaded;
        }

        // Create new session
        const session = this.create();
        await this.save(session);
        this.currentSession = session;
        return session;
    }

    /**
     * Update session context and iteration
     */
    async update(context: string, iteration: number): Promise<void> {
        const session = await this.getSession();
        session.context = context;
        session.iteration = iteration;
        session.lastUpdated = new Date();
        await this.save(session);
        await this.appendHistory(`Updated: iteration ${iteration}`);
    }

    /**
     * Reset session (e.g., after circuit breaker opens)
     */
    async reset(reason: string): Promise<Session> {
        await this.appendHistory(`Reset: ${reason}`);
        const session = this.create();
        await this.save(session);
        this.currentSession = session;
        return session;
    }

    /**
     * Get session context for AI prompt
     */
    async getContext(): Promise<string> {
        const session = await this.getSession();
        if (!session.context) {
            return '';
        }
        return `\n\n--- Previous Session Context (Iteration ${session.iteration}) ---\n${session.context}\n---\n`;
    }

    private create(): Session {
        return {
            id: this.generateId(),
            createdAt: new Date(),
            lastUpdated: new Date(),
            context: '',
            iteration: 0,
            expiresAt: new Date(Date.now() + this.config.expirationHours * 60 * 60 * 1000),
        };
    }

    private generateId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    private isExpired(session: Session): boolean {
        return new Date() > new Date(session.expiresAt);
    }

    private getSessionPath(): string {
        return path.join(this.projectRoot, this.config.sessionFile);
    }

    private getHistoryPath(): string {
        return path.join(this.projectRoot, this.config.historyFile);
    }

    private async load(): Promise<Session | null> {
        try {
            const sessionPath = this.getSessionPath();
            if (!fs.existsSync(sessionPath)) {
                return null;
            }
            const data = fs.readFileSync(sessionPath, 'utf-8');
            const session = JSON.parse(data) as Session;
            // Convert date strings back to Date objects
            session.createdAt = new Date(session.createdAt);
            session.lastUpdated = new Date(session.lastUpdated);
            session.expiresAt = new Date(session.expiresAt);
            return session;
        } catch {
            return null;
        }
    }

    private async save(session: Session): Promise<void> {
        const sessionPath = this.getSessionPath();
        fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    }

    private async appendHistory(entry: string): Promise<void> {
        const historyPath = this.getHistoryPath();
        const timestamp = new Date().toISOString();
        const line = `${timestamp} | ${entry}\n`;

        try {
            // Read existing history
            let history = '';
            if (fs.existsSync(historyPath)) {
                history = fs.readFileSync(historyPath, 'utf-8');
            }

            // Append and trim
            history += line;
            const lines = history.split('\n').filter(l => l.trim());
            if (lines.length > this.config.maxHistoryEntries) {
                history = lines.slice(-this.config.maxHistoryEntries).join('\n') + '\n';
            }

            fs.writeFileSync(historyPath, history);
        } catch {
            // Ignore history errors
        }
    }
}
