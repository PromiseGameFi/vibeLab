/**
 * Stage 1: Reconnaissance
 * Parse the contract BEFORE AI sees it to extract structured context.
 * This gives the AI much better information to work with.
 */

export interface FunctionInfo {
    name: string;
    visibility: 'public' | 'external' | 'internal' | 'private';
    mutability: 'payable' | 'nonpayable' | 'view' | 'pure';
    modifiers: string[];
    parameters: string[];
    returns: string[];
    lineStart: number;
    lineEnd: number;
    hasExternalCall: boolean;
    hasStateChange: boolean;
    hasEthTransfer: boolean;
}

export interface StateVariable {
    name: string;
    type: string;
    visibility: 'public' | 'private' | 'internal';
    isMutable: boolean;      // false if immutable/constant
    isMapping: boolean;
    lineNumber: number;
}

export interface ExternalCall {
    target: string;           // What's being called
    method: string;           // .call, .transfer, .send, .delegatecall, or function name
    line: number;
    inFunction: string;       // Which function contains this call
    valueAttached: boolean;   // Has {value: ...}
}

export interface ImportInfo {
    path: string;
    symbols: string[];        // Specific imports, or ['*'] for wildcard
    line: number;
}

export interface ContractRecon {
    name: string;
    filename: string;
    solidityVersion: string;
    inherits: string[];
    functions: FunctionInfo[];
    stateVariables: StateVariable[];
    externalCalls: ExternalCall[];
    imports: ImportInfo[];
    modifiers: string[];
    events: string[];
    hasReceiveOrFallback: boolean;
    hasSelfdestruct: boolean;
    hasDelegatecall: boolean;
    usesAssembly: boolean;
    ethFlowSummary: string;   // Human-readable summary of how ETH moves
    attackSurface: string[];  // Top-level summary for the AI
}

// ─── Regex patterns ─────────────────────────────────────────────────

