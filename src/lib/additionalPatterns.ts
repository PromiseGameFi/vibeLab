// Additional Security Patterns
// Container Security, CI/CD, React/Next.js, Additional Auth patterns

export interface AdditionalPattern {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'container' | 'cicd' | 'react' | 'nextjs' | 'auth' | 'cloud';
    pattern: RegExp;
    fix: string;
    cwe?: string;
    owasp?: string;
    languages?: string[];
}

// ============================================
// CONTAINER/DOCKER SECURITY PATTERNS
// ============================================
export const containerPatterns: AdditionalPattern[] = [
    // Running as root
    {
        id: 'docker-root-user',
        name: 'Container Running as Root',
        description: 'Container runs as root user, violating least privilege principle.',
        severity: 'high',
        category: 'container',
        pattern: /^(?!.*USER\s+[^r]).*(?:FROM|ENTRYPOINT|CMD)/gmi,
        fix: 'Add USER directive with non-root user: USER node or USER 1000',
        cwe: 'CWE-250'
    },
    // Latest tag
    {
        id: 'docker-latest-tag',
        name: 'Using Latest Tag',
        description: 'Using :latest tag makes builds non-reproducible.',
        severity: 'medium',
        category: 'container',
        pattern: /FROM\s+[^\s:]+:latest/gi,
        fix: 'Pin to specific version: FROM node:18.17.0-alpine',
        cwe: 'CWE-1104'
    },
    // Secrets in Dockerfile
    {
        id: 'docker-secrets-env',
        name: 'Secrets in Dockerfile ENV',
        description: 'Secrets in ENV are visible in image history.',
        severity: 'critical',
        category: 'container',
        pattern: /ENV\s+(?:PASSWORD|SECRET|API_KEY|TOKEN|PRIVATE_KEY)\s*=/gi,
        fix: 'Use Docker secrets or build-time args with --secret flag',
        cwe: 'CWE-798'
    },
    // ADD instead of COPY
    {
        id: 'docker-add-copy',
        name: 'Using ADD Instead of COPY',
        description: 'ADD has auto-extraction which can introduce vulnerabilities.',
        severity: 'low',
        category: 'container',
        pattern: /^ADD\s+(?!https?:)/gmi,
        fix: 'Use COPY for local files, ADD only for URLs or archives',
        cwe: 'CWE-829'
    },
    // Privileged container
    {
        id: 'docker-privileged',
        name: 'Privileged Container',
        description: 'Privileged mode gives container full host access.',
        severity: 'critical',
        category: 'container',
        pattern: /privileged\s*:\s*true|--privileged/gi,
        fix: 'Remove privileged flag and use specific capabilities instead',
        cwe: 'CWE-250'
    },
    // No health check
    {
        id: 'docker-no-healthcheck',
        name: 'Missing Health Check',
        description: 'Container lacks health check for orchestration.',
        severity: 'low',
        category: 'container',
        pattern: /^FROM(?![\s\S]*HEALTHCHECK)/gm,
        fix: 'Add HEALTHCHECK instruction',
        cwe: 'CWE-693'
    },
    // Exposed ports
    {
        id: 'docker-expose-all',
        name: 'Exposing Sensitive Ports',
        description: 'Exposing database or admin ports is risky.',
        severity: 'medium',
        category: 'container',
        pattern: /EXPOSE\s+(?:22|3306|5432|27017|6379|9200)\b/gi,
        fix: 'Only expose necessary ports, use internal networking for databases',
        cwe: 'CWE-284'
    },
    // apt-get without cleanup
    {
        id: 'docker-apt-cleanup',
        name: 'Package Manager Without Cleanup',
        description: 'Installing packages without cleanup bloats image.',
        severity: 'info',
        category: 'container',
        pattern: /apt-get\s+install(?![\s\S]*apt-get\s+clean)/gm,
        fix: 'Add rm -rf /var/lib/apt/lists/* after install',
    },
];

