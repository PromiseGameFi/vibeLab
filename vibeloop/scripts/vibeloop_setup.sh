#!/bin/bash
# VibeLab Loop - Project Setup
# Creates a new project with Ralph-style structure

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

# Usage
usage() {
    echo "Usage: vibeloop-setup <project-name> [options]"
    echo ""
    echo "Creates a new project with VibeLab Loop structure"
    echo ""
    echo "Options:"
    echo "  -t, --template NAME   Template to use (default: basic)"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Templates:"
    echo "  basic     - Minimal setup (PROMPT.md only)"
    echo "  full      - Full Ralph-style structure"
    echo "  typescript- TypeScript project template"
    echo "  python    - Python project template"
}

# Create project
create_project() {
    local name=$1
    local template=${2:-full}
    
    if [[ -d "$name" ]]; then
        echo -e "${RED}Error: Directory '$name' already exists${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}Creating project: $name${NC}"
    echo -e "Template: $template"
    echo ""
    
    # Create directory structure
    mkdir -p "$name"
    mkdir -p "$name/specs"
    mkdir -p "$name/src"
    mkdir -p "$name/examples"
    mkdir -p "$name/logs"
    mkdir -p "$name/docs/generated"
    
    # Create PROMPT.md
    cat > "$name/PROMPT.md" << 'EOF'
# Project Requirements

## Objective
[Describe what you want to build]

## Current Status
Starting fresh - no code written yet.

## Tasks
Please work through these tasks in order:

1. [ ] Set up project structure
2. [ ] Implement core functionality
3. [ ] Add error handling
4. [ ] Write tests
5. [ ] Add documentation

## Constraints
- Keep code clean and well-documented
- Follow best practices for the language/framework
- Write tests for critical functionality

## Exit Condition
When all tasks are complete and tests pass, signal by saying "All tasks complete."

---

## Notes for AI
- Check @fix_plan.md for current priorities
- Update task checkboxes as you complete them
- Log progress to docs/generated/progress.md
EOF

    # Create @fix_plan.md
    cat > "$name/@fix_plan.md" << 'EOF'
# Priority Task List

## High Priority
- [ ] Initial project setup

## Medium Priority
- [ ] Core implementation

## Low Priority
- [ ] Documentation
- [ ] Tests

---
*Updated by VibeLab Loop*
EOF

    # Create @AGENT.md
    cat > "$name/@AGENT.md" << 'EOF'
# Build & Run Instructions

## Setup
```bash
# Install dependencies
npm install  # or pip install -r requirements.txt
```

## Build
```bash
npm run build  # or python -m build
```

## Run
```bash
npm start  # or python main.py
```

## Test
```bash
npm test  # or pytest
```

## Lint
```bash
npm run lint  # or ruff check .
```
EOF

    # Create specs/requirements.md
    cat > "$name/specs/requirements.md" << 'EOF'
# Technical Requirements

## Overview
[High-level description of the system]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]

## Non-Functional Requirements
- Performance: [targets]
- Security: [requirements]
- Scalability: [needs]

## Dependencies
- [Dependency 1]
- [Dependency 2]

## API Design
[If applicable]
EOF

    # Create .gitignore
    cat > "$name/.gitignore" << 'EOF'
# VibeLab Loop
.vibeloop_session
.vibeloop_session_history
logs/

# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/

# Build
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF

    echo -e "${GREEN}✅ Project created: $name${NC}"
    echo ""
    echo "Project structure:"
    echo "  $name/"
    echo "  ├── PROMPT.md          # Main instructions"
    echo "  ├── @fix_plan.md       # Priority tasks"
    echo "  ├── @AGENT.md          # Build/run instructions"
    echo "  ├── specs/"
    echo "  │   └── requirements.md"
    echo "  ├── src/"
    echo "  ├── examples/"
    echo "  ├── logs/"
    echo "  └── docs/generated/"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. ${CYAN}cd $name${NC}"
    echo -e "  2. Edit ${CYAN}PROMPT.md${NC} with your requirements"
    echo -e "  3. Run ${CYAN}vibeloop --monitor${NC}"
}

# Parse arguments
if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

PROJECT_NAME=""
TEMPLATE="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--template)
            TEMPLATE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$PROJECT_NAME" ]]; then
                PROJECT_NAME="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$PROJECT_NAME" ]]; then
    echo -e "${RED}Error: Project name required${NC}"
    usage
    exit 1
fi

create_project "$PROJECT_NAME" "$TEMPLATE"
