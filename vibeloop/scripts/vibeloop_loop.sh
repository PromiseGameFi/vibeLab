#!/bin/bash
# VibeLab Loop - Main Autonomous Development Loop
# Ported from Ralph for Claude Code with multi-IDE support
# https://github.com/frankbria/ralph-claude-code

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTERS_DIR="$SCRIPT_DIR/../adapters-bash"

# Configuration defaults
ADAPTER="claude"
PROMPT_FILE="PROMPT.md"
TIMEOUT=15
MAX_CALLS=100
VERBOSE=false
MONITOR=false
NO_CONTINUE=false

# Exit detection thresholds
MAX_CONSECUTIVE_TEST_LOOPS=3
MAX_CONSECUTIVE_DONE_SIGNALS=2
TEST_PERCENTAGE_THRESHOLD=30

# Circuit breaker thresholds
CB_NO_PROGRESS_THRESHOLD=3
CB_SAME_ERROR_THRESHOLD=5
CB_OUTPUT_DECLINE_THRESHOLD=70

# Session files
SESSION_FILE=".vibeloop_session"
SESSION_HISTORY=".vibeloop_session_history"
LOG_DIR="logs"

# State variables
LOOP_COUNT=0
CONSECUTIVE_TEST_LOOPS=0
CONSECUTIVE_DONE_SIGNALS=0
CONSECUTIVE_NO_PROGRESS=0
LAST_ERROR=""
SAME_ERROR_COUNT=0
API_CALLS_THIS_HOUR=0
HOUR_START=$(date +%s)
CIRCUIT_OPEN=false

# Print usage
usage() {
    echo "Usage: vibeloop [OPTIONS]"
    echo ""
    echo "Autonomous AI development loop with multi-IDE support"
    echo ""
    echo "Options:"
    echo "  -a, --adapter NAME    AI adapter to use (default: claude)"
    echo "                        Options: claude, cursor, aider, opencode, copilot"
    echo "  -p, --prompt FILE     Prompt file (default: PROMPT.md)"
    echo "  -t, --timeout MIN     Execution timeout in minutes (default: 15)"
    echo "  -c, --calls NUM       Max API calls per hour (default: 100)"
    echo "  -m, --monitor         Enable tmux monitoring dashboard"
    echo "  -v, --verbose         Enable verbose output"
    echo "  --no-continue         Disable session continuity"
    echo "  --reset-session       Reset current session"
    echo "  --reset-circuit       Reset circuit breaker"
    echo "  --status              Show current status"
    echo "  --list-adapters       List available adapters"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  vibeloop                      # Run with defaults (claude)"
    echo "  vibeloop --adapter cursor     # Use Cursor IDE"
    echo "  vibeloop --monitor            # Run with tmux dashboard"
    echo "  vibeloop -v -t 30             # Verbose with 30min timeout"
}

