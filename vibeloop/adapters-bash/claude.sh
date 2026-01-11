#!/bin/bash
# Claude Code Adapter for VibeLab Loop

# Adapter description
adapter_description() {
    echo "Claude Code CLI (claude)"
}

# Check if adapter is available
adapter_is_available() {
    command -v claude &> /dev/null
}

# Execute prompt with adapter
adapter_execute() {
    local prompt=$1
    local timeout=$2
    
    # Build command
    local cmd="claude --print"
    
    # Add prompt via stdin
    echo "$prompt" | timeout "${timeout}m" $cmd
}

# Get adapter status
adapter_status() {
    if adapter_is_available; then
        echo "Claude CLI: $(claude --version 2>/dev/null || echo 'installed')"
    else
        echo "Claude CLI: not installed"
        echo "Install: https://docs.anthropic.com/claude-code/installation"
    fi
}
