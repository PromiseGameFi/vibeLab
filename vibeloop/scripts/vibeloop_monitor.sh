#!/bin/bash
# VibeLab Loop - Live Monitor Dashboard
# Shows real-time status and logs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Session files
SESSION_FILE=".vibeloop_session"
LOG_FILE="logs/vibeloop.log"

# Clear screen and move cursor to top
clear_screen() {
    printf "\033[2J\033[H"
}

# Draw header
draw_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}                    🚀 VibeLab Loop Monitor${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Draw session info
draw_session() {
    echo -e "${BLUE}Session${NC}"
    echo -e "────────────────────────────────────────"
    
    if [[ -f "$SESSION_FILE" ]]; then
        if command -v jq &> /dev/null; then
            local id=$(jq -r '.id // "unknown"' "$SESSION_FILE" 2>/dev/null)
            local iteration=$(jq -r '.iteration // 0' "$SESSION_FILE" 2>/dev/null)
            local updated=$(jq -r '.updated // "never"' "$SESSION_FILE" 2>/dev/null)
            
            echo -e "  ID:        ${GREEN}$id${NC}"
            echo -e "  Iteration: ${GREEN}$iteration${NC}"
            echo -e "  Updated:   $updated"
        else
            cat "$SESSION_FILE"
        fi
    else
        echo -e "  ${YELLOW}No active session${NC}"
    fi
    echo ""
}

# Draw recent logs
draw_logs() {
    echo -e "${BLUE}Recent Activity${NC}"
    echo -e "────────────────────────────────────────"
    
    if [[ -f "$LOG_FILE" ]]; then
        tail -10 "$LOG_FILE" | while read -r line; do
            # Color code based on content
            if echo "$line" | grep -q "error\|Error\|ERROR"; then
                echo -e "  ${RED}$line${NC}"
            elif echo "$line" | grep -q "complete\|Complete\|success"; then
                echo -e "  ${GREEN}$line${NC}"
            elif echo "$line" | grep -q "warning\|Warning"; then
                echo -e "  ${YELLOW}$line${NC}"
            else
                echo -e "  $line"
            fi
        done
    else
        echo -e "  ${YELLOW}No logs yet${NC}"
    fi
    echo ""
}

# Draw status bar
draw_status_bar() {
    local now=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Press ${YELLOW}Ctrl+C${NC} to exit                                  $now"
}

# Main loop
main() {
    while true; do
        clear_screen
        draw_header
        draw_session
        draw_logs
        draw_status_bar
        
        # Refresh every 2 seconds
        sleep 2
    done
}

# Handle Ctrl+C
trap "echo ''; echo -e '${GREEN}Monitor stopped${NC}'; exit 0" SIGINT

main
