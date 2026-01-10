// Security Scanner Types and Rules
export interface ScanResult {
    id: string;
    scanner: 'vibelab-patterns' | 'osv-api';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    file?: string;
    line?: number;
    code?: string;
    fix?: string;
    cwe?: string;
    owasp?: string;
    fixPrompt?: string;
    category?: string;
    package?: string;
    version?: string;
    fixedVersion?: string;
    cve?: string;
}

export interface ScanSummary {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    scanners: {
        'vibelab-patterns': number;
        'osv-api': number;
    };
}

export interface ScanJob {
    id: string;
    repoUrl: string;
    status: 'pending' | 'cloning' | 'scanning' | 'analyzing' | 'complete' | 'error';
    progress: number;
    startedAt: string;
    completedAt?: string;
    results: ScanResult[];
    summary: ScanSummary;
    error?: string;
}

// Severity colors and icons
export const severityConfig = {
    critical: { color: 'bg-red-500', text: 'text-red-500', label: 'Critical', icon: '' },
    high: { color: 'bg-orange-500', text: 'text-orange-500', label: 'High', icon: '' },
    medium: { color: 'bg-yellow-500', text: 'text-yellow-500', label: 'Medium', icon: '' },
    low: { color: 'bg-blue-500', text: 'text-blue-500', label: 'Low', icon: '' },
    info: { color: 'bg-gray-500', text: 'text-gray-500', label: 'Info', icon: '' },
};

// Scanner descriptions
export const scannerInfo = {
    'vibelab-patterns': {
        name: 'VibeLab Patterns',
        description: '100+ Security Patterns (Secrets, SQLi, XSS, etc.)',
        icon: '',
    },
    'osv-api': {
        name: 'OSV API',
        description: 'Open Source Vulnerabilities (40,000+ CVEs)',
        icon: '',
    },
};

// Generate AI fix prompt for a finding
export function generateFixPrompt(result: ScanResult): string {
    return `## Security Vulnerability Fix Request

**Issue:** ${result.title}
**Severity:** ${result.severity.toUpperCase()}
**Scanner:** ${result.scanner}
${result.file ? `**File:** ${result.file}${result.line ? `:${result.line}` : ''}` : ''}
${result.cwe ? `**CWE:** ${result.cwe}` : ''}
${result.owasp ? `**OWASP:** ${result.owasp}` : ''}

**Description:**
${result.description}

${result.code ? `**Vulnerable Code:**
\`\`\`
${result.code}
\`\`\`
` : ''}

**Instructions:**
1. Analyze the vulnerability and understand the security risk
2. Provide a secure fix that addresses the root cause
3. Explain why the fix is secure
4. Include any necessary imports or dependencies
5. Follow secure coding best practices

Please provide the fixed code with explanation.`;
}

// Generate master fix prompt for all findings
export function generateMasterPrompt(results: ScanResult[], repoName: string): string {
    const grouped = results.reduce((acc, r) => {
        acc[r.severity] = acc[r.severity] || [];
        acc[r.severity].push(r);
        return acc;
    }, {} as Record<string, ScanResult[]>);

    let prompt = `# Security Scan Report - ${repoName}

## Summary
- **Critical:** ${grouped.critical?.length || 0}
- **High:** ${grouped.high?.length || 0}
- **Medium:** ${grouped.medium?.length || 0}
- **Low:** ${grouped.low?.length || 0}

## Findings

`;

    const order = ['critical', 'high', 'medium', 'low'];
    order.forEach(severity => {
        const items = grouped[severity];
        if (items?.length) {
            prompt += `### ${severity.toUpperCase()} (${items.length})\n\n`;
            items.forEach((r, i) => {
                prompt += `${i + 1}. **${r.title}**\n`;
                prompt += `   - File: ${r.file || 'N/A'}${r.line ? `:${r.line}` : ''}\n`;
                prompt += `   - ${r.description.slice(0, 200)}...\n\n`;
            });
        }
    });

    prompt += `## Instructions

Please fix these security vulnerabilities in priority order (Critical → High → Medium → Low).

For each fix:
1. Show the original vulnerable code
2. Provide the secure replacement
3. Explain the security improvement
4. Note any breaking changes

Focus on secure coding practices and maintaining functionality.`;

    return prompt;
}

// Estimate fix cost based on results
export function estimateFixCost(results: ScanResult[]): {
    tokens: number;
    cost: string;
    time: string;
} {
    // Rough estimates
    const tokensPerIssue = {
        critical: 2000,
        high: 1500,
        medium: 1000,
        low: 500,
        info: 200,
    };

    const totalTokens = results.reduce((sum, r) => sum + tokensPerIssue[r.severity], 0);
    const costUsd = (totalTokens / 1000000) * 0.15; // Rough GPT-4 cost
    const minutes = Math.ceil(results.length * 0.5);

    return {
        tokens: totalTokens,
        cost: `$${costUsd.toFixed(2)}`,
        time: `~${minutes} min`,
    };
}
