/**
 * Stage 4: Attack Strategy Builder
 * Deduplicates, ranks, and organizes findings into actionable attack strategies.
 */

import { AIFinding, AnalysisPassResult } from './ai-analysis';
import { StaticFinding } from './static-analysis';

// ─── Strategy Data Structures ───────────────────────────────────────

export interface AttackStrategy {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    score: number;                 // 0-100 composite score
    category: string;
    steps: string[];               // Ordered attack steps
    affectedFunctions: string[];
    exploitCode: string;           // Best exploit code for this strategy
    prerequisites: string[];
    profitPotential: string;
    sources: string[];             // Which analysis passes contributed
    relatedFindings: string[];     // Finding titles that fed into this
}

export interface StrategyReport {
    strategies: AttackStrategy[];
    totalFindings: number;
    deduplicatedCount: number;
    topThreat: string;
}

// ─── Build Strategies ───────────────────────────────────────────────

export function buildStrategies(
    aiResults: AnalysisPassResult[],
    staticFindings: StaticFinding[],
): StrategyReport {
    // Flatten all AI findings
    const allAIFindings: AIFinding[] = [];
    for (const result of aiResults) {
        allAIFindings.push(...result.findings);
    }

    const totalFindings = allAIFindings.length + staticFindings.length;

    // Step 1: Deduplicate similar findings
    const deduped = deduplicateFindings(allAIFindings);

    // Step 2: Merge with static findings to boost confidence
    const merged = mergeWithStatic(deduped, staticFindings);

    // Step 3: Score and rank
    const scored = merged.map(scoreStrategy);
    scored.sort((a, b) => b.score - a.score);

    // Step 4: Assign IDs
    scored.forEach((s, i) => { s.id = `ATK-${String(i + 1).padStart(3, '0')}`; });

    return {
        strategies: scored,
        totalFindings,
        deduplicatedCount: scored.length,
        topThreat: scored.length > 0 ? scored[0].title : 'None identified',
    };
}

// ─── Deduplication ──────────────────────────────────────────────────

function deduplicateFindings(findings: AIFinding[]): AIFinding[] {
    if (findings.length === 0) return [];

    const groups: Map<string, AIFinding[]> = new Map();

    for (const finding of findings) {
        // Generate a dedup key based on category + affected function + rough description
        const key = dedupKey(finding);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(finding);
    }

    // Pick the best finding from each group (prefer the one with exploit code)
    const deduped: AIFinding[] = [];
    for (const [, group] of groups) {
        // Sort: prefer CRITICAL > HIGH > MEDIUM, then prefer longer exploit code
        group.sort((a, b) => {
            const sevOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
            const sevDiff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
            if (sevDiff !== 0) return sevDiff;
            return (b.exploitCode?.length || 0) - (a.exploitCode?.length || 0);
        });

        const best = group[0];
        // Enrich the best finding with info from duplicates
        best.prerequisites = [...new Set(group.flatMap(f => f.prerequisites || []))];
        deduped.push(best);
    }

    return deduped;
}

function dedupKey(finding: AIFinding): string {
    const cat = finding.category.toLowerCase();
    const fn = (finding.affectedFunction || 'unknown').toLowerCase();

    // Normalize common variations
    const titleWords = finding.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .sort()
        .slice(0, 4)
        .join('_');

    return `${cat}:${fn}:${titleWords}`;
}

// ─── Merge with Static Findings ─────────────────────────────────────

function mergeWithStatic(
    aiFindings: AIFinding[],
    staticFindings: StaticFinding[],
): AttackStrategy[] {
    const strategies: AttackStrategy[] = [];

    // Convert AI findings to strategies
    for (const ai of aiFindings) {
        const matchingStatic = staticFindings.filter(sf =>
            sf.category === ai.category ||
            (sf.function === ai.affectedFunction && sf.category.includes(ai.category))
        );

        strategies.push({
            id: '', // assigned later
            title: ai.title,
            severity: ai.severity,
            score: 0, // calculated later
            category: ai.category,
            steps: ai.exploitScenario ? ai.exploitScenario.split(/\d+\.?\s*/).filter(Boolean) : [],
            affectedFunctions: [ai.affectedFunction],
            exploitCode: ai.exploitCode || '',
            prerequisites: ai.prerequisites || [],
            profitPotential: ai.profitPotential || 'Unknown',
            sources: [ai.pass, ...matchingStatic.map(sf => `static:${sf.pattern}`)],
            relatedFindings: [ai.title, ...matchingStatic.map(sf => sf.title)],
        });
    }

    // Add static findings that aren't covered by AI results
    for (const sf of staticFindings) {
        const covered = strategies.some(s =>
            s.relatedFindings.some(rf => rf === sf.title) ||
            (s.category === sf.category && s.affectedFunctions.includes(sf.function))
        );

        if (!covered) {
            strategies.push({
                id: '',
                title: sf.title,
                severity: sf.severity === 'MEDIUM' ? 'MEDIUM' : sf.severity as any,
                score: 0,
                category: sf.category,
                steps: [sf.description],
                affectedFunctions: [sf.function],
                exploitCode: '', // Static findings don't have exploit code
                prerequisites: [],
                profitPotential: 'Depends on contract balance',
                sources: [`static:${sf.pattern}`],
                relatedFindings: [sf.title],
            });
        }
    }

    return strategies;
}

// ─── Scoring ────────────────────────────────────────────────────────

function scoreStrategy(strategy: AttackStrategy): AttackStrategy {
    let score = 0;

    // Severity base score (0-40)
    const sevScores = { CRITICAL: 40, HIGH: 25, MEDIUM: 10 };
    score += sevScores[strategy.severity] || 0;

    // Has exploit code (0-25)
    if (strategy.exploitCode && strategy.exploitCode.length > 50) {
        score += 25;
    } else if (strategy.exploitCode && strategy.exploitCode.length > 0) {
        score += 10;
    }

    // Confirmed by multiple sources (0-15)
    const uniqueSources = new Set(strategy.sources);
    score += Math.min(uniqueSources.size * 5, 15);

    // Has clear attack steps (0-10)
    if (strategy.steps.length >= 3) score += 10;
    else if (strategy.steps.length >= 1) score += 5;

    // Profit potential mentioned (0-10)
    if (strategy.profitPotential && !strategy.profitPotential.includes('Unknown')) {
        score += 10;
    }

    strategy.score = Math.min(score, 100);
    return strategy;
}

/**
 * Format strategies into a summary string.
 */
export function formatStrategySummary(report: StrategyReport): string {
    let summary = `=== ATTACK STRATEGIES: ${report.strategies.length} ===\n`;
    summary += `Total raw findings: ${report.totalFindings} → Deduplicated: ${report.deduplicatedCount}\n`;
    summary += `Top threat: ${report.topThreat}\n\n`;

    for (const s of report.strategies) {
        summary += `[${s.id}] (score: ${s.score}) ${s.severity} — ${s.title}\n`;
        summary += `  Category: ${s.category} | Functions: ${s.affectedFunctions.join(', ')}\n`;
        summary += `  Profit: ${s.profitPotential}\n`;
        summary += `  Has exploit code: ${s.exploitCode.length > 50 ? 'YES' : 'NO'}\n`;
        summary += `  Sources: ${s.sources.join(', ')}\n\n`;
    }

    return summary;
}
