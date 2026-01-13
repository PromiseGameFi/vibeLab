/**
 * Shannon Entropy Scanner
 * Used to detect high-randomness strings that might be secrets, 
 * even if they don't match a specific regex pattern.
 */

export function calculateEntropy(str: string): number {
    const len = str.length;
    if (len === 0) return 0;

    const frequencies: Record<string, number> = {};
    for (const char of str) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}

export function detectHighEntropyStrings(
    content: string,
    threshold: number = 4.5,
    minLength: number = 20
): { string: string; entropy: number; line: number }[] {
    const results: { string: string; entropy: number; line: number }[] = [];
    const lines = content.split('\n');

    // Pattern to find potential strings/tokens
    // Matches sequences of alphanumeric and some special chars often found in tokens
    const potentialTokens = /['"]([a-zA-Z0-9+/=_\-\.]{16,})['"]/g;

    lines.forEach((lineText, index) => {
        let match;
        while ((match = potentialTokens.exec(lineText)) !== null) {
            const token = match[1];
            if (token.length >= minLength) {
                const entropy = calculateEntropy(token);
                if (entropy >= threshold) {
                    results.push({
                        string: token,
                        entropy: entropy,
                        line: index + 1
                    });
                }
            }
        }
    });

    return results;
}

export function getSecretStrength(entropy: number, length: number): 'weak' | 'medium' | 'strong' | 'expert' {
    const totalBits = entropy * length;
    if (totalBits < 64) return 'weak';
    if (totalBits < 128) return 'medium';
    if (totalBits < 256) return 'strong';
    return 'expert';
}
