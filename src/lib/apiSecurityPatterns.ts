// API Security Patterns
// Based on: OWASP API Security Top 10, GraphQL Best Practices, JWT Security

export interface ApiPattern {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'api' | 'graphql' | 'jwt' | 'auth' | 'backend';
    pattern: RegExp;
    fix: string;
    cwe?: string;
    owasp?: string;
    languages?: string[];
}

// ============================================
// GRAPHQL SECURITY PATTERNS
// ============================================
export const graphqlPatterns: ApiPattern[] = [
    // Introspection
    {
        id: 'graphql-introspection',
        name: 'GraphQL Introspection Enabled',
        description: 'Introspection allows attackers to discover your entire API schema.',
        severity: 'high',
        category: 'graphql',
        pattern: /introspection\s*:\s*true|__schema|__type\s*\{/gi,
        fix: 'Disable introspection in production: introspection: process.env.NODE_ENV !== "production"',
        cwe: 'CWE-200'
    },
    // DoS via nested queries
    {
        id: 'graphql-depth-limit',
        name: 'Missing Query Depth Limit',
        description: 'Without depth limits, attackers can craft deeply nested queries for DoS.',
        severity: 'high',
        category: 'graphql',
        pattern: /new\s+ApolloServer\s*\(\s*\{(?![\s\S]*depthLimit)/gi,
        fix: 'Add graphql-depth-limit: depthLimit(10)',
        cwe: 'CWE-400'
    },
    // No query cost analysis
    {
        id: 'graphql-cost-analysis',
        name: 'Missing Query Cost Analysis',
        description: 'Expensive queries can exhaust server resources.',
        severity: 'medium',
        category: 'graphql',
        pattern: /new\s+ApolloServer\s*\(\s*\{(?![\s\S]*costAnalysis|[\s\S]*queryComplexity)/gi,
        fix: 'Add graphql-query-complexity or graphql-cost-analysis',
        cwe: 'CWE-400'
    },
    // Batching abuse
    {
        id: 'graphql-batch-limit',
        name: 'Unlimited Batch Queries',
        description: 'Unbounded batching allows bypass of rate limits.',
        severity: 'medium',
        category: 'graphql',
        pattern: /allowBatchedHttpRequests\s*:\s*true/gi,
        fix: 'Limit batch size or disable batching in production',
        cwe: 'CWE-400'
    },
    // Field-level auth
    {
        id: 'graphql-no-field-auth',
        name: 'Missing Field-Level Authorization',
        description: 'Sensitive fields accessible without proper authorization.',
        severity: 'high',
        category: 'graphql',
        pattern: /(?:password|secret|token|ssn|creditCard)\s*:\s*(?:String|ID|Int)/gi,
        fix: 'Add field-level authorization using directives or resolvers',
        cwe: 'CWE-862'
    },
    // SQL injection in resolvers
    {
        id: 'graphql-sqli-resolver',
        name: 'SQL Injection in GraphQL Resolver',
        description: 'Resolver directly concatenates user input into SQL.',
        severity: 'critical',
        category: 'graphql',
        pattern: /resolve[^{]*\{[^}]*(?:query|execute)\s*\([^)]*\$\{(?:args|input|parent)/gi,
        fix: 'Use parameterized queries in resolvers',
        cwe: 'CWE-89',
        owasp: 'A03:2021'
    },
];

// ============================================
// JWT SECURITY PATTERNS
// ============================================
export const jwtPatterns: ApiPattern[] = [
    // None algorithm
    {
        id: 'jwt-none-algo',
        name: 'JWT None Algorithm Allowed',
        description: 'Allowing "none" algorithm bypasses signature verification.',
        severity: 'critical',
        category: 'jwt',
        pattern: /algorithms?\s*:\s*\[[^\]]*['"]none['"][^\]]*\]/gi,
        fix: 'Explicitly specify allowed algorithms: algorithms: ["RS256"]',
        cwe: 'CWE-327'
    },
    // Weak secret
    {
        id: 'jwt-weak-secret',
        name: 'Weak JWT Secret',
        description: 'Secret is too short or predictable. Use 256+ bit secrets.',
        severity: 'high',
        category: 'jwt',
        pattern: /jwt\.sign\s*\([^,]+,\s*['"][^'"]{1,20}['"]/gi,
        fix: 'Use a cryptographically random secret with at least 256 bits',
        cwe: 'CWE-326'
    },
    // No expiry
    {
        id: 'jwt-no-expiry',
        name: 'JWT Without Expiration',
        description: 'Tokens without expiry never become invalid.',
        severity: 'high',
        category: 'jwt',
        pattern: /jwt\.sign\s*\([^)]+\)(?![\s\S]{0,100}expiresIn)/gi,
        fix: 'Add expiration: jwt.sign(payload, secret, { expiresIn: "1h" })',
        cwe: 'CWE-613'
    },
    // Secret in code
    {
        id: 'jwt-secret-hardcoded',
        name: 'Hardcoded JWT Secret',
        description: 'JWT secret should be in environment variables.',
        severity: 'critical',
        category: 'jwt',
        pattern: /(?:jwt|jsonwebtoken)\.(?:sign|verify)\s*\([^,]+,\s*['"][^'"]+['"]/gi,
        fix: 'Use environment variable: process.env.JWT_SECRET',
        cwe: 'CWE-798'
    },
    // Algorithm confusion
    {
        id: 'jwt-algo-confusion',
        name: 'JWT Algorithm Confusion Risk',
        description: 'Not specifying algorithm in verify() allows confusion attacks.',
        severity: 'high',
        category: 'jwt',
        pattern: /jwt\.verify\s*\([^,]+,\s*[^,]+\s*\)(?!\s*,)/gi,
        fix: 'Specify algorithm in verify: jwt.verify(token, secret, { algorithms: ["HS256"] })',
        cwe: 'CWE-327'
    },
    // Storing JWT in localStorage
    {
        id: 'jwt-localstorage',
        name: 'JWT Stored in localStorage',
        description: 'localStorage is vulnerable to XSS. Use httpOnly cookies.',
        severity: 'medium',
        category: 'jwt',
        pattern: /localStorage\.setItem\s*\([^,]*(?:token|jwt|auth)/gi,
        fix: 'Store JWT in httpOnly, secure cookies',
        cwe: 'CWE-922'
    },
];

// ============================================
// REST API / OWASP API SECURITY PATTERNS
// ============================================
export const restApiPatterns: ApiPattern[] = [
    // BOLA/IDOR
    {
        id: 'api-bola',
        name: 'Broken Object Level Authorization (BOLA)',
        description: 'Object ID from URL/params used without ownership check.',
        severity: 'critical',
        category: 'api',
        pattern: /(?:req\.params|req\.query)\.[a-zA-Z]*[iI]d(?![\s\S]{0,50}(?:userId|ownerId|req\.user))/gi,
        fix: 'Always verify the requesting user owns or has access to the resource',
        cwe: 'CWE-639',
        owasp: 'API1:2023'
    },
    // Missing auth middleware
    {
        id: 'api-no-auth',
        name: 'Endpoint Without Authentication',
        description: 'API endpoint lacks authentication middleware.',
        severity: 'high',
        category: 'api',
        pattern: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"][^'"]+['"]\s*,\s*(?:async\s*)?\(?(?:req|request)/gi,
        fix: 'Add authentication middleware before route handler',
        cwe: 'CWE-306',
        owasp: 'API2:2023'
    },
    // Mass assignment
    {
        id: 'api-mass-assignment',
        name: 'Mass Assignment Vulnerability',
        description: 'Directly assigning req.body to model allows overwriting protected fields.',
        severity: 'high',
        category: 'api',
        pattern: /(?:new\s+[A-Z][a-zA-Z]+|\.create|\.update|\.findOneAndUpdate)\s*\(\s*(?:req\.body|\.\.\.\s*req\.body)/gi,
        fix: 'Explicitly whitelist allowed fields instead of using spread',
        cwe: 'CWE-915',
        owasp: 'API6:2023'
    },
    // Rate limiting
    {
        id: 'api-no-rate-limit',
        name: 'Missing Rate Limiting',
        description: 'API without rate limiting is vulnerable to brute force and DoS.',
        severity: 'medium',
        category: 'api',
        pattern: /express\s*\(\s*\)(?![\s\S]{0,500}rateLimit|[\s\S]{0,500}express-rate-limit)/gi,
        fix: 'Add express-rate-limit middleware',
        cwe: 'CWE-770',
        owasp: 'API4:2023'
    },
    // CORS wildcard
    {
        id: 'api-cors-wildcard',
        name: 'CORS Wildcard Origin',
        description: 'Allowing all origins exposes API to cross-origin attacks.',
        severity: 'high',
        category: 'api',
        pattern: /cors\s*\(\s*\{[^}]*origin\s*:\s*(?:true|['"]?\*['"]?)/gi,
        fix: 'Specify allowed origins explicitly',
        cwe: 'CWE-942'
    },
    // Verbose errors
    {
        id: 'api-verbose-error',
        name: 'Verbose Error Messages',
        description: 'Sending stack traces to clients leaks implementation details.',
        severity: 'medium',
        category: 'api',
        pattern: /res\.(json|send)\s*\([^)]*(?:err\.stack|error\.stack|e\.stack)/gi,
        fix: 'Return generic error messages, log details server-side',
        cwe: 'CWE-209',
        owasp: 'API7:2023'
    },
    // No input validation
    {
        id: 'api-no-validation',
        name: 'Missing Input Validation',
        description: 'User input used without validation.',
        severity: 'high',
        category: 'api',
        pattern: /(?:req\.body|req\.query|req\.params)\.[a-zA-Z]+(?![\s\S]{0,50}(?:validate|schema|joi|zod|yup))/gi,
        fix: 'Use validation libraries like Joi, Zod, or Yup',
        cwe: 'CWE-20',
        owasp: 'API8:2023'
    },
    // Unsafe redirect
    {
        id: 'api-open-redirect',
        name: 'Open Redirect Vulnerability',
        description: 'Redirect URL from user input without validation.',
        severity: 'high',
        category: 'api',
        pattern: /res\.redirect\s*\(\s*(?:req\.query|req\.body|req\.params)\.[a-zA-Z]+/gi,
        fix: 'Validate redirect URLs against a whitelist',
        cwe: 'CWE-601'
    },
];

// ============================================
// BACKEND SECURITY PATTERNS (Node.js, Python, Go)
// ============================================
export const backendPatterns: ApiPattern[] = [
    // Prototype pollution
    {
        id: 'backend-prototype-pollution',
        name: 'Prototype Pollution',
        description: 'Merging user input into objects can pollute Object prototype.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:Object\.assign|_.merge|_.extend|lodash\.merge)\s*\([^,]+,\s*(?:req\.body|userInput|params)/gi,
        fix: 'Use Object.create(null) or validate/sanitize input before merging',
        cwe: 'CWE-1321',
        languages: ['javascript', 'typescript']
    },
    // Unsafe deserialization (Node)
    {
        id: 'backend-unsafe-deserialize',
        name: 'Unsafe Deserialization',
        description: 'Deserializing untrusted data can lead to RCE.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:serialize-javascript|node-serialize|funcster)\.(?:unserialize|deserialize)\s*\(/gi,
        fix: 'Avoid deserializing untrusted data or use safe serialization',
        cwe: 'CWE-502',
        languages: ['javascript', 'typescript']
    },
    // Python pickle
    {
        id: 'backend-pickle-load',
        name: 'Unsafe Pickle Deserialization',
        description: 'Loading pickled data from untrusted sources enables RCE.',
        severity: 'critical',
        category: 'backend',
        pattern: /pickle\.loads?\s*\(|cPickle\.loads?\s*\(/gi,
        fix: 'Use JSON or other safe serialization for untrusted data',
        cwe: 'CWE-502',
        languages: ['python']
    },
    // Python exec/eval
    {
        id: 'backend-python-exec',
        name: 'Dangerous exec/eval Usage',
        description: 'Executing user-controlled strings leads to RCE.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:exec|eval)\s*\(\s*(?:f['"]|request\.|user_input|data\[)/gi,
        fix: 'Never exec/eval untrusted input. Use safe alternatives.',
        cwe: 'CWE-94',
        languages: ['python']
    },
    // SSRF
    {
        id: 'backend-ssrf',
        name: 'Server-Side Request Forgery (SSRF)',
        description: 'Fetching URLs from user input without validation.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:axios|fetch|request|got|http\.get)\s*\(\s*(?:req\.body|req\.query|request\.args|user_input)/gi,
        fix: 'Validate and whitelist allowed URLs/domains',
        cwe: 'CWE-918',
        owasp: 'A10:2021'
    },
    // NoSQL injection
    {
        id: 'backend-nosql-injection',
        name: 'NoSQL Injection',
        description: 'User input directly in MongoDB query operators.',
        severity: 'critical',
        category: 'backend',
        pattern: /\.(find|findOne|findOneAndUpdate|updateOne|deleteOne)\s*\(\s*(?:req\.body|req\.query|\{[^}]*\$(?:where|regex|gt|lt|ne|in))/gi,
        fix: 'Sanitize input and avoid $where. Use mongoose schema validation.',
        cwe: 'CWE-943'
    },
    // Insecure randomness
    {
        id: 'backend-weak-random',
        name: 'Insecure Random Number Generation',
        description: 'Math.random() is not cryptographically secure.',
        severity: 'medium',
        category: 'backend',
        pattern: /Math\.random\s*\(\s*\).*(?:token|secret|password|key|id)/gi,
        fix: 'Use crypto.randomBytes() or crypto.randomUUID()',
        cwe: 'CWE-330'
    },
    // Insecure cookie
    {
        id: 'backend-insecure-cookie',
        name: 'Insecure Cookie Settings',
        description: 'Cookie missing secure, httpOnly, or sameSite flags.',
        severity: 'medium',
        category: 'backend',
        pattern: /res\.cookie\s*\([^)]+\)(?![\s\S]{0,50}(?:httpOnly|secure))/gi,
        fix: 'Set httpOnly: true, secure: true, sameSite: "strict"',
        cwe: 'CWE-614'
    },
    // Directory listing
    {
        id: 'backend-directory-listing',
        name: 'Directory Listing Enabled',
        description: 'Serving static files with directory browsing.',
        severity: 'medium',
        category: 'backend',
        pattern: /express\.static\s*\([^)]+\)(?![\s\S]{0,50}index:\s*false)/gi,
        fix: 'Disable indexes: express.static(path, { index: false })',
        cwe: 'CWE-548'
    },
    // SQL time-based injection
    {
        id: 'backend-sql-timing',
        name: 'Time-Based SQL Injection',
        description: 'Sleep/waitfor in SQL indicates time-based attack surface.',
        severity: 'high',
        category: 'backend',
        pattern: /SLEEP\s*\(|WAITFOR\s+DELAY|pg_sleep\s*\(|BENCHMARK\s*\(/gi,
        fix: 'Use parameterized queries exclusively',
        cwe: 'CWE-89'
    },
    // XXE
    {
        id: 'backend-xxe',
        name: 'XML External Entity (XXE)',
        description: 'Parsing XML without disabling external entities.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:parseString|xml2js|DOMParser|xml\.parse)\s*\([^)]*\)(?![\s\S]{0,100}(?:noent|external|resolveExternals):\s*false)/gi,
        fix: 'Disable external entity processing in XML parser',
        cwe: 'CWE-611',
        owasp: 'A05:2021'
    },
    // Hardcoded credentials
    {
        id: 'backend-hardcoded-creds',
        name: 'Hardcoded Database Credentials',
        description: 'Database connection string with embedded credentials.',
        severity: 'critical',
        category: 'backend',
        pattern: /(?:mongodb|postgres|mysql|redis):\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9!@#$%^&*]+@/gi,
        fix: 'Use environment variables for connection strings',
        cwe: 'CWE-798'
    },
];

// Combine all API patterns
export const allApiPatterns: ApiPattern[] = [
    ...graphqlPatterns,
    ...jwtPatterns,
    ...restApiPatterns,
    ...backendPatterns,
];

// Get patterns by category
export function getApiPatternsByCategory(category: ApiPattern['category']): ApiPattern[] {
    return allApiPatterns.filter(p => p.category === category);
}

// Export pattern counts
export const apiPatternStats = {
    graphql: graphqlPatterns.length,
    jwt: jwtPatterns.length,
    restApi: restApiPatterns.length,
    backend: backendPatterns.length,
    total: allApiPatterns.length,
};
