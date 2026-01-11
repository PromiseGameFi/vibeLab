#!/bin/bash
# OpenCode Adapter for VibeLab Loop
# https://github.com/opencode-ai/opencode

# Adapter description
adapter_description() {
    echo "OpenCode - open-source AI coding agent"
}

# Check if adapter is available
adapter_is_available() {
    command -v opencode &> /dev/null
}

# Execute prompt with adapter
adapter_execute() {
    local prompt=$1
    local timeout=$2
    
    # Run opencode with the prompt
    timeout "${timeout}m" opencode --non-interactive "$prompt"
}

# Get adapter status
adapter_status() {
    if adapter_is_available; then
        echo "OpenCode: $(opencode --version 2>/dev/null | head -1 || echo 'installed')"
    else
        echo "OpenCode: not installed"
        echo "Install: npm install -g opencode"
    fi
}