const PRAGMA_RE = /pragma\s+solidity\s+([^;]+);/;
const CONTRACT_RE = /contract\s+(\w+)(?:\s+is\s+([^{]+))?\s*\{/;
const FUNCTION_RE = /function\s+(\w+)\s*\(([^)]*)\)\s*((?:public|external|internal|private)?)\s*((?:payable|view|pure)?)\s*([^{]*)\{/g;
const STATE_VAR_RE = /^\s*(mapping\s*\([^)]+\)|[\w\[\]]+)\s+(public|private|internal)?\s*(immutable|constant)?\s+(\w+)\s*[;=]/gm;
const EXTERNAL_CALL_RE = /(\w+)\.(call|delegatecall|staticcall|transfer|send)\s*[({]/g;
const LOW_LEVEL_CALL_RE = /\.call\s*(\{[^}]*\})?\s*\(/g;
const IMPORT_RE = /import\s+(?:\{([^}]+)\}\s+from\s+)?["']([^"']+)["'];/g;
const MODIFIER_DEF_RE = /modifier\s+(\w+)/g;
const EVENT_RE = /event\s+(\w+)\s*\(/g;
const MODIFIER_USE_RE = /\)\s*((?:\w+(?:\([^)]*\))?\s*)+)\s*(?:returns|{)/;

// ─── Main recon function ────────────────────────────────────────────

export function reconContract(code: string, filename: string): ContractRecon {
    const lines = code.split('\n');

    // Extract pragma
    const pragmaMatch = code.match(PRAGMA_RE);
    const solidityVersion = pragmaMatch ? pragmaMatch[1].trim() : 'unknown';

    // Extract contract name and inheritance
    const contractMatch = code.match(CONTRACT_RE);
    const contractName = contractMatch ? contractMatch[1] : filename.replace('.sol', '');
    const inherits = contractMatch && contractMatch[2]
        ? contractMatch[2].split(',').map(s => s.trim())
        : [];

    // Extract functions
    const functions = extractFunctions(code, lines);

    // Extract state variables
    const stateVariables = extractStateVariables(code);

    // Extract external calls
    const externalCalls = extractExternalCalls(code, lines, functions);

    // Extract imports
    const imports = extractImports(code);

    // Extract modifiers
    const modifiers: string[] = [];
    let modMatch;
    const modRe = new RegExp(MODIFIER_DEF_RE.source, 'g');
    while ((modMatch = modRe.exec(code)) !== null) {
        modifiers.push(modMatch[1]);
    }

    // Extract events
    const events: string[] = [];
    let evMatch;
    const evRe = new RegExp(EVENT_RE.source, 'g');
    while ((evMatch = evRe.exec(code)) !== null) {
        events.push(evMatch[1]);
    }

    // Check for special patterns
    const hasReceiveOrFallback = /(?:receive|fallback)\s*\(\s*\)\s*external\s*payable/.test(code);
    const hasSelfdestruct = /selfdestruct\s*\(/.test(code);
    const hasDelegatecall = /\.delegatecall\s*\(/.test(code);
    const usesAssembly = /assembly\s*\{/.test(code);

    // Build ETH flow summary
    const ethFlowSummary = buildEthFlowSummary(functions, externalCalls, hasReceiveOrFallback);

    // Build attack surface summary
    const attackSurface = buildAttackSurface(
        functions, stateVariables, externalCalls,
        hasSelfdestruct, hasDelegatecall, usesAssembly
    );

    return {
        name: contractName,
        filename,
        solidityVersion,
        inherits,
        functions,
        stateVariables,
        externalCalls,
        imports,
        modifiers,
        events,
        hasReceiveOrFallback,
        hasSelfdestruct,
        hasDelegatecall,
        usesAssembly,
        ethFlowSummary,
        attackSurface,
    };
}

// ─── Helpers ────────────────────────────────────────────────────────

function extractFunctions(code: string, lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const re = new RegExp(FUNCTION_RE.source, 'g');
    let match;

    while ((match = re.exec(code)) !== null) {
        const name = match[1];
        const params = match[2].trim();
        const visibility = (match[3] || 'public') as FunctionInfo['visibility'];
        const mutability = (match[4] || 'nonpayable') as FunctionInfo['mutability'];
        const rest = match[5] || '';

        // Find line numbers
        const charIndex = match.index;
        const lineStart = code.substring(0, charIndex).split('\n').length;

        // Find matching closing brace (simple brace counting)
        let braceCount = 1;
        let i = code.indexOf('{', charIndex) + 1;
        while (i < code.length && braceCount > 0) {
            if (code[i] === '{') braceCount++;
            if (code[i] === '}') braceCount--;
            i++;
        }
        const lineEnd = code.substring(0, i).split('\n').length;
        const body = code.substring(charIndex, i);

        // Extract modifiers from the signature
        const modifiers: string[] = [];
        const modParts = rest.split(/\s+/).filter(s =>
            s && !['returns', 'virtual', 'override', '{'].includes(s) && !s.startsWith('(')
        );
        modifiers.push(...modParts.map(m => m.replace(/\([^)]*\)/, '').trim()).filter(Boolean));

        // Check for external calls in body
        const hasExternalCall = /\.(call|delegatecall|staticcall|transfer|send)\s*[({]/.test(body);

        // Check for state changes (assignments to state vars, excluding local vars)
        const hasStateChange = /\w+\s*(\[.*?\])?\s*[+\-*/]?=\s*/.test(body) && !body.includes('memory');

        // Check for ETH transfers
        const hasEthTransfer = /\.(call|transfer|send)\s*[({]/.test(body) || /\{value:/.test(body);

        // Extract return types
        const returnsMatch = rest.match(/returns\s*\(([^)]*)\)/);
        const returns = returnsMatch ? [returnsMatch[1].trim()] : [];

        functions.push({
            name,
            visibility,
            mutability,
            modifiers,
            parameters: params ? params.split(',').map(p => p.trim()) : [],
            returns,
            lineStart,
            lineEnd,
            hasExternalCall,
            hasStateChange,
            hasEthTransfer,
        });
    }

    return functions;
}

function extractStateVariables(code: string): StateVariable[] {
    const vars: StateVariable[] = [];
    const re = new RegExp(STATE_VAR_RE.source, 'gm');
    let match;

    while ((match = re.exec(code)) !== null) {
        const type = match[1].trim();
        const visibility = (match[2] || 'internal') as StateVariable['visibility'];
        const qualifier = match[3] || '';
        const name = match[4];

        const lineNumber = code.substring(0, match.index).split('\n').length;

        vars.push({
            name,
            type,
            visibility,
            isMutable: !qualifier,
            isMapping: type.startsWith('mapping'),
            lineNumber,
        });
    }

    return vars;
}

function extractExternalCalls(code: string, lines: string[], functions: FunctionInfo[]): ExternalCall[] {
    const calls: ExternalCall[] = [];
    const re = new RegExp(EXTERNAL_CALL_RE.source, 'g');
    let match;

    while ((match = re.exec(code)) !== null) {
        const target = match[1];
        const method = match[2];
        const line = code.substring(0, match.index).split('\n').length;

        // Determine which function this call is in
        let inFunction = 'global';
        for (const fn of functions) {
            if (line >= fn.lineStart && line <= fn.lineEnd) {
                inFunction = fn.name;
                break;
            }
        }

        const valueAttached = /\{value\s*:/.test(code.substring(Math.max(0, match.index - 50), match.index + 50));

        calls.push({ target, method, line, inFunction, valueAttached });
    }

    return calls;
}

function extractImports(code: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const re = new RegExp(IMPORT_RE.source, 'g');
    let match;

    while ((match = re.exec(code)) !== null) {
        const symbols = match[1]
            ? match[1].split(',').map(s => s.trim())
            : ['*'];
        const path = match[2];
        const line = code.substring(0, match.index).split('\n').length;

        imports.push({ path, symbols, line });
    }

    return imports;
}

function buildEthFlowSummary(
    functions: FunctionInfo[],
    externalCalls: ExternalCall[],
    hasReceiveOrFallback: boolean
): string {
    const parts: string[] = [];

    const payables = functions.filter(f => f.mutability === 'payable');
    if (payables.length > 0) {
        parts.push(`ETH IN: ${payables.map(f => f.name + '()').join(', ')}`);
    }
    if (hasReceiveOrFallback) {
        parts.push('ETH IN: receive()/fallback()');
    }

    const transfers = functions.filter(f => f.hasEthTransfer);
    if (transfers.length > 0) {
        parts.push(`ETH OUT: ${transfers.map(f => f.name + '()').join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'No direct ETH flow detected';
}

function buildAttackSurface(
    functions: FunctionInfo[],
    stateVars: StateVariable[],
    externalCalls: ExternalCall[],
    hasSelfdestruct: boolean,
    hasDelegatecall: boolean,
    usesAssembly: boolean
): string[] {
    const surface: string[] = [];

    // Functions without access control that change state
    const unguarded = functions.filter(f =>
        (f.visibility === 'public' || f.visibility === 'external') &&
        f.hasStateChange &&
        f.modifiers.length === 0
    );
    if (unguarded.length > 0) {
        surface.push(`🔓 ${unguarded.length} public state-changing function(s) with NO modifiers: ${unguarded.map(f => f.name).join(', ')}`);
    }

    // Functions with external calls AND state changes (reentrancy candidates)
    const reentryRisk = functions.filter(f => f.hasExternalCall && f.hasStateChange);
    if (reentryRisk.length > 0) {
        surface.push(`🔄 ${reentryRisk.length} function(s) with external calls + state changes (reentrancy risk): ${reentryRisk.map(f => f.name).join(', ')}`);
    }

    // Payable functions
    const payables = functions.filter(f => f.mutability === 'payable');
    if (payables.length > 0) {
        surface.push(`💰 ${payables.length} payable function(s): ${payables.map(f => f.name).join(', ')}`);
    }

    // Functions with ETH transfers
    const ethOut = functions.filter(f => f.hasEthTransfer);
    if (ethOut.length > 0) {
        surface.push(`💸 ${ethOut.length} function(s) send ETH: ${ethOut.map(f => f.name).join(', ')}`);
    }

    // Mutable address state vars (potential for target manipulation)
    const mutableAddrs = stateVars.filter(v =>
        v.isMutable && (v.type.includes('address') || v.type.includes('contract'))
    );
    if (mutableAddrs.length > 0) {
        surface.push(`📍 ${mutableAddrs.length} mutable address variable(s): ${mutableAddrs.map(v => v.name).join(', ')}`);
    }

    // Dangerous features
    if (hasSelfdestruct) surface.push('💀 Uses selfdestruct');
    if (hasDelegatecall) surface.push('⚡ Uses delegatecall');
    if (usesAssembly) surface.push('🔧 Uses inline assembly');

    if (surface.length === 0) {
        surface.push('Minimal attack surface detected');
    }

    return surface;
}

/**
 * Format recon results into a context string for AI consumption.
 */
export function formatReconForAI(recon: ContractRecon): string {
    let ctx = `=== RECONNAISSANCE REPORT: ${recon.name} ===\n`;
    ctx += `Solidity ${recon.solidityVersion}`;
    if (recon.inherits.length > 0) ctx += ` | Inherits: ${recon.inherits.join(', ')}`;
    ctx += '\n\n';

    ctx += `--- ATTACK SURFACE ---\n`;
    for (const s of recon.attackSurface) ctx += `${s}\n`;
    ctx += '\n';

    ctx += `--- ETH FLOW ---\n${recon.ethFlowSummary}\n\n`;

    ctx += `--- PUBLIC/EXTERNAL FUNCTIONS ---\n`;
    for (const f of recon.functions.filter(f => f.visibility === 'public' || f.visibility === 'external')) {
        let sig = `${f.name}(${f.parameters.join(', ')})`;
        sig += ` [${f.visibility}] [${f.mutability}]`;
        if (f.modifiers.length > 0) sig += ` mods: ${f.modifiers.join(', ')}`;
        if (f.hasExternalCall) sig += ' ⚠️ EXTERNAL_CALL';
        if (f.hasEthTransfer) sig += ' 💸 ETH_TRANSFER';
        sig += ` (L${f.lineStart}-${f.lineEnd})`;
        ctx += `  ${sig}\n`;
    }
    ctx += '\n';

    ctx += `--- STATE VARIABLES ---\n`;
    for (const v of recon.stateVariables) {
        ctx += `  ${v.type} ${v.name} [${v.visibility}]${v.isMutable ? '' : ' (immutable)'}${v.isMapping ? ' (mapping)' : ''} L${v.lineNumber}\n`;
    }
    ctx += '\n';

    if (recon.externalCalls.length > 0) {
        ctx += `--- EXTERNAL CALLS ---\n`;
        for (const c of recon.externalCalls) {
            ctx += `  ${c.target}.${c.method} in ${c.inFunction}() L${c.line}${c.valueAttached ? ' {value}' : ''}\n`;
        }
        ctx += '\n';
    }

    return ctx;
}
