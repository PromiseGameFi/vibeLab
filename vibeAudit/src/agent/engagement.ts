import crypto from 'crypto';

export type EngagementMode = 'recon' | 'validate' | 'exploit';
export type TargetType = 'contract' | 'project';

export type ApprovalScope = 'execute_exploit' | 'fuzz_campaign' | 'chain_simulation' | 'all';

export interface AttackTreeNode {
    id: string;
    label: string;
    type: 'root' | 'vector' | 'action' | 'finding';
    status: 'pending' | 'active' | 'complete' | 'failed';
    metadata?: Record<string, unknown>;
}

export interface AttackTreeEdge {
    from: string;
    to: string;
    label?: string;
}

export interface AttackTree {
    nodes: AttackTreeNode[];
    edges: AttackTreeEdge[];
}

export interface ApprovalSnapshot {
    required: boolean;
    approved: boolean;
    scopes: ApprovalScope[];
    token?: string;
    expiresAt?: string;
    approvedAt?: string;
}

export interface EngagementContext {
    runId: string;
    target: string;
    targetType: TargetType;
    chain: string;
    rpcUrl?: string;
    mode: EngagementMode;
    createdAt: string;
    updatedAt: string;
    approval: ApprovalSnapshot;
    attackTree: AttackTree;
    reactStatus?: 'exploited' | 'secure' | 'timeout' | 'error';
    reactDetails?: string;
    project?: {
        path: string;
        projectType?: string;
        fileCount?: number;
    };
    operatorNotes: string[];
    evidence: unknown[];
}

const engagements = new Map<string, EngagementContext>();

function nowIso(): string {
    return new Date().toISOString();
}

function defaultAttackTree(target: string): AttackTree {
    return {
        nodes: [{
            id: 'root',
            label: target,
            type: 'root',
            status: 'active',
        }],
        edges: [],
    };
}

export function createEngagement(input: {
    runId?: string;
    target: string;
    targetType: TargetType;
    chain: string;
    rpcUrl?: string;
    mode: EngagementMode;
    approvalRequired?: boolean;
    project?: EngagementContext['project'];
}): EngagementContext {
    const createdAt = nowIso();
    const runId = input.runId || crypto.randomUUID();

    const ctx: EngagementContext = {
        runId,
        target: input.target,
        targetType: input.targetType,
        chain: input.chain,
        rpcUrl: input.rpcUrl,
        mode: input.mode,
        createdAt,
        updatedAt: createdAt,
        approval: {
            required: input.approvalRequired !== false,
            approved: false,
            scopes: [],
        },
        attackTree: defaultAttackTree(input.target),
        project: input.project,
        operatorNotes: [],
        evidence: [],
    };

    engagements.set(runId, ctx);
    return ctx;
}

export function getEngagement(runId: string): EngagementContext | undefined {
    return engagements.get(runId);
}

export function updateEngagement(runId: string, patch: Partial<EngagementContext>): EngagementContext | undefined {
    const existing = engagements.get(runId);
    if (!existing) return undefined;

    const updated: EngagementContext = {
        ...existing,
        ...patch,
        approval: patch.approval ? { ...existing.approval, ...patch.approval } : existing.approval,
        attackTree: patch.attackTree || existing.attackTree,
        operatorNotes: patch.operatorNotes || existing.operatorNotes,
        evidence: patch.evidence || existing.evidence,
        updatedAt: nowIso(),
    };

    engagements.set(runId, updated);
    return updated;
}

export function setEngagementApproval(runId: string, approval: Partial<ApprovalSnapshot>): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;

    ctx.approval = { ...ctx.approval, ...approval };
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return ctx;
}

export function setAttackTree(runId: string, tree: AttackTree): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;
    ctx.attackTree = tree;
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return ctx;
}

export function appendAttackTreeNode(runId: string, node: AttackTreeNode, parentId: string = 'root', edgeLabel?: string): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;

    if (!ctx.attackTree.nodes.find((n) => n.id === node.id)) {
        ctx.attackTree.nodes.push(node);
        ctx.attackTree.edges.push({ from: parentId, to: node.id, label: edgeLabel });
        ctx.updatedAt = nowIso();
        engagements.set(runId, ctx);
    }

    return ctx;
}

export function updateAttackTreeNodeStatus(
    runId: string,
    nodeId: string,
    status: AttackTreeNode['status'],
): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;

    const node = ctx.attackTree.nodes.find((n) => n.id === nodeId);
    if (!node) return ctx;

    node.status = status;
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return ctx;
}

export function pushOperatorInstruction(runId: string, message: string): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;

    ctx.operatorNotes.push(message);
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return ctx;
}

export function drainOperatorInstructions(runId: string): string[] {
    const ctx = engagements.get(runId);
    if (!ctx || ctx.operatorNotes.length === 0) return [];

    const drained = [...ctx.operatorNotes];
    ctx.operatorNotes = [];
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return drained;
}

export function appendEvidence(runId: string, item: unknown): EngagementContext | undefined {
    const ctx = engagements.get(runId);
    if (!ctx) return undefined;

    ctx.evidence.push(item);
    ctx.updatedAt = nowIso();
    engagements.set(runId, ctx);
    return ctx;
}

export function listEngagements(): EngagementContext[] {
    return Array.from(engagements.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
