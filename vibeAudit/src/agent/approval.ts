import crypto from 'crypto';
import { ApprovalScope, getEngagement, setEngagementApproval } from './engagement';

export interface ApprovalGrant {
    runId: string;
    token: string;
    scopes: ApprovalScope[];
    createdAt: string;
    expiresAt: string;
    approvedBy?: string;
}

export interface ApprovalState {
    approved: boolean;
    required: boolean;
    scopes: ApprovalScope[];
    token?: string;
    expiresAt?: string;
}

class ApprovalService {
    private grants = new Map<string, ApprovalGrant>();

    grantApproval(input: {
        runId: string;
        scopes?: ApprovalScope[];
        ttlMs?: number;
        approvedBy?: string;
    }): ApprovalGrant {
        const scopes: ApprovalScope[] = input.scopes && input.scopes.length > 0 ? input.scopes : ['all'];
        const envTtl = parseInt(process.env.RUN_APPROVAL_TTL_MS || '', 10);
        const ttlMs = input.ttlMs ?? (Number.isFinite(envTtl) ? envTtl : 15 * 60 * 1000);
        const token = crypto.randomBytes(16).toString('hex');
        const createdAtMs = Date.now();

        const grant: ApprovalGrant = {
            runId: input.runId,
            token,
            scopes,
            createdAt: new Date(createdAtMs).toISOString(),
            expiresAt: new Date(createdAtMs + ttlMs).toISOString(),
            approvedBy: input.approvedBy,
        };

        this.grants.set(input.runId, grant);

        setEngagementApproval(input.runId, {
            required: true,
            approved: true,
            token,
            scopes,
            approvedAt: grant.createdAt,
            expiresAt: grant.expiresAt,
        });

        return grant;
    }

    revokeApproval(runId: string): void {
        this.grants.delete(runId);
        setEngagementApproval(runId, {
            approved: false,
            token: undefined,
            scopes: [],
            approvedAt: undefined,
            expiresAt: undefined,
        });
    }

    getState(runId: string): ApprovalState {
        const ctx = getEngagement(runId);
        const grant = this.grants.get(runId);
        const now = Date.now();

        if (!ctx) {
            return { approved: false, required: true, scopes: [] };
        }

        if (!grant) {
            return {
                approved: false,
                required: ctx.approval.required,
                scopes: ctx.approval.scopes,
            };
        }

        const expiresAtMs = new Date(grant.expiresAt).getTime();
        if (Number.isNaN(expiresAtMs) || expiresAtMs <= now) {
            this.revokeApproval(runId);
            return {
                approved: false,
                required: ctx.approval.required,
                scopes: [],
            };
        }

        return {
            approved: true,
            required: ctx.approval.required,
            scopes: grant.scopes,
            token: grant.token,
            expiresAt: grant.expiresAt,
        };
    }

    isScopeApproved(runId: string, scope: ApprovalScope): { ok: boolean; reason?: string } {
        const state = this.getState(runId);
        if (!state.required) return { ok: true };
        if (!state.approved) return { ok: false, reason: `Approval required for run ${runId}.` };

        if (state.scopes.includes('all') || state.scopes.includes(scope)) {
            return { ok: true };
        }

        return {
            ok: false,
            reason: `Approval token is valid but scope "${scope}" is not granted for run ${runId}.`,
        };
    }
}

export const approvalService = new ApprovalService();

export function requireApproval(runId: string, scope: ApprovalScope): { ok: boolean; error?: string } {
    const check = approvalService.isScopeApproved(runId, scope);
    if (!check.ok) {
        return { ok: false, error: check.reason || 'Execution approval is required.' };
    }
    return { ok: true };
}
