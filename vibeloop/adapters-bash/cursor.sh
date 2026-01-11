#!/bin/bash
# Cursor Adapter for VibeLab Loop

# Adapter description
adapter_description() {
    echo "Cursor IDE CLI"
}

# Check if adapter is available
adapter_is_available() {
    command -v cursor &> /dev/null
}

# Execute prompt with adapter
adapter_execute() {
    local prompt=$1
    local timeout=$2
    
    # Create temp file for prompt
    local temp_file=$(mktemp)
    echo "$prompt" > "$temp_file"
    
    # Cursor doesn't have a direct CLI for AI execution
    # This opens Cursor with the prompt file
    # The user would need to manually trigger AI
    timeout "${timeout}m" cursor --wait "$temp_file"
    
    local exit_code=$?
    rm -f "$temp_file"
    
    return $exit_code
}

# Get adapter status
adapter_status() {
    if adapter_is_available; then
        echo "Cursor CLI: $(cursor --version 2>/dev/null || echo 'installed')"
    else
        echo "Cursor CLI: not installed"
        echo "Install Cursor and add CLI to PATH via Command Palette"
    fi
}