// ============================================
// CI/CD SECURITY PATTERNS
// ============================================
export const cicdPatterns: AdditionalPattern[] = [
    // Secrets in workflow
    {
        id: 'cicd-hardcoded-secret',
        name: 'Hardcoded Secret in CI/CD',
        description: 'Secret value directly in workflow file.',
        severity: 'critical',
        category: 'cicd',
        pattern: /(?:password|token|secret|api_key)\s*:\s*['"][^$][^'"]+['"]/gi,
        fix: 'Use secrets: ${{ secrets.MY_SECRET }}',
        cwe: 'CWE-798'
    },
    // Using @master
    {
        id: 'cicd-action-master',
        name: 'GitHub Action Using @master',
        description: 'Using @master can introduce supply chain attacks.',
        severity: 'high',
        category: 'cicd',
        pattern: /uses:\s*[^@]+@(?:master|main)\b/gi,
        fix: 'Pin to specific version or SHA: uses: actions/checkout@v4',
        cwe: 'CWE-1104'
    },
    // Script injection
    {
        id: 'cicd-script-injection',
        name: 'Script Injection in Workflow',
        description: 'User input directly in run script can execute arbitrary code.',
        severity: 'critical',
        category: 'cicd',
        pattern: /run:\s*[^|]*\$\{\{\s*github\.event\.(?:issue|pull_request|comment)/gi,
        fix: 'Use an action input or environment variable instead',
        cwe: 'CWE-94'
    },
    // Overly broad permissions
    {
        id: 'cicd-write-all',
        name: 'Overly Broad Workflow Permissions',
        description: 'Workflow has write-all permissions.',
        severity: 'high',
        category: 'cicd',
        pattern: /permissions\s*:\s*write-all/gi,
        fix: 'Use least privilege: permissions: { contents: read }',
        cwe: 'CWE-269'
    },
    // Pull request target
    {
        id: 'cicd-pr-target',
        name: 'Dangerous pull_request_target',
        description: 'pull_request_target with checkout can leak secrets.',
        severity: 'high',
        category: 'cicd',
        pattern: /on:\s*\[?pull_request_target[\s\S]*checkout/gi,
        fix: 'Use pull_request event or be very careful with checkout ref',
        cwe: 'CWE-200'
    },
    // No timeout
    {
        id: 'cicd-no-timeout',
        name: 'Missing Job Timeout',
        description: 'Jobs without timeout can run indefinitely.',
        severity: 'low',
        category: 'cicd',
        pattern: /jobs:[\s\S]*?(?:runs-on:)(?![\s\S]*timeout-minutes)/gm,
        fix: 'Add timeout-minutes to prevent runaway jobs',
    },
];

// ============================================
// REACT/NEXT.JS SPECIFIC PATTERNS
// ============================================
export const reactPatterns: AdditionalPattern[] = [
    // dangerouslySetInnerHTML
    {
        id: 'react-dangerous-html',
        name: 'dangerouslySetInnerHTML Usage',
        description: 'Directly setting innerHTML can lead to XSS.',
        severity: 'high',
        category: 'react',
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{/gi,
        fix: 'Sanitize content with DOMPurify or use safe alternatives',
        cwe: 'CWE-79',
        owasp: 'A03:2021'
    },
    // Unsafe target="_blank"
    {
        id: 'react-unsafe-target-blank',
        name: 'Unsafe target="_blank"',
        description: 'Opens to tabnabbing without rel="noopener".',
        severity: 'medium',
        category: 'react',
        pattern: /target\s*=\s*["']_blank["'](?![^>]*rel\s*=\s*["'][^"']*noopener)/gi,
        fix: 'Add rel="noopener noreferrer"',
        cwe: 'CWE-1022'
    },
    // Storing sensitive data in state
    {
        id: 'react-sensitive-state',
        name: 'Sensitive Data in React State',
        description: 'Passwords/tokens in state are visible in React DevTools.',
        severity: 'medium',
        category: 'react',
        pattern: /useState\s*[<(].*(?:password|token|secret|apiKey)/gi,
        fix: 'Avoid storing sensitive data in state, use httpOnly cookies',
        cwe: 'CWE-922'
    },
    // Uncontrolled component with value
    {
        id: 'react-uncontrolled',
        name: 'Uncontrolled Input with defaultValue',
        description: 'May lead to unexpected behavior with user input.',
        severity: 'low',
        category: 'react',
        pattern: /defaultValue\s*=\s*\{[^}]*(?:params|query|user)/gi,
        fix: 'Validate and sanitize defaultValue from external sources',
        cwe: 'CWE-20'
    },
    // Client-side auth check only
    {
        id: 'react-client-auth',
        name: 'Client-Side Only Auth Check',
        description: 'Auth check only on client can be bypassed.',
        severity: 'high',
        category: 'react',
        pattern: /(?:if|&&)\s*\(\s*!?\s*(?:isAuthenticated|isLoggedIn|user)\s*\)[\s\S]*?(?:redirect|navigate|push)/gi,
        fix: 'Always verify authentication on server side',
        cwe: 'CWE-602'
    },
];

// ============================================
// NEXT.JS SPECIFIC PATTERNS
// ============================================
export const nextjsPatterns: AdditionalPattern[] = [
    // API route without auth
    {
        id: 'nextjs-api-no-auth',
        name: 'Next.js API Route Without Auth',
        description: 'API route lacks authentication check.',
        severity: 'high',
        category: 'nextjs',
        pattern: /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{(?![\s\S]{0,200}(?:getServerSession|auth|verify|token))/gi,
        fix: 'Add authentication check at the start of the handler',
        cwe: 'CWE-306',
        owasp: 'API2:2023'
    },
    // Sensitive data in getStaticProps
    {
        id: 'nextjs-static-secrets',
        name: 'Secrets in getStaticProps',
        description: 'Secrets in static props are bundled into client.',
        severity: 'critical',
        category: 'nextjs',
        pattern: /getStaticProps[\s\S]*?(?:apiKey|secret|password|token)\s*:/gi,
        fix: 'Never include secrets in getStaticProps return value',
        cwe: 'CWE-200'
    },
    // Unvalidated redirect
    {
        id: 'nextjs-open-redirect',
        name: 'Next.js Open Redirect',
        description: 'Redirect destination from user input.',
        severity: 'high',
        category: 'nextjs',
        pattern: /redirect\s*\(\s*(?:req\.query|searchParams\.get|params)/gi,
        fix: 'Validate redirect URLs against whitelist',
        cwe: 'CWE-601'
    },
    // Missing CSP headers
    {
        id: 'nextjs-no-csp',
        name: 'Missing Content Security Policy',
        description: 'No CSP headers configured in next.config.',
        severity: 'medium',
        category: 'nextjs',
        pattern: /next\.config\.[jt]s(?![\s\S]*Content-Security-Policy)/g,
        fix: 'Add CSP headers in next.config.js headers()',
        cwe: 'CWE-1021'
    },
    // CORS in API route
    {
        id: 'nextjs-api-cors-star',
        name: 'CORS Wildcard in API Route',
        description: 'API route allows all origins.',
        severity: 'high',
        category: 'nextjs',
        pattern: /Access-Control-Allow-Origin['"]\s*,\s*['"]\*/gi,
        fix: 'Specify allowed origins explicitly',
        cwe: 'CWE-942'
    },
    // Server action without validation
    {
        id: 'nextjs-action-no-validation',
        name: 'Server Action Without Input Validation',
        description: 'Server action uses input without validation.',
        severity: 'high',
        category: 'nextjs',
        pattern: /['"]use server['"][\s\S]*?formData\.get\([^)]+\)(?![\s\S]{0,50}(?:zod|yup|validate|parse))/gi,
        fix: 'Validate all formData inputs with Zod or similar',
        cwe: 'CWE-20',
        owasp: 'API8:2023'
    },
];

// ============================================
// ADDITIONAL AUTH PATTERNS
// ============================================
export const additionalAuthPatterns: AdditionalPattern[] = [
    // OAuth state missing
    {
        id: 'auth-oauth-no-state',
        name: 'OAuth Without State Parameter',
        description: 'Missing state parameter enables CSRF attacks.',
        severity: 'high',
        category: 'auth',
        pattern: /oauth.*?(?:authorize|auth)\?(?![\s\S]*state=)/gi,
        fix: 'Always include and verify state parameter in OAuth flows',
        cwe: 'CWE-352'
    },
    // Session fixation
    {
        id: 'auth-session-fixation',
        name: 'Session Fixation Risk',
        description: 'Session ID not regenerated after login.',
        severity: 'high',
        category: 'auth',
        pattern: /(?:login|authenticate)[\s\S]*?(?![\s\S]*regenerate|[\s\S]*destroy)/gi,
        fix: 'Regenerate session ID after successful authentication',
        cwe: 'CWE-384'
    },
    // Timing attack on comparison
    {
        id: 'auth-timing-attack',
        name: 'Timing Attack Vulnerability',
        description: 'String comparison is not constant-time.',
        severity: 'medium',
        category: 'auth',
        pattern: /(?:password|token|secret)\s*===?\s*(?:req\.|input|params)/gi,
        fix: 'Use crypto.timingSafeEqual() for secret comparison',
        cwe: 'CWE-208'
    },
    // Remember me without secure cookie
    {
        id: 'auth-remember-me-insecure',
        name: 'Insecure Remember Me Token',
        description: 'Remember me cookie missing security flags.',
        severity: 'medium',
        category: 'auth',
        pattern: /remember(?:Me|_me|Token)[\s\S]*?(?:cookie|setCookie)(?![\s\S]{0,50}(?:httpOnly|secure))/gi,
        fix: 'Use httpOnly, secure, and sameSite flags for auth cookies',
        cwe: 'CWE-614'
    },
    // Password in URL
    {
        id: 'auth-password-url',
        name: 'Password in URL',
        description: 'Passwords in URLs are logged and cached.',
        severity: 'high',
        category: 'auth',
        pattern: /(?:url|href|src)\s*[:=]\s*[^;]*[?&](?:password|pwd|pass)=/gi,
        fix: 'Never include passwords in URLs, use POST body',
        cwe: 'CWE-598'
    },
    // MFA bypass
    {
        id: 'auth-mfa-bypass',
        name: 'Potential MFA Bypass',
        description: 'MFA check may be bypassable.',
        severity: 'high',
        category: 'auth',
        pattern: /(?:skipMfa|mfaRequired)\s*[:=]\s*(?:false|0|req\.query)/gi,
        fix: 'MFA should not be skippable via user input',
        cwe: 'CWE-306'
    },
];

// Combine all additional patterns
export const allAdditionalPatterns: AdditionalPattern[] = [
    ...containerPatterns,
    ...cicdPatterns,
    ...reactPatterns,
    ...nextjsPatterns,
    ...additionalAuthPatterns,
];

// Pattern counts
export const additionalPatternStats = {
    container: containerPatterns.length,
    cicd: cicdPatterns.length,
    react: reactPatterns.length,
    nextjs: nextjsPatterns.length,
    auth: additionalAuthPatterns.length,
    total: allAdditionalPatterns.length,
};
