// Universal Skills Data
// Skills that can be exported to any AI coding agent

export interface Skill {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: "frontend" | "backend" | "devops" | "testing" | "ai-ml" | "general";
    agents: ("cursor" | "claude-code" | "antigravity" | "codex" | "windsurf" | "cline")[];
    author: string;
    downloads: number;
    instructions: string[];
    examples: string[];
    rules: string[];
    createdAt: string;
}

export const skillCategories = [
    { id: "frontend", name: "Frontend", icon: "Layout" },
    { id: "backend", name: "Backend", icon: "Server" },
    { id: "devops", name: "DevOps", icon: "Container" },
    { id: "testing", name: "Testing", icon: "TestTube" },
    { id: "ai-ml", name: "AI/ML", icon: "Brain" },
    { id: "general", name: "General", icon: "Sparkles" }
];

export const agentFormats = [
    { id: "cursor", name: "Cursor", file: ".cursorrules" },
    { id: "claude-code", name: "Claude Code", file: "CLAUDE.md" },
    { id: "antigravity", name: "Antigravity", file: ".agent/workflows/" },
    { id: "codex", name: "Codex", file: "system-prompt.txt" },
    { id: "windsurf", name: "Windsurf", file: ".windsurfrules" },
    { id: "cline", name: "Cline", file: ".clinerules" }
];

export const skillsData: Skill[] = [
    {
        id: "1",
        name: "Next.js App Router",
        slug: "nextjs-app-router",
        description: "Best practices for Next.js 14+ App Router development with Server Components and TypeScript",
        category: "frontend",
        agents: ["cursor", "claude-code", "antigravity", "codex"],
        author: "VibeLab",
        downloads: 2847,
        instructions: [
            "Use the `app/` directory structure for all routes",
            "Prefer Server Components by default - only use 'use client' when necessary",
            "Use TypeScript with strict mode enabled",
            "Implement proper error boundaries with error.tsx files",
            "Use loading.tsx for streaming and suspense boundaries",
            "Prefer Server Actions over API routes for mutations",
            "Use `next/image` for all images with proper sizing",
            "Implement proper metadata for SEO in layout.tsx files"
        ],
        examples: [
            "// Server Component (default)\nexport default async function Page() {\n  const data = await fetchData();\n  return <div>{data}</div>;\n}",
            "// Client Component (when needed)\n'use client';\nimport { useState } from 'react';\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;\n}"
        ],
        rules: [
            "NEVER use pages/ directory - always use app/",
            "NEVER fetch data in Client Components - lift to Server Components",
            "ALWAYS handle loading and error states",
            "ALWAYS use proper TypeScript types"
        ],
        createdAt: "2024-01-15"
    },
    {
        id: "2",
        name: "React Best Practices",
        slug: "react-best-practices",
        description: "Modern React patterns including hooks, composition, and performance optimization",
        category: "frontend",
        agents: ["cursor", "claude-code", "antigravity", "codex", "windsurf"],
        author: "VibeLab",
        downloads: 4231,
        instructions: [
            "Use functional components with hooks exclusively",
            "Implement proper component composition over inheritance",
            "Use React.memo() for expensive pure components",
            "Implement useCallback for event handlers passed to children",
            "Use useMemo for expensive calculations",
            "Keep components small and focused (single responsibility)",
            "Lift state up when needed, use context sparingly",
            "Prefer controlled components for forms"
        ],
        examples: [
            "// Custom hook pattern\nfunction useToggle(initial = false) {\n  const [state, setState] = useState(initial);\n  const toggle = useCallback(() => setState(s => !s), []);\n  return [state, toggle] as const;\n}",
            "// Compound component pattern\nfunction Tabs({ children }) { /* ... */ }\nTabs.Tab = function Tab({ children }) { /* ... */ }\nTabs.Panel = function Panel({ children }) { /* ... */ }"
        ],
        rules: [
            "NEVER use class components for new code",
            "NEVER mutate state directly",
            "ALWAYS cleanup effects that create subscriptions",
            "ALWAYS provide keys for list items"
        ],
        createdAt: "2024-01-10"
    },
    {
        id: "3",
        name: "TypeScript Strict Mode",
        slug: "typescript-strict",
        description: "Strict TypeScript configuration and patterns for type-safe development",
        category: "general",
        agents: ["cursor", "claude-code", "antigravity", "codex", "cline"],
        author: "VibeLab",
        downloads: 3156,
        instructions: [
            "Enable strict mode in tsconfig.json",
            "Avoid using 'any' type - use 'unknown' and narrow types",
            "Define explicit return types for functions",
            "Use discriminated unions for complex state",
            "Leverage type inference where appropriate",
            "Use 'as const' for literal types",
            "Implement proper generics for reusable code",
            "Use utility types (Partial, Required, Pick, Omit)"
        ],
        examples: [
            "// Discriminated union\ntype Result<T> = \n  | { success: true; data: T }\n  | { success: false; error: string };",
            "// Generic constraint\nfunction getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}"
        ],
        rules: [
            "NEVER use 'any' - use 'unknown' and type guards instead",
            "NEVER use non-null assertion (!) without justification",
            "ALWAYS define interfaces for object shapes",
            "ALWAYS handle all union type cases"
        ],
        createdAt: "2024-01-08"
    },
    {
        id: "4",
        name: "Tailwind CSS Patterns",
        slug: "tailwind-patterns",
        description: "Efficient Tailwind CSS usage patterns and component organization",
        category: "frontend",
        agents: ["cursor", "claude-code", "antigravity", "windsurf"],
        author: "VibeLab",
        downloads: 2543,
        instructions: [
            "Use design tokens via tailwind.config.js for consistency",
            "Prefer utility classes over custom CSS",
            "Use @apply sparingly - only for truly reusable patterns",
            "Implement responsive design mobile-first",
            "Use CSS variables for dynamic theming",
            "Group related utilities logically in className",
            "Extract repeated patterns into components, not @apply",
            "Use arbitrary values sparingly - prefer config extension"
        ],
        examples: [
            "// Component with grouped utilities\n<button className=\"\n  px-4 py-2 rounded-lg\n  bg-blue-500 hover:bg-blue-600\n  text-white font-medium\n  transition-colors\n\">\n  Click me\n</button>",
            "// Responsive pattern\n<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">"
        ],
        rules: [
            "NEVER use inline styles when Tailwind utilities exist",
            "NEVER create one-off arbitrary values - extend config",
            "ALWAYS use responsive prefixes mobile-first",
            "ALWAYS group utilities by purpose for readability"
        ],
        createdAt: "2024-01-12"
    },
    {
        id: "5",
        name: "API Design (REST)",
        slug: "rest-api-design",
        description: "RESTful API design principles and error handling patterns",
        category: "backend",
        agents: ["cursor", "claude-code", "antigravity", "codex"],
        author: "VibeLab",
        downloads: 1892,
        instructions: [
            "Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)",
            "Return appropriate status codes (200, 201, 400, 401, 404, 500)",
            "Use plural nouns for resource endpoints (/users, /posts)",
            "Implement consistent error response format",
            "Use query params for filtering, sorting, pagination",
            "Version your API (/v1/users)",
            "Implement proper rate limiting",
            "Return Location header for created resources"
        ],
        examples: [
            "// Error response format\n{\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Invalid email format\",\n    \"details\": [{ \"field\": \"email\", \"issue\": \"Must be valid email\" }]\n  }\n}",
            "// Pagination response\n{\n  \"data\": [...],\n  \"pagination\": {\n    \"page\": 1,\n    \"limit\": 20,\n    \"total\": 150,\n    \"hasNext\": true\n  }\n}"
        ],
        rules: [
            "NEVER use GET for mutations",
            "NEVER return 200 for errors - use proper status codes",
            "ALWAYS validate input and return helpful error messages",
            "ALWAYS use HTTPS in production"
        ],
        createdAt: "2024-01-18"
    },
    {
        id: "6",
        name: "Git Commit Convention",
        slug: "git-commits",
        description: "Conventional commit messages and branching strategy",
        category: "devops",
        agents: ["cursor", "claude-code", "antigravity", "codex", "windsurf", "cline"],
        author: "VibeLab",
        downloads: 5421,
        instructions: [
            "Use conventional commit format: type(scope): description",
            "Types: feat, fix, docs, style, refactor, test, chore",
            "Keep subject line under 72 characters",
            "Use imperative mood: 'add feature' not 'added feature'",
            "Reference issues in commit body when applicable",
            "Keep commits atomic - one logical change per commit",
            "Write descriptive commit bodies for complex changes",
            "Use feature branches: feature/*, bugfix/*, hotfix/*"
        ],
        examples: [
            "feat(auth): add OAuth2 login with Google\n\nImplements Google OAuth2 flow with proper token refresh.\nCloses #123",
            "fix(api): handle null response from external service\n\nAdds proper error handling when the payment API returns null.\nPreviously caused 500 errors."
        ],
        rules: [
            "NEVER commit directly to main/master",
            "NEVER use vague messages like 'fix bug' or 'update'",
            "ALWAYS run tests before committing",
            "ALWAYS squash WIP commits before merging"
        ],
        createdAt: "2024-01-05"
    }
];

