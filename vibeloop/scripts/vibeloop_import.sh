#!/bin/bash
# VibeLab Loop - Import PRD/Specifications
# Converts existing requirements docs to vibeloop format

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Usage
usage() {
    echo "Usage: vibeloop-import <input-file> [project-name]"
    echo ""
    echo "Converts existing PRD/specifications to VibeLab Loop format"
    echo ""
    echo "Supported formats:"
    echo "  .md      - Markdown files"
    echo "  .txt     - Plain text files"
    echo "  .pdf     - PDF files (requires pdftotext)"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help"
    echo ""
    echo "Examples:"
    echo "  vibeloop-import requirements.md                   # Creates project from filename"
    echo "  vibeloop-import my-prd.md awesome-project         # Specify project name"
}

# Extract text from file
extract_text() {
    local file=$1
    local ext="${file##*.}"
    
    case "$ext" in
        md|txt)
            cat "$file"
            ;;
        pdf)
            if command -v pdftotext &> /dev/null; then
                pdftotext "$file" -
            else
                echo -e "${RED}Error: pdftotext not installed${NC}" >&2
                echo "Install with: brew install poppler" >&2
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}Error: Unsupported file format: .$ext${NC}" >&2
            exit 1
            ;;
    esac
}

# Parse PRD into sections
parse_prd() {
    local content=$1
    
    # Extract objectives (look for headers)
    echo "## Objective"
    echo "$content" | grep -A5 -iE "^#+.*objective|^#+.*goal|^#+.*overview" | head -6 || echo "[Extracted from PRD]"
    echo ""
    
    # Extract requirements
    echo "## Requirements"
    echo "$content" | grep -A10 -iE "^#+.*requirement|^#+.*feature" | head -12 || echo "- See specs/requirements.md for details"
    echo ""
    
    # Extract constraints
    echo "## Constraints"
    echo "$content" | grep -A5 -iE "^#+.*constraint|^#+.*limitation" | head -6 || echo "- Follow best practices"
}

# Generate task list from PRD
generate_tasks() {
    local content=$1
    
    echo "# Priority Task List"
    echo ""
    echo "## High Priority"
    
    # Look for numbered lists or task-like items
    echo "$content" | grep -E "^[0-9]+\.|^-\s*\[" | head -5 | while read -r line; do
        echo "- [ ] $(echo "$line" | sed 's/^[0-9]*\.\s*//' | sed 's/^-\s*\[.\]\s*//')"
    done
    
    if ! echo "$content" | grep -qE "^[0-9]+\.|^-\s*\["; then
        echo "- [ ] Set up project structure"
        echo "- [ ] Implement core functionality"
    fi
    
    echo ""
    echo "## Medium Priority"
    echo "- [ ] Add error handling"
    echo "- [ ] Write tests"
    echo ""
    echo "## Low Priority"
    echo "- [ ] Documentation"
    echo "- [ ] Polish and optimization"
}

# Main import function
import_prd() {
    local input_file=$1
    local project_name=$2
    
    if [[ ! -f "$input_file" ]]; then
        echo -e "${RED}Error: File not found: $input_file${NC}"
        exit 1
    fi
    
    # Get project name from filename if not provided
    if [[ -z "$project_name" ]]; then
        project_name=$(basename "$input_file" | sed 's/\.[^.]*$//' | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    fi
    
    echo -e "${CYAN}Importing: $input_file${NC}"
    echo -e "Project:   $project_name"
    echo ""
    
    # Extract content
    local content=$(extract_text "$input_file")
    
    # Create project using vibeloop-setup
    "$HOME/.vibeloop/vibeloop_setup.sh" "$project_name"
    
    # Generate PROMPT.md from PRD
    echo -e "${CYAN}Generating PROMPT.md...${NC}"
    cat > "$project_name/PROMPT.md" << EOF
# Project Requirements

$(parse_prd "$content")

## Current Status
Starting fresh - imported from PRD.

## Exit Condition
When all tasks in @fix_plan.md are complete and tests pass, signal by saying "All tasks complete."

---

## Notes for AI
- Check @fix_plan.md for current priorities
- Original PRD saved in specs/original-prd.md
EOF

    # Generate @fix_plan.md
    echo -e "${CYAN}Generating @fix_plan.md...${NC}"
    generate_tasks "$content" > "$project_name/@fix_plan.md"
    
    # Save original PRD
    cp "$input_file" "$project_name/specs/original-prd.md"
    
    # Copy full content to requirements
    cat > "$project_name/specs/requirements.md" << EOF
# Technical Requirements

*Imported from: $(basename "$input_file")*

---

$content
EOF

    echo ""
    echo -e "${GREEN}✅ Import complete!${NC}"
    echo ""
    echo "Generated files:"
    echo "  $project_name/PROMPT.md              - AI instructions"
    echo "  $project_name/@fix_plan.md           - Task priorities"
    echo "  $project_name/specs/requirements.md  - Full requirements"
    echo "  $project_name/specs/original-prd.md  - Original PRD backup"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. ${CYAN}cd $project_name${NC}"
    echo -e "  2. Review and edit ${CYAN}PROMPT.md${NC}"
    echo -e "  3. Run ${CYAN}vibeloop --monitor${NC}"
}

# Parse arguments
if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

case $1 in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        import_prd "$1" "$2"
        ;;
esac
