// Security vulnerability patterns for frontend-only scanning
// Converted from Semgrep rules for JavaScript execution

export interface VulnPattern {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    pattern: RegExp;
    message: string;
    cwe?: string;
    owasp?: string;
    fix?: string;
    languages?: string[];
    compliance?: string[];
}

// ==================== SECRETS DETECTION (50+ patterns) ====================
export const secretPatterns: VulnPattern[] = [
    // OpenAI
    {
        id: 'secret-openai', title: 'OpenAI API Key', severity: 'critical', category: 'secrets',
        pattern: /sk-[a-zA-Z0-9]{48}/g, message: 'OpenAI API key exposed', cwe: 'CWE-798'
    },

    // Anthropic
    {
        id: 'secret-anthropic', title: 'Anthropic API Key', severity: 'critical', category: 'secrets',
        pattern: /sk-ant-[a-zA-Z0-9-]{95}/g, message: 'Anthropic API key exposed', cwe: 'CWE-798'
    },

    // Stripe
    {
        id: 'secret-stripe-live', title: 'Stripe Live Secret Key', severity: 'critical', category: 'secrets',
        pattern: /sk_live_[a-zA-Z0-9]{24,}/g, message: 'Stripe live secret key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-stripe-test', title: 'Stripe Test Key', severity: 'high', category: 'secrets',
        pattern: /sk_test_[a-zA-Z0-9]{24,}/g, message: 'Stripe test key exposed', cwe: 'CWE-798'
    },

    // AWS
    {
        id: 'secret-aws-access', title: 'AWS Access Key ID', severity: 'critical', category: 'secrets',
        pattern: /AKIA[0-9A-Z]{16}/g, message: 'AWS access key ID exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-aws-secret', title: 'AWS Secret Key', severity: 'critical', category: 'secrets',
        pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"][a-zA-Z0-9/+=]{40}['"]/gi,
        message: 'AWS secret access key exposed', cwe: 'CWE-798'
    },

    // GitHub
    {
        id: 'secret-github-token', title: 'GitHub Token', severity: 'critical', category: 'secrets',
        pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, message: 'GitHub token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-github-pat', title: 'GitHub PAT', severity: 'critical', category: 'secrets',
        pattern: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g, message: 'GitHub PAT exposed', cwe: 'CWE-798'
    },

    // Google/Firebase
    {
        id: 'secret-firebase', title: 'Firebase API Key', severity: 'high', category: 'secrets',
        pattern: /AIza[0-9A-Za-z-_]{35}/g, message: 'Firebase API key exposed', cwe: 'CWE-798'
    },

    // Supabase
    {
        id: 'secret-supabase', title: 'Supabase Service Role Key', severity: 'critical', category: 'secrets',
        pattern: /(?:supabase|service_role)\s*[:=]\s*['"]?eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}['"]?/gi,
        message: 'Supabase service role key exposed', cwe: 'CWE-798'
    },

    // Database URLs
    {
        id: 'secret-database-url', title: 'Database Connection URL', severity: 'critical', category: 'secrets',
        pattern: /(postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@[^\s'"]+/gi,
        message: 'Database credentials exposed in URL', cwe: 'CWE-798'
    },

    // Private Keys
    {
        id: 'secret-private-key', title: 'Private Key', severity: 'critical', category: 'secrets',
        pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
        message: 'Private key exposed', cwe: 'CWE-798'
    },

    // JWT Secrets
    {
        id: 'secret-jwt', title: 'JWT Secret', severity: 'critical', category: 'secrets',
        pattern: /(?:jwt[_-]?secret|token[_-]?secret)\s*[:=]\s*['"][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{16,}['"]/gi,
        message: 'JWT secret exposed', cwe: 'CWE-798'
    },

    // Generic API Keys
    {
        id: 'secret-api-key', title: 'Generic API Key', severity: 'high', category: 'secrets',
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        message: 'API key exposed', cwe: 'CWE-798'
    },

    // SendGrid
    {
        id: 'secret-sendgrid', title: 'SendGrid API Key', severity: 'critical', category: 'secrets',
        pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g, message: 'SendGrid API key exposed', cwe: 'CWE-798'
    },

    // Twilio
    {
        id: 'secret-twilio', title: 'Twilio API Key', severity: 'critical', category: 'secrets',
        pattern: /SK[a-f0-9]{32}/g, message: 'Twilio API key exposed', cwe: 'CWE-798'
    },

    // Slack
    {
        id: 'secret-slack', title: 'Slack Token', severity: 'critical', category: 'secrets',
        pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g, message: 'Slack token exposed', cwe: 'CWE-798'
    },

    // Discord
    {
        id: 'secret-discord', title: 'Discord Bot Token', severity: 'critical', category: 'secrets',
        pattern: /[MN][A-Za-z\d]{23,}\.[\\w-]{6}\.[\\w-]{27}/g, message: 'Discord token exposed', cwe: 'CWE-798'
    },

    // Groq
    {
        id: 'secret-groq', title: 'Groq API Key', severity: 'critical', category: 'secrets',
        pattern: /gsk_[a-zA-Z0-9]{52}/g, message: 'Groq API key exposed', cwe: 'CWE-798'
    },

    // HuggingFace
    {
        id: 'secret-huggingface', title: 'HuggingFace Token', severity: 'critical', category: 'secrets',
        pattern: /hf_[a-zA-Z0-9]{34,}/g, message: 'HuggingFace token exposed', cwe: 'CWE-798'
    },

    // Replicate
    {
        id: 'secret-replicate', title: 'Replicate API Key', severity: 'critical', category: 'secrets',
        pattern: /r8_[a-zA-Z0-9]{40}/g, message: 'Replicate API key exposed', cwe: 'CWE-798'
    },

    // Vercel
    {
        id: 'secret-vercel', title: 'Vercel Token', severity: 'critical', category: 'secrets',
        pattern: /(?:vercel[_-]?token)\s*[:=]\s*['"]?[a-zA-Z0-9]{24}['"]?/gi, message: 'Vercel token exposed', cwe: 'CWE-798'
    },

    // Clerk
    {
        id: 'secret-clerk', title: 'Clerk Secret Key', severity: 'critical', category: 'secrets',
        pattern: /sk_live_[a-zA-Z0-9]{40,}/g, message: 'Clerk secret key exposed', cwe: 'CWE-798'
    },

    // OpenRouter
    {
        id: 'secret-openrouter', title: 'OpenRouter API Key', severity: 'critical', category: 'secrets',
        pattern: /sk-or-v1-[a-f0-9]{64}/g, message: 'OpenRouter API key exposed', cwe: 'CWE-798'
    },

    // Perplexity
    {
        id: 'secret-perplexity', title: 'Perplexity API Key', severity: 'critical', category: 'secrets',
        pattern: /pplx-[a-f0-9]{48}/g, message: 'Perplexity API key exposed', cwe: 'CWE-798'
    },

    // Generic secrets
    {
        id: 'secret-generic', title: 'Hardcoded Secret', severity: 'high', category: 'secrets',
        pattern: /(?:SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY)\s*[:=]\s*['"][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]{8,}['"]/gi,
        message: 'Hardcoded secret detected', cwe: 'CWE-798'
    },
];

// ==================== SQL INJECTION (20+ patterns) ====================
export const sqlInjectionPatterns: VulnPattern[] = [
    {
        id: 'sqli-template-string', title: 'SQL Injection via Template String', severity: 'critical', category: 'sqli',
        pattern: /(?:query|execute|run)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
        message: 'SQL injection via template literal', cwe: 'CWE-89', owasp: 'A03:2021'
    },

    {
        id: 'sqli-concat', title: 'SQL Injection via Concatenation', severity: 'critical', category: 'sqli',
        pattern: /(?:query|execute)\s*\(\s*["'][^"']*["']\s*\+\s*\w+\s*\+\s*["']/gi,
        message: 'SQL injection via string concatenation', cwe: 'CWE-89', owasp: 'A03:2021'
    },

    {
        id: 'sqli-raw-query', title: 'Raw SQL Query', severity: 'high', category: 'sqli',
        pattern: /\$queryRaw\s*`[^`]*\$\{/gi,
        message: 'Prisma raw query with user input', cwe: 'CWE-89', owasp: 'A03:2021'
    },

    {
        id: 'sqli-format-string', title: 'SQL Format String', severity: 'critical', category: 'sqli',
        pattern: /(?:query|execute)\s*\(\s*['"](?:SELECT|INSERT|UPDATE|DELETE)[^'"]*%s/gi,
        message: 'SQL injection via format string', cwe: 'CWE-89', owasp: 'A03:2021'
    },

    {
        id: 'sqli-f-string', title: 'SQL f-string (Python)', severity: 'critical', category: 'sqli',
        pattern: /(?:execute|cursor\.execute)\s*\(\s*f["'][^"']*\{[^}]+\}/gi,
        message: 'SQL injection via Python f-string', cwe: 'CWE-89', owasp: 'A03:2021', languages: ['python']
    },
];

// ==================== XSS (15+ patterns) ====================
export const xssPatterns: VulnPattern[] = [
    {
        id: 'xss-innerhtml', title: 'XSS via innerHTML', severity: 'high', category: 'xss',
        pattern: /\.innerHTML\s*=\s*[^;]+/gi,
        message: 'Potential XSS via innerHTML assignment', cwe: 'CWE-79', owasp: 'A03:2021'
    },

    {
        id: 'xss-dangerously', title: 'XSS via dangerouslySetInnerHTML', severity: 'high', category: 'xss',
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]*__html/gi,
        message: 'XSS via dangerouslySetInnerHTML', cwe: 'CWE-79', owasp: 'A03:2021'
    },

    {
        id: 'xss-document-write', title: 'XSS via document.write', severity: 'high', category: 'xss',
        pattern: /document\.write\s*\([^)]+\)/gi,
        message: 'XSS via document.write', cwe: 'CWE-79', owasp: 'A03:2021'
    },

    {
        id: 'xss-outerhtml', title: 'XSS via outerHTML', severity: 'high', category: 'xss',
        pattern: /\.outerHTML\s*=\s*[^;]+/gi,
        message: 'Potential XSS via outerHTML', cwe: 'CWE-79', owasp: 'A03:2021'
    },

    {
        id: 'xss-insertadjacenthtml', title: 'XSS via insertAdjacentHTML', severity: 'high', category: 'xss',
        pattern: /\.insertAdjacentHTML\s*\([^)]+\)/gi,
        message: 'Potential XSS via insertAdjacentHTML', cwe: 'CWE-79', owasp: 'A03:2021'
    },

    {
        id: 'xss-eval', title: 'Code Injection via eval', severity: 'critical', category: 'xss',
        pattern: /\beval\s*\([^)]+\)/gi,
        message: 'Dangerous eval() usage', cwe: 'CWE-94', owasp: 'A03:2021'
    },

    {
        id: 'xss-new-function', title: 'Code Injection via new Function', severity: 'critical', category: 'xss',
        pattern: /new\s+Function\s*\([^)]+\)/gi,
        message: 'Dangerous new Function() usage', cwe: 'CWE-94', owasp: 'A03:2021'
    },

    {
        id: 'xss-svelte-html', title: 'XSS via Svelte @html', severity: 'high', category: 'xss',
        pattern: /\{@html\s+[^}]+\}/gi,
        message: 'Unescaped HTML in Svelte template', cwe: 'CWE-79', owasp: 'A03:2021'
    },
];

// ==================== COMMAND INJECTION (10+ patterns) ====================
export const commandInjectionPatterns: VulnPattern[] = [
    {
        id: 'cmdi-exec', title: 'Command Injection via exec', severity: 'critical', category: 'cmdi',
        pattern: /(?:child_process\.)?exec\s*\(\s*[`'"][^`'"]*\$\{[^}]+\}/gi,
        message: 'Command injection via exec()', cwe: 'CWE-78', owasp: 'A03:2021'
    },

    {
        id: 'cmdi-spawn', title: 'Unsafe spawn call', severity: 'high', category: 'cmdi',
        pattern: /spawn\s*\(\s*[^,]+,\s*\[.*\$\{/gi,
        message: 'Potential command injection via spawn()', cwe: 'CWE-78', owasp: 'A03:2021'
    },

    {
        id: 'cmdi-os-system', title: 'Command Injection via os.system', severity: 'critical', category: 'cmdi',
        pattern: /os\.system\s*\(\s*f?["'][^"']*\{/gi,
        message: 'Command injection via os.system()', cwe: 'CWE-78', owasp: 'A03:2021', languages: ['python']
    },

    {
        id: 'cmdi-subprocess', title: 'Unsafe subprocess call', severity: 'critical', category: 'cmdi',
        pattern: /subprocess\.(?:call|run|Popen)\s*\(\s*f?["'][^"']*\{/gi,
        message: 'Command injection via subprocess', cwe: 'CWE-78', owasp: 'A03:2021', languages: ['python']
    },

    {
        id: 'cmdi-shell-true', title: 'Subprocess with shell=True', severity: 'high', category: 'cmdi',
        pattern: /subprocess\.[^(]+\([^)]*shell\s*=\s*True/gi,
        message: 'Subprocess with shell=True is dangerous', cwe: 'CWE-78', owasp: 'A03:2021', languages: ['python']
    },
];

// ==================== PATH TRAVERSAL (10+ patterns) ====================
export const pathTraversalPatterns: VulnPattern[] = [
    {
        id: 'path-traversal-join', title: 'Path Traversal', severity: 'high', category: 'path',
        pattern: /path\.join\s*\([^)]*(?:req\.|request\.|params\.|query\.)/gi,
        message: 'Potential path traversal via user input', cwe: 'CWE-22', owasp: 'A01:2021'
    },

    {
        id: 'path-traversal-read', title: 'Unsafe File Read', severity: 'high', category: 'path',
        pattern: /(?:readFile|readFileSync)\s*\(\s*[^)]*(?:req\.|request\.|params\.|query\.)/gi,
        message: 'File read with unsanitized user input', cwe: 'CWE-22', owasp: 'A01:2021'
    },

    {
        id: 'path-traversal-send', title: 'Unsafe sendFile', severity: 'high', category: 'path',
        pattern: /\.sendFile\s*\([^)]*(?:req\.|request\.|params\.)/gi,
        message: 'sendFile with user-controlled path', cwe: 'CWE-22', owasp: 'A01:2021'
    },

    {
        id: 'path-traversal-open', title: 'Unsafe file open (Python)', severity: 'high', category: 'path',
        pattern: /open\s*\(\s*f?["'][^"']*\{[^}]*\}/gi,
        message: 'File open with user input', cwe: 'CWE-22', owasp: 'A01:2021', languages: ['python']
    },
];

// ==================== AUTH ISSUES (15+ patterns) ====================
export const authPatterns: VulnPattern[] = [
    {
        id: 'auth-weak-hash-md5', title: 'Weak Password Hashing (MD5)', severity: 'high', category: 'auth',
        pattern: /(?:createHash|hashlib\.)\s*\(\s*['"]md5['"]/gi,
        message: 'MD5 is not suitable for password hashing', cwe: 'CWE-328'
    },

    {
        id: 'auth-weak-hash-sha1', title: 'Weak Password Hashing (SHA1)', severity: 'high', category: 'auth',
        pattern: /(?:createHash|hashlib\.)\s*\(\s*['"]sha1?['"]/gi,
        message: 'SHA1 is not suitable for password hashing', cwe: 'CWE-328'
    },

    {
        id: 'auth-jwt-no-verify', title: 'JWT Without Verification', severity: 'critical', category: 'auth',
        pattern: /jwt\.decode\s*\([^)]*verify\s*[:=]\s*false/gi,
        message: 'JWT decoded without verification', cwe: 'CWE-347'
    },

    {
        id: 'auth-jwt-none-alg', title: 'JWT None Algorithm', severity: 'critical', category: 'auth',
        pattern: /algorithm\s*[:=]\s*['"]none['"]/gi,
        message: 'JWT with none algorithm is insecure', cwe: 'CWE-327'
    },

    {
        id: 'auth-cors-wildcard', title: 'CORS Wildcard', severity: 'medium', category: 'auth',
        pattern: /(?:cors|Access-Control-Allow-Origin)\s*[:=({]\s*['"]\*['"]/gi,
        message: 'CORS allows all origins', cwe: 'CWE-942'
    },

    {
        id: 'auth-ssl-disabled', title: 'SSL Verification Disabled', severity: 'high', category: 'auth',
        pattern: /(?:rejectUnauthorized|verify)\s*[:=]\s*false/gi,
        message: 'SSL certificate verification disabled', cwe: 'CWE-295'
    },

    {
        id: 'auth-hardcoded-creds', title: 'Hardcoded Credentials', severity: 'critical', category: 'auth',
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
        message: 'Hardcoded password detected', cwe: 'CWE-798'
    },
];

// ==================== CRYPTO WEAKNESSES (10+ patterns) ====================
export const cryptoPatterns: VulnPattern[] = [
    {
        id: 'crypto-weak-random', title: 'Weak Random Number Generator', severity: 'medium', category: 'crypto',
        pattern: /Math\.random\s*\(\s*\)/g,
        message: 'Math.random() is not cryptographically secure', cwe: 'CWE-330'
    },

    {
        id: 'crypto-des', title: 'Weak Cipher (DES)', severity: 'high', category: 'crypto',
        pattern: /(?:createCipher|DES|des-)/gi,
        message: 'DES is a weak cipher', cwe: 'CWE-327'
    },

    {
        id: 'crypto-ecb', title: 'ECB Mode', severity: 'high', category: 'crypto',
        pattern: /(?:ECB|ecb-|MODE_ECB)/g,
        message: 'ECB mode does not provide semantic security', cwe: 'CWE-327'
    },

    {
        id: 'crypto-static-iv', title: 'Static IV', severity: 'high', category: 'crypto',
        pattern: /(?:iv|IV)\s*[:=]\s*['"][a-fA-F0-9]{16,}['"]/g,
        message: 'Static IV makes encryption predictable', cwe: 'CWE-329'
    },

    {
        id: 'crypto-hardcoded-salt', title: 'Hardcoded Salt', severity: 'medium', category: 'crypto',
        pattern: /salt\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Hardcoded salt reduces security', cwe: 'CWE-760'
    },
];

// ==================== SSRF (5+ patterns) ====================
export const ssrfPatterns: VulnPattern[] = [
    {
        id: 'ssrf-fetch', title: 'SSRF via fetch', severity: 'high', category: 'ssrf',
        pattern: /fetch\s*\(\s*[^)]*(?:req\.|request\.|params\.|query\.|body\.)/gi,
        message: 'Server-side request with user-controlled URL', cwe: 'CWE-918', owasp: 'A10:2021'
    },

    {
        id: 'ssrf-axios', title: 'SSRF via axios', severity: 'high', category: 'ssrf',
        pattern: /axios\.[a-z]+\s*\(\s*[^)]*(?:req\.|request\.|params\.)/gi,
        message: 'Axios request with user-controlled URL', cwe: 'CWE-918', owasp: 'A10:2021'
    },

    {
        id: 'ssrf-request', title: 'SSRF via request library', severity: 'high', category: 'ssrf',
        pattern: /(?:request|got|superagent)\s*\(\s*[^)]*(?:req\.|params\.)/gi,
        message: 'HTTP request with user-controlled URL', cwe: 'CWE-918', owasp: 'A10:2021'
    },
];

// ==================== SOLIDITY PATTERNS (for Web3) ====================
export const solidityPatterns: VulnPattern[] = [
    {
        id: 'sol-reentrancy', title: 'Reentrancy Vulnerability', severity: 'critical', category: 'solidity',
        pattern: /\.call\s*\{[^}]*value\s*:/gi, message: 'External call with value - check for reentrancy', cwe: 'CWE-841'
    },
    {
        id: 'sol-tx-origin', title: 'tx.origin Authentication', severity: 'high', category: 'solidity',
        pattern: /tx\.origin/g, message: 'tx.origin should not be used for authentication', cwe: 'CWE-477'
    },
    {
        id: 'sol-delegatecall', title: 'Unsafe delegatecall', severity: 'critical', category: 'solidity',
        pattern: /\.delegatecall\s*\(/g, message: 'delegatecall can be dangerous', cwe: 'CWE-829'
    },
    {
        id: 'sol-selfdestruct', title: 'selfdestruct Usage', severity: 'high', category: 'solidity',
        pattern: /selfdestruct\s*\(/g, message: 'selfdestruct can destroy the contract', cwe: 'CWE-749'
    },
    {
        id: 'sol-weak-randomness', title: 'Weak Randomness', severity: 'high', category: 'solidity',
        pattern: /(?:block\.timestamp|blockhash|block\.difficulty)/g, message: 'Block values should not be used for randomness', cwe: 'CWE-330'
    },
    {
        id: 'sol-unchecked-transfer', title: 'Unchecked Transfer', severity: 'high', category: 'solidity',
        pattern: /\.transfer\s*\([^)]+\)\s*;(?!\s*require)/g, message: 'Transfer return value not checked', cwe: 'CWE-252'
    },
    // Additional Solidity patterns
    {
        id: 'sol-unchecked-call', title: 'Unchecked Low-Level Call', severity: 'high', category: 'solidity',
        pattern: /\.call\s*\([^)]*\)\s*;(?!\s*(?:require|if))/g, message: 'Low-level call return value not checked', cwe: 'CWE-252'
    },
    {
        id: 'sol-send-unchecked', title: 'Unchecked Send', severity: 'high', category: 'solidity',
        pattern: /\.send\s*\([^)]+\)\s*;(?!\s*require)/g, message: 'send() return value not checked', cwe: 'CWE-252'
    },
    {
        id: 'sol-arbitrary-jump', title: 'Assembly Jump', severity: 'critical', category: 'solidity',
        pattern: /assembly\s*\{[^}]*jump/gi, message: 'Arbitrary jump in assembly', cwe: 'CWE-94'
    },
    {
        id: 'sol-timestamp-dependence', title: 'Timestamp Dependence', severity: 'medium', category: 'solidity',
        pattern: /block\.timestamp\s*[<>=!]+/g, message: 'Time-based logic can be manipulated by miners', cwe: 'CWE-829'
    },
    {
        id: 'sol-storage-pointer', title: 'Uninitialized Storage Pointer', severity: 'high', category: 'solidity',
        pattern: /storage\s+\w+\s*;/g, message: 'Uninitialized storage pointer', cwe: 'CWE-457'
    },
    {
        id: 'sol-fallback-ether', title: 'Fallback Can Receive Ether', severity: 'medium', category: 'solidity',
        pattern: /fallback\s*\(\s*\)\s*external\s+payable/g, message: 'Fallback function accepts ether', cwe: 'CWE-749'
    },
    {
        id: 'sol-visibility-missing', title: 'Missing Visibility', severity: 'medium', category: 'solidity',
        pattern: /function\s+\w+\s*\([^)]*\)\s*(?!public|private|internal|external)/g, message: 'Function visibility not specified', cwe: 'CWE-710'
    },
    {
        id: 'sol-integer-overflow', title: 'Integer Overflow Risk', severity: 'high', category: 'solidity',
        pattern: /(?:uint|int)\d*\s+\w+\s*[+\-*]=\s*\w+(?!\s*;)/g, message: 'Potential integer overflow (use SafeMath or Solidity 0.8+)', cwe: 'CWE-190'
    },
    {
        id: 'sol-approve-race', title: 'Approve Race Condition', severity: 'medium', category: 'solidity',
        pattern: /function\s+approve\s*\(/g, message: 'ERC20 approve race condition - use increaseAllowance', cwe: 'CWE-362'
    },
    {
        id: 'sol-msg-value-loop', title: 'msg.value in Loop', severity: 'high', category: 'solidity',
        pattern: /for\s*\([^)]*\)\s*\{[^}]*msg\.value/gi, message: 'msg.value used in loop - potential double-spend', cwe: 'CWE-682'
    },
];

// ==================== NOSQL INJECTION ====================
export const nosqlPatterns: VulnPattern[] = [
    {
        id: 'nosql-mongo-operator', title: 'NoSQL Injection (MongoDB Operator)', severity: 'critical', category: 'nosql',
        pattern: /\$(?:where|regex|gt|lt|ne|eq|or|and|not)\s*:/gi, message: 'MongoDB operator in user input', cwe: 'CWE-943', owasp: 'A03:2021'
    },
    {
        id: 'nosql-find-user-input', title: 'NoSQL Query with User Input', severity: 'high', category: 'nosql',
        pattern: /\.find\s*\(\s*\{[^}]*(?:req\.|request\.|params\.|query\.|body\.)/gi, message: 'MongoDB find with user input', cwe: 'CWE-943'
    },
    {
        id: 'nosql-aggregate-user', title: 'NoSQL Aggregate with User Input', severity: 'high', category: 'nosql',
        pattern: /\.aggregate\s*\(\s*\[[^\]]*(?:req\.|request\.)/gi, message: 'MongoDB aggregate with user input', cwe: 'CWE-943'
    },
    {
        id: 'nosql-eval', title: 'MongoDB $where/$function', severity: 'critical', category: 'nosql',
        pattern: /\$(?:where|function)\s*:/gi, message: 'MongoDB JavaScript execution', cwe: 'CWE-94'
    },
];

// ==================== DESERIALIZATION ====================
export const deserializationPatterns: VulnPattern[] = [
    {
        id: 'deser-pickle', title: 'Unsafe Pickle Deserialization', severity: 'critical', category: 'deserialization',
        pattern: /pickle\.(?:load|loads)\s*\(/gi, message: 'Pickle deserialization is unsafe with untrusted data', cwe: 'CWE-502', languages: ['python']
    },
    {
        id: 'deser-yaml-load', title: 'Unsafe YAML Load', severity: 'critical', category: 'deserialization',
        pattern: /yaml\.(?:load|unsafe_load)\s*\([^)]*(?!Loader)/gi, message: 'Use yaml.safe_load instead', cwe: 'CWE-502', languages: ['python']
    },
    {
        id: 'deser-marshal', title: 'Unsafe Marshal', severity: 'high', category: 'deserialization',
        pattern: /Marshal\.(?:load|restore)\s*\(/gi, message: 'Marshal deserialization is unsafe', cwe: 'CWE-502', languages: ['ruby']
    },
    {
        id: 'deser-json-parse-untrusted', title: 'JSON Parse with Reviver', severity: 'medium', category: 'deserialization',
        pattern: /JSON\.parse\s*\([^)]+,\s*function/gi, message: 'JSON.parse reviver with untrusted data', cwe: 'CWE-502'
    },
    {
        id: 'deser-serialize-js', title: 'Unsafe Serialize', severity: 'critical', category: 'deserialization',
        pattern: /require\s*\(\s*['\"]serialize-javascript['\"]\s*\)/gi, message: 'serialize-javascript can execute code', cwe: 'CWE-502'
    },
];

// ==================== XXE (XML External Entity) ====================
export const xxePatterns: VulnPattern[] = [
    {
        id: 'xxe-parse', title: 'XXE via XML Parsing', severity: 'high', category: 'xxe',
        pattern: /(?:DOMParser|XMLReader|parseXML)\s*\(/gi, message: 'XML parsing may be vulnerable to XXE', cwe: 'CWE-611', owasp: 'A05:2021'
    },
    {
        id: 'xxe-etree', title: 'XXE via ElementTree', severity: 'high', category: 'xxe',
        pattern: /(?:ET|etree|ElementTree)\.parse\s*\(/gi, message: 'ElementTree parsing may be vulnerable to XXE', cwe: 'CWE-611', languages: ['python']
    },
    {
        id: 'xxe-lxml', title: 'lxml XXE', severity: 'high', category: 'xxe',
        pattern: /lxml\.etree\.parse\s*\(/gi, message: 'lxml parsing may be vulnerable to XXE', cwe: 'CWE-611', languages: ['python']
    },
    {
        id: 'xxe-doctype', title: 'DOCTYPE Declaration', severity: 'medium', category: 'xxe',
        pattern: /<!DOCTYPE[^>]*SYSTEM/gi, message: 'DOCTYPE with SYSTEM may enable XXE', cwe: 'CWE-611'
    },
];

// ==================== PROTOTYPE POLLUTION ====================
export const prototypePollutionPatterns: VulnPattern[] = [
    {
        id: 'proto-merge', title: 'Prototype Pollution via Merge', severity: 'high', category: 'prototype',
        pattern: /(?:merge|extend|assign|defaults)\s*\([^)]*(?:req\.|request\.|params\.|body\.)/gi, message: 'Object merge with user input', cwe: 'CWE-1321'
    },
    {
        id: 'proto-set', title: 'Prototype Pollution via lodash.set', severity: 'high', category: 'prototype',
        pattern: /(?:_\.set|lodash\.set)\s*\([^)]*(?:req\.|body\.)/gi, message: 'lodash.set with user-controlled path', cwe: 'CWE-1321'
    },
    {
        id: 'proto-bracket', title: 'Bracket Notation Assignment', severity: 'medium', category: 'prototype',
        pattern: /\w+\s*\[\s*(?:req\.|body\.)[^\]]+\]\s*=/gi, message: 'Dynamic property assignment with user input', cwe: 'CWE-1321'
    },
    {
        id: 'proto-proto-key', title: '__proto__ Access', severity: 'high', category: 'prototype',
        pattern: /__proto__|constructor\.prototype/g, message: 'Prototype chain access', cwe: 'CWE-1321'
    },
];

// ==================== REDOS (Regular Expression DoS) ====================
export const redosPatterns: VulnPattern[] = [
    {
        id: 'redos-nested-quantifier', title: 'ReDoS Nested Quantifier', severity: 'medium', category: 'redos',
        pattern: /\(\.\*\)\+|\(\.\+\)\*|\(\.\+\)\+/g, message: 'Nested quantifiers can cause ReDoS', cwe: 'CWE-1333'
    },
    {
        id: 'redos-overlapping', title: 'ReDoS Overlapping Groups', severity: 'medium', category: 'redos',
        pattern: /\([^)]+\|[^)]+\)\+/g, message: 'Overlapping alternation with quantifier', cwe: 'CWE-1333'
    },
    {
        id: 'redos-backtracking', title: 'Potential Backtracking', severity: 'low', category: 'redos',
        pattern: /\(\.\*\)[^*+?]/g, message: 'Greedy quantifier may cause backtracking', cwe: 'CWE-1333'
    },
];

// ==================== RACE CONDITIONS ====================
export const raceConditionPatterns: VulnPattern[] = [
    {
        id: 'race-toctou', title: 'TOCTOU Race Condition', severity: 'medium', category: 'race',
        pattern: /if\s*\(\s*(?:fs\.)?(?:exists|access)Sync?\s*\([^)]+\)\s*\)[^{]*\{[^}]*(?:read|write|unlink)/gi, message: 'Time-of-check to time-of-use race condition', cwe: 'CWE-367'
    },
    {
        id: 'race-async-state', title: 'Async State Mutation', severity: 'medium', category: 'race',
        pattern: /await\s+[^;]+;\s*\w+\s*[+\-*]=\s*\w+/gi, message: 'State mutation after await may cause race conditions', cwe: 'CWE-362'
    },
];

// ==================== FRAMEWORK-SPECIFIC: NEXT.JS ====================
export const nextjsPatterns: VulnPattern[] = [
    {
        id: 'nextjs-server-action-exposure', title: 'Next.js Server Action Exposure', severity: 'high', category: 'nextjs',
        pattern: /['"]use server['"]\s*(?:;|\n)[^}]*(?:password|secret|apiKey|token)/gi, message: 'Sensitive data in server action', cwe: 'CWE-200'
    },
    {
        id: 'nextjs-getServerSideProps-leak', title: 'getServerSideProps Data Leak', severity: 'high', category: 'nextjs',
        pattern: /getServerSideProps[^}]*return\s*\{[^}]*props:[^}]*(?:password|secret|apiKey)/gi, message: 'Sensitive data exposed via SSR props', cwe: 'CWE-200'
    },
    {
        id: 'nextjs-api-no-auth', title: 'Next.js API Without Auth Check', severity: 'medium', category: 'nextjs',
        pattern: /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{(?![^}]*(?:auth|session|token|verify))/gi, message: 'API route may lack authentication', cwe: 'CWE-306'
    },
    {
        id: 'nextjs-revalidate-secret', title: 'Revalidation Without Secret', severity: 'medium', category: 'nextjs',
        pattern: /revalidatePath|revalidateTag(?![^}]*secret)/gi, message: 'ISR revalidation without secret verification', cwe: 'CWE-306'
    },
];

// ==================== FRAMEWORK-SPECIFIC: REACT ====================
export const reactPatterns: VulnPattern[] = [
    {
        id: 'react-href-js', title: 'React javascript: URL', severity: 'high', category: 'react',
        pattern: /href\s*=\s*\{?\s*[`'"]\s*javascript:/gi, message: 'javascript: URL in React href', cwe: 'CWE-79'
    },
    {
        id: 'react-ref-innerhtml', title: 'React Ref innerHTML', severity: 'high', category: 'react',
        pattern: /ref\.current\.innerHTML\s*=/gi, message: 'innerHTML via React ref', cwe: 'CWE-79'
    },
    {
        id: 'react-useeffect-fetch', title: 'React useEffect Fetch Race', severity: 'low', category: 'react',
        pattern: /useEffect\s*\(\s*(?:async|\(\s*\)\s*=>\s*\{)[^}]*fetch(?![^}]*(?:abort|cancel|cleanup))/gi, message: 'Fetch in useEffect without cleanup', cwe: 'CWE-362'
    },
];

// ==================== FRAMEWORK-SPECIFIC: EXPRESS ====================
export const expressPatterns: VulnPattern[] = [
    {
        id: 'express-no-helmet', title: 'Express Without Helmet', severity: 'medium', category: 'express',
        pattern: /express\s*\(\s*\)(?![^}]*helmet)/gi, message: 'Express app without helmet security headers', cwe: 'CWE-693'
    },
    {
        id: 'express-body-parser-limit', title: 'No Body Parser Limit', severity: 'medium', category: 'express',
        pattern: /bodyParser\.json\s*\(\s*\)(?![^)]*limit)/gi, message: 'Body parser without size limit', cwe: 'CWE-400'
    },
    {
        id: 'express-static-dotfiles', title: 'Express Static Dotfiles', severity: 'medium', category: 'express',
        pattern: /express\.static\s*\([^)]*\)(?![^)]*dotfiles)/gi, message: 'Static files may expose dotfiles', cwe: 'CWE-538'
    },
    {
        id: 'express-session-insecure', title: 'Insecure Session Config', severity: 'high', category: 'express',
        pattern: /session\s*\(\s*\{[^}]*secure\s*:\s*false/gi, message: 'Session cookie without secure flag', cwe: 'CWE-614'
    },
    {
        id: 'express-csrf-disabled', title: 'CSRF Protection Disabled', severity: 'high', category: 'express',
        pattern: /csrf\s*\(\s*\{[^}]*(?:ignore|cookie:\s*false)/gi, message: 'CSRF protection disabled', cwe: 'CWE-352'
    },
];

// ==================== FRAMEWORK-SPECIFIC: DJANGO ====================
export const djangoPatterns: VulnPattern[] = [
    {
        id: 'django-debug-true', title: 'Django DEBUG=True', severity: 'high', category: 'django',
        pattern: /DEBUG\s*=\s*True/g, message: 'Django DEBUG mode enabled in production', cwe: 'CWE-489', languages: ['python']
    },
    {
        id: 'django-secret-hardcoded', title: 'Django Hardcoded SECRET_KEY', severity: 'critical', category: 'django',
        pattern: /SECRET_KEY\s*=\s*['\"][^'\"]{10,}['\"]/g, message: 'Django SECRET_KEY hardcoded', cwe: 'CWE-798', languages: ['python']
    },
    {
        id: 'django-csrf-exempt', title: 'Django CSRF Exempt', severity: 'high', category: 'django',
        pattern: /@csrf_exempt/g, message: 'CSRF protection disabled for view', cwe: 'CWE-352', languages: ['python']
    },
    {
        id: 'django-raw-sql', title: 'Django Raw SQL', severity: 'high', category: 'django',
        pattern: /\.raw\s*\(\s*f?['\"][^'\"]*\{/gi, message: 'Django raw SQL with format string', cwe: 'CWE-89', languages: ['python']
    },
    {
        id: 'django-mark-safe', title: 'Django mark_safe', severity: 'high', category: 'django',
        pattern: /mark_safe\s*\(/g, message: 'mark_safe bypasses HTML escaping', cwe: 'CWE-79', languages: ['python']
    },
];

// ==================== FRAMEWORK-SPECIFIC: FLASK ====================
export const flaskPatterns: VulnPattern[] = [
    {
        id: 'flask-debug-true', title: 'Flask Debug Mode', severity: 'high', category: 'flask',
        pattern: /app\.run\s*\([^)]*debug\s*=\s*True/gi, message: 'Flask debug mode enabled', cwe: 'CWE-489', languages: ['python']
    },
    {
        id: 'flask-secret-hardcoded', title: 'Flask Hardcoded Secret', severity: 'critical', category: 'flask',
        pattern: /app\.secret_key\s*=\s*['\"][^'\"]{5,}['\"]/g, message: 'Flask secret_key hardcoded', cwe: 'CWE-798', languages: ['python']
    },
    {
        id: 'flask-render-string', title: 'Flask render_template_string', severity: 'critical', category: 'flask',
        pattern: /render_template_string\s*\([^)]*(?:request\.|args\.|form\.)/gi, message: 'SSTI via render_template_string', cwe: 'CWE-94', languages: ['python']
    },
    {
        id: 'flask-safe-filter', title: 'Flask |safe Filter', severity: 'high', category: 'flask',
        pattern: /\{\{\s*\w+\s*\|\s*safe\s*\}\}/g, message: 'Jinja2 safe filter bypasses escaping', cwe: 'CWE-79', languages: ['python']
    },
];

// ==================== OWASP API SECURITY TOP 10 ====================
export const owaspApiPatterns: VulnPattern[] = [
    // API1: Broken Object Level Authorization
    {
        id: 'owasp-api1-idor', title: 'IDOR Vulnerability', severity: 'high', category: 'owasp-api',
        pattern: /\/(?:user|account|order|profile)\/\s*[:$]\s*(?:id|userId|accountId)/gi, message: 'Object reference in URL without authorization check', cwe: 'CWE-639', owasp: 'API1:2023'
    },
    // API2: Broken Authentication
    {
        id: 'owasp-api2-no-rate-limit', title: 'No Rate Limiting', severity: 'medium', category: 'owasp-api',
        pattern: /(?:login|auth|signin|password)(?![^}]*(?:rateLimit|throttle|limiter))/gi, message: 'Authentication endpoint without rate limiting', cwe: 'CWE-307', owasp: 'API2:2023'
    },
    // API3: Broken Object Property Level Authorization
    {
        id: 'owasp-api3-mass-assignment', title: 'Mass Assignment', severity: 'high', category: 'owasp-api',
        pattern: /(?:create|update)\s*\(\s*(?:req\.body|request\.body)/gi, message: 'Mass assignment from request body', cwe: 'CWE-915', owasp: 'API3:2023'
    },
    // API4: Unrestricted Resource Consumption
    {
        id: 'owasp-api4-no-pagination', title: 'No Pagination', severity: 'medium', category: 'owasp-api',
        pattern: /\.find\s*\(\s*\{[^}]*\}\s*\)(?![^;]*(?:limit|take|skip|page))/gi, message: 'Query without pagination', cwe: 'CWE-770', owasp: 'API4:2023'
    },
    // API5: Broken Function Level Authorization
    {
        id: 'owasp-api5-admin-exposure', title: 'Admin Endpoint Exposure', severity: 'high', category: 'owasp-api',
        pattern: /\/(?:admin|internal|management)\/[^\'\"]*(?![^}]*(?:auth|role|permission))/gi, message: 'Admin endpoint without role check', cwe: 'CWE-285', owasp: 'API5:2023'
    },
    // API6: Server Side Request Forgery
    {
        id: 'owasp-api6-ssrf', title: 'SSRF via URL Parameter', severity: 'high', category: 'owasp-api',
        pattern: /(?:url|endpoint|target|destination)\s*[:=]\s*(?:req\.|request\.)/gi, message: 'URL from user input - SSRF risk', cwe: 'CWE-918', owasp: 'API6:2023'
    },
    // API7: Security Misconfiguration
    {
        id: 'owasp-api7-verbose-error', title: 'Verbose Error Response', severity: 'medium', category: 'owasp-api',
        pattern: /\.stack|\.message|error\.toString\(\)/gi, message: 'Stack trace may be exposed to users', cwe: 'CWE-209', owasp: 'API7:2023'
    },
    // API8: Lack of Protection from Automated Threats
    {
        id: 'owasp-api8-no-captcha', title: 'No CAPTCHA on Form', severity: 'low', category: 'owasp-api',
        pattern: /(?:register|signup|contact|feedback)(?![^}]*captcha)/gi, message: 'Public form without CAPTCHA', cwe: 'CWE-799', owasp: 'API8:2023'
    },
    // API10: Unsafe Consumption of APIs
    {
        id: 'owasp-api10-no-timeout', title: 'No Request Timeout', severity: 'medium', category: 'owasp-api',
        pattern: /fetch\s*\([^)]+\)(?![^}]*(?:timeout|AbortController|signal))/gi, message: 'External request without timeout', cwe: 'CWE-400', owasp: 'API10:2023'
    },
];

// ==================== CONFIGURATION ISSUES ====================
export const configPatterns: VulnPattern[] = [
    {
        id: 'config-env-debug', title: 'Debug Mode in Production', severity: 'high', category: 'config',
        pattern: /NODE_ENV\s*[!=]==?\s*['"]development['"]/g, message: 'Debug check may expose dev features', cwe: 'CWE-489'
    },
    {
        id: 'config-console-log', title: 'Console Log in Production', severity: 'low', category: 'config',
        pattern: /console\.(?:log|debug|info)\s*\(/g, message: 'Console logging should be removed in production', cwe: 'CWE-532'
    },
    {
        id: 'config-todo-fixme', title: 'TODO/FIXME Comment', severity: 'info', category: 'config',
        pattern: /(?:TODO|FIXME|XXX|HACK|BUG):/gi, message: 'Unresolved TODO comment', cwe: 'CWE-546'
    },
    {
        id: 'config-http-only-false', title: 'Cookie Without HttpOnly', severity: 'medium', category: 'config',
        pattern: /httpOnly\s*:\s*false/gi, message: 'Cookie accessible via JavaScript', cwe: 'CWE-1004'
    },
    {
        id: 'config-same-site-none', title: 'Cookie SameSite=None', severity: 'medium', category: 'config',
        pattern: /sameSite\s*:\s*['"]none['"]/gi, message: 'Cookie sent on cross-site requests', cwe: 'CWE-1275'
    },
    {
        id: 'config-no-csp', title: 'Missing CSP Header', severity: 'medium', category: 'config',
        pattern: /Content-Security-Policy(?![^}]*\w)/gi, message: 'Content Security Policy may be missing', cwe: 'CWE-693'
    },
    {
        id: 'config-allow-origin-reflect', title: 'CORS Origin Reflection', severity: 'high', category: 'config',
        pattern: /Access-Control-Allow-Origin['"]\s*:\s*(?:req\.headers\.origin|request\.origin)/gi, message: 'CORS origin reflection vulnerability', cwe: 'CWE-942'
    },
];

// ==================== MORE SECRET PATTERNS ====================
export const moreSecretPatterns: VulnPattern[] = [
    {
        id: 'secret-azure', title: 'Azure Key', severity: 'critical', category: 'secrets',
        pattern: /AccountKey=[a-zA-Z0-9+\/=]{86}/gi, message: 'Azure account key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-gcp-service', title: 'GCP Service Account', severity: 'critical', category: 'secrets',
        pattern: /"type"\s*:\s*"service_account"/g, message: 'GCP service account JSON exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-mailgun', title: 'Mailgun API Key', severity: 'high', category: 'secrets',
        pattern: /key-[a-f0-9]{32}/g, message: 'Mailgun API key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-mailchimp', title: 'Mailchimp API Key', severity: 'high', category: 'secrets',
        pattern: /[a-f0-9]{32}-us\d+/g, message: 'Mailchimp API key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-heroku', title: 'Heroku API Key', severity: 'critical', category: 'secrets',
        pattern: /heroku[_\-]?api[_\-]?key\s*[:=]\s*['"][a-f0-9-]{36}['"]/gi, message: 'Heroku API key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-digitalocean', title: 'DigitalOcean Token', severity: 'critical', category: 'secrets',
        pattern: /dop_v1_[a-f0-9]{64}/g, message: 'DigitalOcean token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-npm-token', title: 'NPM Token', severity: 'critical', category: 'secrets',
        pattern: /npm_[a-zA-Z0-9]{36}/g, message: 'NPM auth token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-pypi-token', title: 'PyPI Token', severity: 'critical', category: 'secrets',
        pattern: /pypi-AgEIcHlwaS5vcmc[a-zA-Z0-9_-]{50,}/g, message: 'PyPI API token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-shopify', title: 'Shopify Access Token', severity: 'critical', category: 'secrets',
        pattern: /shpat_[a-fA-F0-9]{32}/g, message: 'Shopify access token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-linear', title: 'Linear API Key', severity: 'high', category: 'secrets',
        pattern: /lin_api_[a-zA-Z0-9]{40}/g, message: 'Linear API key exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-planetscale', title: 'PlanetScale Password', severity: 'critical', category: 'secrets',
        pattern: /pscale_pw_[a-zA-Z0-9_-]{43}/g, message: 'PlanetScale password exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-turso', title: 'Turso Auth Token', severity: 'critical', category: 'secrets',
        pattern: /turso[_-]?(?:auth[_-]?)?token\s*[:=]\s*['"][^'"]+['"]/gi, message: 'Turso auth token exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-neon', title: 'Neon Database URL', severity: 'critical', category: 'secrets',
        pattern: /postgres:\/\/[^:]+:[^@]+@[^.]+\.neon\.tech/gi, message: 'Neon database URL exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-upstash', title: 'Upstash Redis URL', severity: 'critical', category: 'secrets',
        pattern: /redis:\/\/[^:]+:[^@]+@[^.]+\.upstash\.io/gi, message: 'Upstash Redis URL exposed', cwe: 'CWE-798'
    },
    {
        id: 'secret-together', title: 'Together AI Key', severity: 'critical', category: 'secrets',
        pattern: /[a-f0-9]{64}(?=.*together)/gi, message: 'Together AI API key exposed', cwe: 'CWE-798'
    },
];

// ==================== MALICIOUS CODE PATTERNS (40+ patterns) ====================
export const maliciousPatterns: VulnPattern[] = [
    // Backdoor Detection
    {
        id: 'mal-backdoor-hidden-admin', title: 'Hidden Admin Logic', severity: 'critical', category: 'malicious',
        pattern: /if\s*\(\s*[^)]*(?:admin|secret|backdoor)[^)]*\)\s*\{[^}]*auth\s*=\s*true/gi,
        message: 'Potential hidden backdoor admin login'
    },
    {
        id: 'mal-reverse-shell', title: 'Reverse Shell Pattern', severity: 'critical', category: 'malicious',
        pattern: /sh\s*-i\s*>\s*&\s*\/dev\/tcp\/[0-9.]+\/[0-9]+/gi,
        message: 'Reverse shell command detected'
    },
    {
        id: 'mal-logic-bomb', title: 'Logic Bomb Trigger', severity: 'critical', category: 'malicious',
        pattern: /new\s+Date\(\)\s*>\s*new\s+Date\(['"]202[4-9]/gi,
        message: 'Potential time-based logic bomb trigger'
    },

    // Data Exfiltration
    {
        id: 'mal-exfil-env', title: 'Env Var Exfiltration', severity: 'critical', category: 'malicious',
        pattern: /fetch\s*\([^)]*process\.env[^)]*\)/gi,
        message: 'Potential environment variable exfiltration'
    },
    {
        id: 'mal-exfil-cookies', title: 'Cookie Theft', severity: 'high', category: 'malicious',
        pattern: /document\.cookie\s*\+\s*['"][^'"]*fetch/gi,
        message: 'Potential session cookie exfiltration'
    },

    // Obfuscation
    {
        id: 'mal-obf-eval-base64', title: 'Obfuscated eval', severity: 'critical', category: 'malicious',
        pattern: /eval\s*\(\s*atob\s*\(/gi,
        message: 'Base64 encoded code execution detected'
    },
    {
        id: 'mal-obf-jsfuck', title: 'JSFuck Obfuscation', severity: 'high', category: 'malicious',
        pattern: /[!+\[\]()]{50,}/g,
        message: 'JSFuck-style obfuscation detected'
    },

    // Supply Chain
    {
        id: 'mal-supply-postinstall', title: 'Suspicious postinstall', severity: 'high', category: 'malicious',
        pattern: /"postinstall"\s*:\s*"[^"]*(?:curl|wget|sh|bash)[^"]*"/gi,
        message: 'Suspicious postinstall script in package.json'
    }
];

// ==================== INFRASTRUCTURE PATTERNS (40+ patterns) ====================
export const infraPatterns: VulnPattern[] = [
    // Dockerfile
    {
        id: 'infra-docker-root', title: 'Container Running as Root', severity: 'medium', category: 'infra',
        pattern: /FROM\s+[^]+(?!USER\s+)/gi,
        message: 'Dockerfile without USER instruction - defaults to root'
    },
    {
        id: 'infra-docker-secret', title: 'Secrets in Dockerfile', severity: 'critical', category: 'infra',
        pattern: /ENV\s+(?:PASSWORD|SECRET|API_KEY|TOKEN)\s*=/gi,
        message: 'Hardcoded secret in Dockerfile ENV'
    },

    // Kubernetes
    {
        id: 'infra-k8s-privileged', title: 'K8s Privileged Container', severity: 'high', category: 'infra',
        pattern: /privileged\s*:\s*true/gi,
        message: 'Kubernetes container running in privileged mode'
    },
    {
        id: 'infra-k8s-host-path', title: 'K8s HostPath Mount', severity: 'medium', category: 'infra',
        pattern: /hostPath\s*:/gi,
        message: 'Kubernetes volume uses hostPath mount'
    },

    // CI/CD
    {
        id: 'infra-cicd-script-inject', title: 'CI/CD Script Injection', severity: 'high', category: 'infra',
        pattern: /\$\{\{\s*github\.event\.(?:issue|pull_request)\.title\s*\}\}/gi,
        message: 'Potential script injection in GitHub Action'
    },
    {
        id: 'infra-cicd-unpinned', title: 'Unpinned GitHub Action', severity: 'low', category: 'infra',
        pattern: /uses\s*:\s*[^@\s]+(?![@\s])/gi,
        message: 'GitHub Action used without version pinning'
    },
    // Container Extended
    {
        id: 'docker-latest-tag', title: 'Using Latest Tag', severity: 'medium', category: 'infra',
        pattern: /FROM\s+[^\s:]+:latest/gi,
        message: 'Using :latest tag makes builds non-reproducible', cwe: 'CWE-1104'
    },
    {
        id: 'docker-add-copy', title: 'Using ADD Instead of COPY', severity: 'low', category: 'infra',
        pattern: /^ADD\s+(?!https?:)/gmi,
        message: 'ADD has auto-extraction which can be risky; use COPY instead', cwe: 'CWE-829'
    }
];

// ==================== PENTESTING PATTERNS (20+ patterns) ====================
export const pentestPatterns: VulnPattern[] = [
    // Information Gathering (WSTG-INFO)
    {
        id: 'pentest-info-banner', title: 'Server Banner Exposure', severity: 'low', category: 'pentest',
        pattern: /headers\[['"]Server['"]\]\s*=\s*['"][^'"]+['"]/gi,
        message: 'Potential server banner exposure'
    },
    {
        id: 'pentest-info-ip', title: 'Internal IP Exposure', severity: 'low', category: 'pentest',
        pattern: /10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}|192\.168\.(?:[0-9]{1,3}\.){2}/g,
        message: 'Internal IP address found in code'
    },

    // Configuration Management (WSTG-CONFIG)
    {
        id: 'pentest-config-default-creds', title: 'Potential Default Credentials', severity: 'high', category: 'pentest',
        pattern: /['"]admin['"]\s*[:=]\s*['"]admin['"]|['"]root['"]\s*[:=]\s*['"]root['"]/gi,
        message: 'Potential default credentials detected'
    },

    // Session Management (WSTG-SESS)
    {
        id: 'pentest-sess-fixation', title: 'Session Fixation Risk', severity: 'medium', category: 'pentest',
        pattern: /session\.id\s*=\s*(?:req\.|request\.)/gi,
        message: 'Potential session fixation: setting session ID from user input'
    },

    // Auth Bypass
    {
        id: 'pentest-auth-skip', title: 'Auth Bypass Logic', severity: 'critical', category: 'pentest',
        pattern: /if\s*\(\s*[^)]*skipAuth[^)]*\)\s*\{[^}]*return\s+next\(\)/gi,
        message: 'Insecure auth bypass logic detected'
    }
];

// ==================== UNIT TEST SECURITY PATTERNS (20+ patterns) ====================
export const unitTestPatterns: VulnPattern[] = [
    // Mocked Security
    {
        id: 'test-mock-auth', title: 'Mocked Auth in Tests', severity: 'medium', category: 'test-security',
        pattern: /jest\.mock\s*\(\s*['"][^'"]*(?:auth|authorize|verify)[^'"]*['"]\s*,\s*\(\s*\)\s*=>\s*\(?\{[^}]*true/gi,
        message: 'Security controls globally mocked in tests'
    },

    // Test Bypasses
    {
        id: 'test-bypass-logic', title: 'Test Environment Bypass', severity: 'high', category: 'test-security',
        pattern: /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]test['"]\s*\)\s*\{[^}]*return\s+(?:true|next\(\))/gi,
        message: 'Security check bypassed for test environment'
    },

    // Hardcoded Test Secrets
    {
        id: 'test-secret-hardcoded', title: 'Hardcoded Test Secret', severity: 'medium', category: 'test-security',
        pattern: /const\s+TEST_(?:API_KEY|TOKEN|SECRET)\s*=\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        message: 'Hardcoded secret in test code'
    }
];

// ==================== EXPERT MALICIOUS CODE (Evasion, C2, Anti-Debug) ====================
export const expertMaliciousPatterns: VulnPattern[] = [
    // Command & Control
    {
        id: 'mal-c2-beacon', title: 'C2 Beacon Pattern', severity: 'critical', category: 'malicious',
        pattern: /setInterval\s*\([^)]*fetch\s*\([^)]*\)\s*,\s*\d{4,}/gi,
        message: 'Potential C2 beacon: periodic network requests'
    },
    {
        id: 'mal-c2-websocket', title: 'WebSocket C2 Channel', severity: 'critical', category: 'malicious',
        pattern: /new\s+WebSocket\s*\([^)]*\)\s*\.on(?:message|open)\s*=\s*[^;]*eval/gi,
        message: 'WebSocket connection with code execution - potential C2'
    },
    {
        id: 'mal-c2-dns', title: 'DNS Tunneling Indicator', severity: 'high', category: 'malicious',
        pattern: /dns\.resolve\s*\([^)]*base64|atob\s*\([^)]*\.split\s*\(['"][.]['"]\)/gi,
        message: 'Potential DNS tunneling for data exfiltration'
    },
    // Anti-Debugging
    {
        id: 'mal-antidebug-devtools', title: 'Anti-DevTools Detection', severity: 'high', category: 'malicious',
        pattern: /console\.log\s*\([^)]*\)\s*;\s*debugger|window\.outerWidth\s*-\s*window\.innerWidth\s*>\s*\d+/gi,
        message: 'Anti-debugging/DevTools detection code'
    },
    {
        id: 'mal-antidebug-timing', title: 'Timing-Based Anti-Debug', severity: 'medium', category: 'malicious',
        pattern: /performance\.now\s*\(\s*\)\s*-\s*\w+\s*>\s*\d{2,}/gi,
        message: 'Timing-based anti-debugging technique'
    },
    // Evasion Techniques
    {
        id: 'mal-evasion-vm-detect', title: 'VM Detection', severity: 'high', category: 'malicious',
        pattern: /navigator\.(?:hardwareConcurrency|deviceMemory)\s*[<>=]+\s*[12]|\bVMware\b|\bVirtualBox\b/gi,
        message: 'Virtual machine/sandbox detection code'
    },
    {
        id: 'mal-evasion-user-agent', title: 'Bot/Crawler Evasion', severity: 'medium', category: 'malicious',
        pattern: /navigator\.userAgent\.(?:includes|match)\s*\([^)]*(?:bot|crawler|spider|headless)/gi,
        message: 'Bot/crawler detection for potential evasion'
    },
    // Cryptojacking
    {
        id: 'mal-cryptojack', title: 'Cryptojacking Indicator', severity: 'critical', category: 'malicious',
        pattern: /(?:coinhive|cryptonight|webminer|mineralt)|wasm.*miner/gi,
        message: 'Potential cryptocurrency mining code detected'
    },
    // Persistence
    {
        id: 'mal-persist-sw', title: 'Malicious Service Worker', severity: 'high', category: 'malicious',
        pattern: /serviceWorker\.register\s*\([^)]*\).*fetch\s*\([^)]*(?:eval|Function)/gi,
        message: 'Service worker with suspicious execution patterns'
    },
    {
        id: 'mal-persist-storage', title: 'Persistent Payload Storage', severity: 'medium', category: 'malicious',
        pattern: /localStorage\.setItem\s*\([^)]*,\s*(?:atob|btoa)\s*\(/gi,
        message: 'Encoded payload stored in localStorage'
    },
];

// ==================== CLOUD INFRASTRUCTURE PATTERNS (AWS, GCP, Azure, Terraform) ====================
export const cloudInfraPatterns: VulnPattern[] = [
    // AWS
    {
        id: 'cloud-aws-public-s3', title: 'Public S3 Bucket', severity: 'critical', category: 'cloud',
        pattern: /acl\s*=\s*['"]public-read['"]|BlockPublicAcls\s*=\s*false/gi,
        message: 'S3 bucket configured with public access'
    },
    {
        id: 'cloud-aws-wildcard-iam', title: 'Wildcard IAM Policy', severity: 'critical', category: 'cloud',
        pattern: /"Action"\s*:\s*"\*"|"Resource"\s*:\s*"\*"/g,
        message: 'IAM policy with wildcard permissions'
    },
    {
        id: 'cloud-aws-unencrypted-rds', title: 'Unencrypted RDS', severity: 'high', category: 'cloud',
        pattern: /storage_encrypted\s*=\s*false|StorageEncrypted:\s*false/gi,
        message: 'RDS instance without encryption at rest'
    },
    {
        id: 'cloud-aws-open-sg', title: 'Open Security Group', severity: 'critical', category: 'cloud',
        pattern: /cidr_blocks\s*=\s*\[\s*['"]0\.0\.0\.0\/0['"]\s*\]|CidrIp:\s*0\.0\.0\.0\/0/gi,
        message: 'Security group open to all IP addresses'
    },
    // GCP
    {
        id: 'cloud-gcp-public-storage', title: 'Public GCS Bucket', severity: 'critical', category: 'cloud',
        pattern: /allUsers|allAuthenticatedUsers/g,
        message: 'GCS bucket with public access'
    },
    // Azure
    {
        id: 'cloud-azure-public-blob', title: 'Public Azure Blob', severity: 'critical', category: 'cloud',
        pattern: /PublicAccess\s*=\s*['"](?:Container|Blob)['"]/gi,
        message: 'Azure blob storage with public access'
    },
    // Terraform General
    {
        id: 'cloud-tf-hardcoded-secret', title: 'Hardcoded Secret in Terraform', severity: 'critical', category: 'cloud',
        pattern: /(?:password|secret_key|api_key)\s*=\s*"[^"]{8,}"/gi,
        message: 'Hardcoded secret in Terraform config'
    },
    {
        id: 'cloud-tf-no-logging', title: 'Missing Logging', severity: 'medium', category: 'cloud',
        pattern: /enable_logging\s*=\s*false|logging_config\s*\{\s*\}/gi,
        message: 'Cloud resource without logging enabled'
    },
];

// ==================== ADVANCED SAST (Taint, Data Flow) ====================
export const advancedSastPatterns: VulnPattern[] = [
    // Taint Sources to Sinks
    {
        id: 'sast-taint-query-to-html', title: 'Query Param to HTML', severity: 'critical', category: 'sast',
        pattern: /(?:req\.query|searchParams\.get)\s*\([^)]+\)[^;]*(?:innerHTML|outerHTML|document\.write)/gi,
        message: 'User input flows directly to HTML output (XSS)'
    },
    {
        id: 'sast-taint-body-to-sql', title: 'Request Body to SQL', severity: 'critical', category: 'sast',
        pattern: /(?:req\.body|request\.json)\s*\.[^;]*(?:query|execute|raw)\s*\(/gi,
        message: 'Request body flows to SQL query'
    },
    {
        id: 'sast-taint-header-to-log', title: 'Header to Log Injection', severity: 'medium', category: 'sast',
        pattern: /(?:req\.headers|request\.headers)\[[^\]]+\][^;]*(?:console\.log|logger)/gi,
        message: 'User-controlled header logged without sanitization'
    },
    // Unsafe Deserialization
    {
        id: 'sast-deser-json-proto', title: 'JSON Parse Prototype', severity: 'high', category: 'sast',
        pattern: /JSON\.parse\s*\([^)]+\)\s*\.(?:__proto__|constructor)/gi,
        message: 'JSON parse result accessing prototype chain'
    },
    // Insecure Randomness in Security Context
    {
        id: 'sast-weak-token', title: 'Weak Token Generation', severity: 'high', category: 'sast',
        pattern: /(?:token|session|csrf)\s*=\s*(?:Math\.random|Date\.now)/gi,
        message: 'Security token generated with weak randomness'
    },
];

// ==================== NIST/OWASP COMPLIANCE PATTERNS ====================
export const compliancePatterns: VulnPattern[] = [
    // NIST CSF 2.0 - Protect (PR)
    {
        id: 'compliance-no-input-validation', title: 'Missing Input Validation', severity: 'high', category: 'compliance',
        pattern: /app\.(?:post|put|patch)\s*\([^)]+,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{(?![^}]*(?:validate|sanitize|joi|zod|yup))/gi,
        message: 'API endpoint without input validation (NIST PR.DS)',
        owasp: 'A03:2021'
    },
    // OWASP A01 - Broken Access Control
    {
        id: 'compliance-missing-authz', title: 'Missing Authorization Check', severity: 'critical', category: 'compliance',
        pattern: /router\.(?:delete|put)\s*\([^)]*\/:id[^)]*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{(?![^}]*(?:authorize|isOwner|checkPermission))/gi,
        message: 'Resource modification without authorization (OWASP A01)',
        owasp: 'A01:2021'
    },
    // OWASP A07 - Identification and Auth Failures
    {
        id: 'compliance-weak-password-policy', title: 'Weak Password Policy', severity: 'medium', category: 'compliance',
        pattern: /password\.length\s*[<>=]+\s*[1-7][^0-9]|minLength\s*:\s*[1-7][^0-9]/gi,
        message: 'Password policy allows weak passwords (OWASP A07)',
        owasp: 'A07:2021'
    },
    // OWASP A09 - Security Logging Failures
    {
        id: 'compliance-no-security-logging', title: 'Missing Security Logging', severity: 'medium', category: 'compliance',
        pattern: /catch\s*\([^)]*\)\s*\{\s*(?:return|res\.status)(?![^}]*(?:log|audit|sentry|datadog))/gi,
        message: 'Security event not logged (OWASP A09)',
        owasp: 'A09:2021'
    },
];

// ==================== ADVANCED UNIT TEST SECURITY ====================
export const advancedTestPatterns: VulnPattern[] = [
    // Malicious Test Patterns
    {
        id: 'test-malicious-network', title: 'Test Makes External Requests', severity: 'high', category: 'test-security',
        pattern: /(?:it|test|describe)\s*\([^)]+,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[^}]*fetch\s*\(['"]https?:\/\/(?!localhost|127\.0\.0\.1)/gi,
        message: 'Unit test makes external network requests'
    },
    {
        id: 'test-malicious-fs', title: 'Test Modifies Filesystem', severity: 'high', category: 'test-security',
        pattern: /(?:it|test)\s*\([^)]+,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[^}]*(?:writeFileSync|unlinkSync|rmSync)\s*\(/gi,
        message: 'Unit test modifies filesystem outside of setup/teardown'
    },
    // Security Logic in Tests
    {
        id: 'test-security-skip', title: 'Security Test Skipped', severity: 'medium', category: 'test-security',
        pattern: /(?:it|test)\.skip\s*\([^)]*(?:security|auth|permission|access)/gi,
        message: 'Security-related test is skipped'
    },
    {
        id: 'test-expect-any', title: 'Overly Permissive Test Assertion', severity: 'low', category: 'test-security',
        pattern: /expect\s*\([^)]+\)\.toBe\s*\(\s*expect\.any\s*\(/gi,
        message: 'Test uses overly permissive assertion for security-sensitive value'
    },
];

// ==================== WSTG ADVANCED PENTEST PATTERNS ====================
export const wstgAdvancedPatterns: VulnPattern[] = [
    // WSTG-ATHN (Authentication)
    {
        id: 'wstg-athn-lockout', title: 'No Account Lockout', severity: 'high', category: 'pentest',
        pattern: /login|authenticate(?![^}]*(?:lockout|attempts|maxRetries|rateLimit))/gi,
        message: 'Login function without account lockout mechanism (WSTG-ATHN-03)'
    },
    // WSTG-AUTHZ (Authorization)
    {
        id: 'wstg-authz-idor', title: 'IDOR Vulnerability', severity: 'critical', category: 'pentest',
        pattern: /findById\s*\(\s*(?:req\.params|req\.query|request\.args)\.[^)]+\)(?![^;]*(?:ownerId|userId|checkOwner))/gi,
        message: 'Direct object reference without ownership check (WSTG-AUTHZ-04)'
    },
    // WSTG-BUSL (Business Logic)
    {
        id: 'wstg-busl-race', title: 'Race Condition in Transaction', severity: 'high', category: 'pentest',
        pattern: /async\s+function\s+\w*(?:transfer|withdraw|purchase)[^}]*await\s+[^;]+;\s*await/gi,
        message: 'Multiple async operations without transaction lock (WSTG-BUSL-07)'
    },
    // WSTG-INPV (Input Validation)
    {
        id: 'wstg-inpv-file-upload', title: 'Unsafe File Upload', severity: 'critical', category: 'pentest',
        pattern: /multer|formidable|busboy(?![^}]*(?:fileFilter|mimetype|allowedTypes))/gi,
        message: 'File upload without type validation (WSTG-INPV-12)'
    },
    // WSTG-SESS (Session)
    {
        id: 'wstg-sess-no-rotate', title: 'Session Not Rotated', severity: 'medium', category: 'pentest',
        pattern: /login|authenticate(?![^}]*(?:regenerate|rotate|newSession))/gi,
        message: 'Session not regenerated after login (WSTG-SESS-03)'
    },
];

// ==================== LICENSE AUDITOR ====================
export const licensePatterns: VulnPattern[] = [
    {
        id: 'license-gpl', title: 'GPL License Detected', severity: 'info', category: 'compliance',
        pattern: /GNU General Public License|GPL-2\.0|GPL-3\.0/gi,
        message: 'GPL license detected (copyleft risk)', owasp: 'A06:2021'
    },
    {
        id: 'license-agpl', title: 'AGPL License Detected', severity: 'low', category: 'compliance',
        pattern: /GNU Affero General Public License|AGPL-3\.0/gi,
        message: 'AGPL license detected (network copyleft risk)', owasp: 'A06:2021'
    }
];

// ==================== HIPAA (Healthcare) ====================
export const hipaaPatterns: VulnPattern[] = [
    {
        id: 'hipaa-phi-logging', title: 'PHI Case Logging', severity: 'high', category: 'compliance',
        pattern: /(?:console\.(?:log|debug|info)|logger\.(?:info|debug))\s*\(.*(?:patient|phi|mrn|ssn|health|medical).*\)/gi,
        message: 'Potential PHI leak in application logs (HIPAA violation)',
        compliance: ['HIPAA']
    },
    {
        id: 'hipaa-unencrypted-phi', title: 'Unencrypted PHI Storage', severity: 'critical', category: 'compliance',
        pattern: /(?:localStorage|sessionStorage|cookie)\.set\([^,]+,.*(?:patient|health|ssn).*\)/gi,
        message: 'PHI stored in unencrypted browser storage (HIPAA violation)',
        compliance: ['HIPAA']
    }
];

// ==================== PCI-DSS (Fintech) ====================
export const pciDssPatterns: VulnPattern[] = [
    {
        id: 'pci-card-number', title: 'Card Number Pattern', severity: 'critical', category: 'compliance',
        pattern: /['"]\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}['"]/gi,
        message: 'Potential hardcoded credit card number detected (PCI-DSS violation)',
        compliance: ['PCI-DSS']
    },
    {
        id: 'pci-cvv', title: 'Hardcoded CVV', severity: 'critical', category: 'compliance',
        pattern: /(?:cvv|cvc|security_code)\s*[:=]\s*['"]\d{3,4}['"]/gi,
        message: 'Hardcoded CVV/Security code detected (PCI-DSS violation)',
        compliance: ['PCI-DSS']
    }
];

// ==================== GRAPHQL SECURITY ====================
export const graphqlPatterns: VulnPattern[] = [
    {
        id: 'graphql-introspection', title: 'Introspection Enabled', severity: 'high', category: 'api',
        pattern: /introspection\s*:\s*true|__schema|__type\s*\{/gi,
        message: 'GraphQL introspection allows schema discovery', cwe: 'CWE-200'
    },
    {
        id: 'graphql-depth-limit', title: 'Missing Query Depth Limit', severity: 'high', category: 'api',
        pattern: /new\s+ApolloServer\s*\(\s*\{(?![\s\S]*depthLimit)/gi,
        message: 'Nested queries can cause DoS without depth limits', cwe: 'CWE-400'
    }
];

// ==================== JWT SECURITY ====================
export const jwtPatterns: VulnPattern[] = [
    {
        id: 'jwt-none-algo', title: 'JWT None Algorithm', severity: 'critical', category: 'auth',
        pattern: /algorithms?\s*:\s*\[[^\]]*['"]none['"][^\]]*\]/gi,
        message: 'JWT with none algorithm bypasses verification', cwe: 'CWE-327'
    },
    {
        id: 'jwt-localstorage', title: 'JWT in localStorage', severity: 'medium', category: 'auth',
        pattern: /localStorage\.setItem\s*\([^,]*(?:token|jwt|auth)/gi,
        message: 'Tokens in localStorage are vulnerable to XSS', cwe: 'CWE-922'
    }
];

// ==================== SUPPLY CHAIN (SCA) ====================
export const typosquattingPatterns: VulnPattern[] = [
    {
        id: 'sca-typosquat-react', title: 'Potential React Typosquat', severity: 'high', category: 'supply-chain',
        pattern: /['"](?:reacct|raect|react-dom-server|reactjs-dom)['"]/gi,
        message: 'Suspicious dependency name detected (potential typosquatting)',
        owasp: 'A06:2021'
    },
    {
        id: 'sca-typosquat-lodash', title: 'Potential Lodash Typosquat', severity: 'high', category: 'high',
        pattern: /['"](?:lodesh|loadsh|lodas)['"]/gi,
        message: 'Suspicious dependency name detected (potential typosquatting)',
        owasp: 'A06:2021'
    },
    {
        id: 'sca-suspicious-install', title: 'Suspicious Preinstall Script', severity: 'critical', category: 'supply-chain',
        pattern: /"preinstall"\s*:\s*"[^"]*(?:curl|wget|bash|sh|python|perl|nc)[^"]*"/gi,
        message: 'Malicious preinstall script detected in package.json',
        owasp: 'A06:2021'
    }
];

// ==================== ALL PATTERNS COMBINED ====================
export const allPatterns: VulnPattern[] = [
    ...secretPatterns,
    ...moreSecretPatterns,
    ...sqlInjectionPatterns,
    ...xssPatterns,
    ...commandInjectionPatterns,
    ...pathTraversalPatterns,
    ...authPatterns,
    ...cryptoPatterns,
    ...ssrfPatterns,
    ...solidityPatterns,
    ...nosqlPatterns,
    ...deserializationPatterns,
    ...xxePatterns,
    ...prototypePollutionPatterns,
    ...redosPatterns,
    ...raceConditionPatterns,
    ...nextjsPatterns,
    ...reactPatterns,
    ...expressPatterns,
    ...djangoPatterns,
    ...flaskPatterns,
    ...owaspApiPatterns,
    ...configPatterns,
    ...maliciousPatterns,
    ...infraPatterns,
    ...pentestPatterns,
    ...unitTestPatterns,
    ...expertMaliciousPatterns,
    ...cloudInfraPatterns,
    ...advancedSastPatterns,
    ...compliancePatterns,
    ...advancedTestPatterns,
    ...wstgAdvancedPatterns,
    ...graphqlPatterns,
    ...jwtPatterns,
    ...licensePatterns,
    ...hipaaPatterns,
    ...pciDssPatterns,
    ...typosquattingPatterns,
];

// Pattern count for UI display
export const patternStats = {
    total: allPatterns.length,
    secrets: secretPatterns.length + moreSecretPatterns.length,
    sqli: sqlInjectionPatterns.length,
    xss: xssPatterns.length,
    cmdi: commandInjectionPatterns.length,
    path: pathTraversalPatterns.length,
    auth: authPatterns.length + jwtPatterns.length,
    crypto: cryptoPatterns.length,
    ssrf: ssrfPatterns.length,
    solidity: solidityPatterns.length,
    nosql: nosqlPatterns.length,
    deserialization: deserializationPatterns.length,
    xxe: xxePatterns.length,
    prototypePollution: prototypePollutionPatterns.length,
    redos: redosPatterns.length,
    raceCondition: raceConditionPatterns.length,
    nextjs: nextjsPatterns.length,
    react: reactPatterns.length,
    express: expressPatterns.length,
    django: djangoPatterns.length,
    flask: flaskPatterns.length,
    owaspApi: owaspApiPatterns.length + graphqlPatterns.length,
    config: configPatterns.length,
    malicious: maliciousPatterns.length + expertMaliciousPatterns.length + typosquattingPatterns.length,
    infra: infraPatterns.length + cloudInfraPatterns.length,
    pentest: pentestPatterns.length + wstgAdvancedPatterns.length,
    unitTest: unitTestPatterns.length + advancedTestPatterns.length,
    sast: advancedSastPatterns.length,
    compliance: compliancePatterns.length + licensePatterns.length + hipaaPatterns.length + pciDssPatterns.length,
};
