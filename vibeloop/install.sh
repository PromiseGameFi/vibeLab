#!/bin/bash
# VibeLab Loop Installer
# Installs vibeloop commands globally

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}         VibeLab Loop Installer${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.vibeloop"

# Create install directory
echo -e "${CYAN}Creating install directory...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/adapters"

# Copy scripts
echo -e "${CYAN}Installing scripts...${NC}"
cp "$SCRIPT_DIR/scripts/vibeloop_loop.sh" "$INSTALL_DIR/vibeloop_loop.sh"
cp "$SCRIPT_DIR/scripts/vibeloop_setup.sh" "$INSTALL_DIR/vibeloop_setup.sh" 2>/dev/null || true
cp "$SCRIPT_DIR/scripts/vibeloop_monitor.sh" "$INSTALL_DIR/vibeloop_monitor.sh" 2>/dev/null || true

# Copy adapters
echo -e "${CYAN}Installing adapters...${NC}"
cp "$SCRIPT_DIR/adapters-bash/"*.sh "$INSTALL_DIR/adapters/" 2>/dev/null || true

# Copy templates
echo -e "${CYAN}Installing templates...${NC}"
cp -r "$SCRIPT_DIR/templates" "$INSTALL_DIR/" 2>/dev/null || true

# Make scripts executable
chmod +x "$INSTALL_DIR"/*.sh 2>/dev/null || true
chmod +x "$INSTALL_DIR/adapters"/*.sh 2>/dev/null || true

# Create wrapper scripts
echo -e "${CYAN}Creating CLI commands...${NC}"

# vibeloop command
cat > "$INSTALL_DIR/vibeloop" << 'EOF'
#!/bin/bash
exec "$HOME/.vibeloop/vibeloop_loop.sh" "$@"
EOF
chmod +x "$INSTALL_DIR/vibeloop"

# vibeloop-setup command
cat > "$INSTALL_DIR/vibeloop-setup" << 'EOF'
#!/bin/bash
exec "$HOME/.vibeloop/vibeloop_setup.sh" "$@"
EOF
chmod +x "$INSTALL_DIR/vibeloop-setup"

# vibeloop-monitor command
cat > "$INSTALL_DIR/vibeloop-monitor" << 'EOF'
#!/bin/bash
exec "$HOME/.vibeloop/vibeloop_monitor.sh" "$@"
EOF
chmod +x "$INSTALL_DIR/vibeloop-monitor"

# Add to PATH
SHELL_RC=""
if [[ -f "$HOME/.zshrc" ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ -f "$HOME/.bashrc" ]]; then
    SHELL_RC="$HOME/.bashrc"
elif [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_RC="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_RC" ]]; then
    # Check if already added
    if ! grep -q "vibeloop" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# VibeLab Loop" >> "$SHELL_RC"
        echo 'export PATH="$HOME/.vibeloop:$PATH"' >> "$SHELL_RC"
        echo -e "${GREEN}Added to PATH in $SHELL_RC${NC}"
    else
        echo -e "${YELLOW}PATH already configured in $SHELL_RC${NC}"
    fi
else
    echo -e "${YELLOW}Could not find shell RC file. Please add manually:${NC}"
    echo 'export PATH="$HOME/.vibeloop:$PATH"'
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}         Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Commands installed:"
echo -e "  ${CYAN}vibeloop${NC}         - Run autonomous development loop"
echo -e "  ${CYAN}vibeloop-setup${NC}   - Initialize a new project"
echo -e "  ${CYAN}vibeloop-monitor${NC} - Live monitoring dashboard"
echo ""
echo -e "To use now, run:"
echo -e "  ${YELLOW}source $SHELL_RC${NC}"
echo ""
echo -e "Or open a new terminal and run:"
echo -e "  ${YELLOW}vibeloop --help${NC}"
echo ""
