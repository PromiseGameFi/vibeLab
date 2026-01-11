#!/bin/bash
# Aider Adapter for VibeLab Loop
# https://aider.chat/

# Adapter description
adapter_description() {
    echo "Aider - AI pair programming in terminal"
}

# Check if adapter is available
adapter_is_available() {
    command -v aider &> /dev/null
}

# Execute prompt with adapter
adapter_execute() {
    local prompt=$1
    local timeout=$2
    
    # Run aider with the prompt
    # --yes-always auto-confirms changes
    # --no-git skips git operations for cleaner output
    timeout "${timeout}m" aider --yes-always --message "$prompt"
}

# Get adapter status
adapter_status() {
    if adapter_is_available; then
        echo "Aider: $(aider --version 2>/dev/null | head -1 || echo 'installed')"
    else
        echo "Aider: not installed"
        echo "Install: pip install aider-chat"
    fi
}