// Export formatters
export function exportToCursor(skill: Skill): string {
    let output = `# ${skill.name}\n\n`;
    output += `${skill.description}\n\n`;

    output += `## Instructions\n`;
    skill.instructions.forEach(inst => {
        output += `- ${inst}\n`;
    });

    output += `\n## Rules\n`;
    skill.rules.forEach(rule => {
        output += `- ${rule}\n`;
    });

    if (skill.examples.length > 0) {
        output += `\n## Examples\n`;
        skill.examples.forEach(ex => {
            output += `\`\`\`\n${ex}\n\`\`\`\n\n`;
        });
    }

    return output;
}

export function exportToClaudeCode(skill: Skill): string {
    let output = `# ${skill.name}\n\n`;
    output += `> ${skill.description}\n\n`;

    output += `## Guidelines\n\n`;
    skill.instructions.forEach(inst => {
        output += `- ${inst}\n`;
    });

    output += `\n## Critical Rules\n\n`;
    skill.rules.forEach(rule => {
        output += `- ${rule}\n`;
    });

    if (skill.examples.length > 0) {
        output += `\n## Code Examples\n\n`;
        skill.examples.forEach((ex, i) => {
            output += `### Example ${i + 1}\n\`\`\`typescript\n${ex}\n\`\`\`\n\n`;
        });
    }

    return output;
}

export function exportToAntigravity(skill: Skill): string {
    let output = `---\n`;
    output += `description: ${skill.description}\n`;
    output += `---\n\n`;
    output += `# ${skill.name}\n\n`;

    output += `## Steps\n\n`;
    skill.instructions.forEach((inst, i) => {
        output += `${i + 1}. ${inst}\n`;
    });

    output += `\n## Rules to Follow\n\n`;
    skill.rules.forEach(rule => {
        output += `- ${rule}\n`;
    });

    return output;
}