# List available adapters
list_adapters() {
    echo -e "${CYAN}Available Adapters:${NC}"
    echo ""
    
    for adapter_file in "$ADAPTERS_DIR"/*.sh; do
        if [[ -f "$adapter_file" ]]; then
            adapter_name=$(basename "$adapter_file" .sh)
            source "$adapter_file"
            if adapter_is_available; then
                echo -e "  ${GREEN}✓${NC} $adapter_name - $(adapter_description)"
            else
                echo -e "  ${RED}✗${NC} $adapter_name - $(adapter_description) (not installed)"
            fi
        fi
    done
}

# Load adapter
load_adapter() {
    local adapter_file="$ADAPTERS_DIR/$ADAPTER.sh"
    
    if [[ ! -f "$adapter_file" ]]; then
        echo -e "${RED}Error: Adapter '$ADAPTER' not found${NC}"
        echo "Available adapters:"
        list_adapters
        exit 1
    fi
    
    source "$adapter_file"
    
    if ! adapter_is_available; then
        echo -e "${RED}Error: Adapter '$ADAPTER' is not available${NC}"
        echo "Please install the required CLI tool."
        exit 1
    fi
    
    echo -e "${GREEN}Using adapter: $ADAPTER${NC}"
}

# Initialize session
init_session() {
    if [[ "$NO_CONTINUE" == true ]] || [[ ! -f "$SESSION_FILE" ]]; then
        echo "{\"id\": \"$(date +%s)\", \"iteration\": 0, \"created\": \"$(date -Iseconds)\"}" > "$SESSION_FILE"
    fi
    
    mkdir -p "$LOG_DIR"
}

# Update session
update_session() {
    local iteration=$1
    local tmp_file=$(mktemp)
    
    if command -v jq &> /dev/null; then
        jq ".iteration = $iteration | .updated = \"$(date -Iseconds)\"" "$SESSION_FILE" > "$tmp_file"
        mv "$tmp_file" "$SESSION_FILE"
    else
        echo "{\"id\": \"$(date +%s)\", \"iteration\": $iteration, \"updated\": \"$(date -Iseconds)\"}" > "$SESSION_FILE"
    fi
    
    # Log to history
    echo "[$(date -Iseconds)] Iteration $iteration" >> "$SESSION_HISTORY"
}

# Check rate limit
check_rate_limit() {
    local now=$(date +%s)
    local elapsed=$((now - HOUR_START))
    
    # Reset hourly counter if hour has passed
    if [[ $elapsed -ge 3600 ]]; then
        API_CALLS_THIS_HOUR=0
        HOUR_START=$now
    fi
    
    if [[ $API_CALLS_THIS_HOUR -ge $MAX_CALLS ]]; then
        local wait_time=$((3600 - elapsed))
        echo -e "${YELLOW}Rate limit reached ($MAX_CALLS/hour). Waiting ${wait_time}s...${NC}"
        sleep $wait_time
        API_CALLS_THIS_HOUR=0
        HOUR_START=$(date +%s)
    fi
}

# Check circuit breaker
check_circuit_breaker() {
    if [[ "$CIRCUIT_OPEN" == true ]]; then
        echo -e "${YELLOW}Circuit breaker is OPEN. Waiting for recovery...${NC}"
        sleep 60
        CIRCUIT_OPEN=false
        CONSECUTIVE_NO_PROGRESS=0
        SAME_ERROR_COUNT=0
        echo -e "${GREEN}Circuit breaker half-open. Resuming...${NC}"
    fi
}

# Record result for circuit breaker
record_result() {
    local success=$1
    local output=$2
    local files_changed=$3
    
    if [[ $files_changed -eq 0 ]]; then
        ((CONSECUTIVE_NO_PROGRESS++))
        if [[ $CONSECUTIVE_NO_PROGRESS -ge $CB_NO_PROGRESS_THRESHOLD ]]; then
            echo -e "${RED}Circuit breaker: No progress in $CONSECUTIVE_NO_PROGRESS loops${NC}"
            CIRCUIT_OPEN=true
            reset_session
        fi
    else
        CONSECUTIVE_NO_PROGRESS=0
    fi
    
    # Check for repeated errors
    local error=$(echo "$output" | grep -i "error\|failed\|exception" | head -1)
    if [[ -n "$error" ]]; then
        if [[ "$error" == "$LAST_ERROR" ]]; then
            ((SAME_ERROR_COUNT++))
            if [[ $SAME_ERROR_COUNT -ge $CB_SAME_ERROR_THRESHOLD ]]; then
                echo -e "${RED}Circuit breaker: Same error repeated $SAME_ERROR_COUNT times${NC}"
                CIRCUIT_OPEN=true
                reset_session
            fi
        else
            LAST_ERROR="$error"
            SAME_ERROR_COUNT=1
        fi
    fi
}

# Check for exit signals
check_exit_signals() {
    local output=$1
    
    # Check for "done" signals
    if echo "$output" | grep -qiE "all.*tasks?.*complete|project.*complete|nothing.*left.*to.*do|successfully.*completed"; then
        ((CONSECUTIVE_DONE_SIGNALS++))
        echo -e "${CYAN}Done signal detected ($CONSECUTIVE_DONE_SIGNALS/$MAX_CONSECUTIVE_DONE_SIGNALS)${NC}"
        
        if [[ $CONSECUTIVE_DONE_SIGNALS -ge $MAX_CONSECUTIVE_DONE_SIGNALS ]]; then
            echo -e "${GREEN}🎉 Project complete! Exiting loop.${NC}"
            return 0
        fi
    else
        CONSECUTIVE_DONE_SIGNALS=0
    fi
    
    # Check for test-only loops
    if echo "$output" | grep -qiE "running.*tests|test.*passed|all.*tests"; then
        if ! echo "$output" | grep -qiE "created|modified|wrote|updated"; then
            ((CONSECUTIVE_TEST_LOOPS++))
            echo -e "${YELLOW}Test-only loop detected ($CONSECUTIVE_TEST_LOOPS/$MAX_CONSECUTIVE_TEST_LOOPS)${NC}"
            
            if [[ $CONSECUTIVE_TEST_LOOPS -ge $MAX_CONSECUTIVE_TEST_LOOPS ]]; then
                echo -e "${GREEN}Tests passing, no more changes needed. Exiting.${NC}"
                return 0
            fi
        else
            CONSECUTIVE_TEST_LOOPS=0
        fi
    fi
    
    return 1
}

# Reset session
reset_session() {
    echo -e "${YELLOW}Resetting session...${NC}"
    rm -f "$SESSION_FILE"
    echo "[$(date -Iseconds)] Session reset" >> "$SESSION_HISTORY"
}

# Show status
show_status() {
    echo -e "${CYAN}VibeLab Loop Status${NC}"
    echo ""
    
    if [[ -f "$SESSION_FILE" ]]; then
        echo "Session:"
        cat "$SESSION_FILE" | jq . 2>/dev/null || cat "$SESSION_FILE"
    else
        echo "No active session"
    fi
    
    echo ""
    echo "Circuit Breaker: $([ "$CIRCUIT_OPEN" == true ] && echo "OPEN" || echo "CLOSED")"
    echo "API Calls This Hour: $API_CALLS_THIS_HOUR / $MAX_CALLS"
    echo ""
    
    if command -v adapter_status &> /dev/null; then
        adapter_status
    fi
}

# Main loop
run_loop() {
    echo -e "${CYAN}🚀 Starting VibeLab Loop${NC}"
    echo -e "   Adapter: ${GREEN}$ADAPTER${NC}"
    echo -e "   Prompt:  $PROMPT_FILE"
    echo -e "   Timeout: ${TIMEOUT}m"
    echo -e "   Max calls: $MAX_CALLS/hour"
    echo ""
    
    # Check prompt file exists
    if [[ ! -f "$PROMPT_FILE" ]]; then
        echo -e "${RED}Error: Prompt file '$PROMPT_FILE' not found${NC}"
        echo "Run 'vibeloop-setup' to initialize a project"
        exit 1
    fi
    
    # Load adapter
    load_adapter
    
    # Initialize session
    init_session
    
    # Main loop
    while true; do
        ((LOOP_COUNT++))
        
        echo -e "\n${BLUE}━━━ Iteration $LOOP_COUNT ━━━${NC}"
        
        # Check circuit breaker
        check_circuit_breaker
        
        # Check rate limit
        check_rate_limit
        
        # Read prompt
        local prompt=$(cat "$PROMPT_FILE")
        
        # Add context from @fix_plan.md if exists
        if [[ -f "@fix_plan.md" ]]; then
            prompt="$prompt\n\n## Current Priorities\n$(cat @fix_plan.md)"
        fi
        
        # Execute adapter
        local start_time=$(date +%s)
        local output=""
        local exit_code=0
        
        echo -e "${CYAN}Executing $ADAPTER...${NC}"
        
        if [[ "$VERBOSE" == true ]]; then
            output=$(adapter_execute "$prompt" "$TIMEOUT" 2>&1) || exit_code=$?
            echo "$output"
        else
            output=$(adapter_execute "$prompt" "$TIMEOUT" 2>&1) || exit_code=$?
        fi
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        ((API_CALLS_THIS_HOUR++))
        
        # Count files changed
        local files_changed=$(echo "$output" | grep -ciE "created|modified|wrote|updated" || echo "0")
        
        # Log result
        echo "[$(date -Iseconds)] Iteration $LOOP_COUNT: exit=$exit_code, files=$files_changed, duration=${duration}s" >> "$LOG_DIR/vibeloop.log"
        
        # Update session
        update_session $LOOP_COUNT
        
        # Record for circuit breaker
        record_result $exit_code "$output" $files_changed
        
        # Check for exit signals
        if check_exit_signals "$output"; then
            echo -e "\n${GREEN}✅ Loop completed successfully!${NC}"
            echo "   Iterations: $LOOP_COUNT"
            echo "   Files changed: $files_changed"
            break
        fi
        
        echo -e "${GREEN}Completed in ${duration}s, $files_changed files changed${NC}"
        
        # Brief pause between iterations
        sleep 2
    done
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--adapter)
            ADAPTER="$2"
            shift 2
            ;;
        -p|--prompt)
            PROMPT_FILE="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -c|--calls)
            MAX_CALLS="$2"
            shift 2
            ;;
        -m|--monitor)
            MONITOR=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-continue)
            NO_CONTINUE=true
            shift
            ;;
        --reset-session)
            reset_session
            exit 0
            ;;
        --reset-circuit)
            CIRCUIT_OPEN=false
            CONSECUTIVE_NO_PROGRESS=0
            SAME_ERROR_COUNT=0
            echo -e "${GREEN}Circuit breaker reset${NC}"
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --list-adapters)
            list_adapters
            exit 0
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Run with or without tmux
if [[ "$MONITOR" == true ]]; then
    # Check for tmux
    if ! command -v tmux &> /dev/null; then
        echo -e "${RED}tmux is required for --monitor mode${NC}"
        echo "Install with: brew install tmux"
        exit 1
    fi
    
    # Start tmux session with panes
    tmux new-session -d -s vibeloop "bash $0 $(echo "$@" | sed 's/--monitor//')"
    tmux split-window -h -t vibeloop "tail -f $LOG_DIR/vibeloop.log 2>/dev/null || echo 'Waiting for logs...'; sleep 1; tail -f $LOG_DIR/vibeloop.log"
    tmux attach-session -t vibeloop
else
    run_loop
fi
