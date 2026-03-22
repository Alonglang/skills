#!/bin/bash
# Install Plugins Script
# Installs commonly used zsh plugins

set -e

ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
PLUGIN_DIR="$ZSH_CUSTOM/plugins"
ZSHRC="$HOME/.zshrc"

# Ensure directories exist
mkdir -p "$PLUGIN_DIR"

# Check for git
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed"
    exit 1
fi

install_plugin() {
    local plugin_name="$1"
    local plugin_url="$2"
    local plugin_path="$PLUGIN_DIR/$plugin_name"
    
    if [[ -d "$plugin_path" ]]; then
        echo "  - $plugin_name: already installed"
        return 0
    fi
    
    echo "  - $plugin_name: installing..."
    git clone --depth=1 "$plugin_url" "$plugin_path" 2>/dev/null
    if [[ $? -eq 0 ]]; then
        echo "  - $plugin_name: installed"
    else
        echo "  - $plugin_name: failed"
        return 1
    fi
}

# Core plugins (always install)
echo "Installing core plugins..."
install_plugin "zsh-autosuggestions" "https://github.com/zsh-users/zsh-autosuggestions"
install_plugin "zsh-syntax-highlighting" "https://github.com/zsh-users/zsh-syntax-highlighting.git"

# Load environment info
source ~/.agents/skills/zsh-setup/scripts/01_detect_env.sh

# Optional plugins based on detected tools
echo ""
echo "Checking for optional plugins..."

# Docker plugin
if [[ "$DOCKER_INSTALLED" == "true" ]]; then
    install_plugin "docker" "https://github.com/ohmyzsh/ohmyzsh/plugins/docker"
fi

# Kubectl plugin
if [[ "$KUBECTL_INSTALLED" == "true" ]]; then
    install_plugin "kubectl" "https://github.com/ohmyzsh/ohmyzsh/plugins/kubectl"
fi

# Terraform plugin
if [[ "$TERRAFORM_INSTALLED" == "true" ]]; then
    install_plugin "terraform" "https://github.com/ohmyzsh/ohmyzsh/plugins/terraform"
fi

# Update .zshrc plugins configuration
echo ""
echo "Updating .zshrc plugins configuration..."

if [[ -f "$ZSHRC" ]]; then
    # Create plugin list
    PLUGINS="git zsh-autosuggestions zsh-syntax-highlighting"
    
    # Add optional plugins if installed
    [[ -d "$PLUGIN_DIR/docker" ]] && PLUGINS="$PLUGINS docker"
    [[ -d "$PLUGIN_DIR/kubectl" ]] && PLUGINS="$PLUGINS kubectl"
    [[ -d "$PLUGIN_DIR/terraform" ]] && PLUGINS="$PLUGINS terraform"
    
    # Backup
    cp "$ZSHRC" "${ZSHRC}.bak"
    
    # Update plugins line
    if grep -q '^plugins=' "$ZSHRC"; then
        sed -i "s/^plugins=(.*)/plugins=($PLUGINS)/" "$ZSHRC"
        echo "✓ Updated plugins in .zshrc: ($PLUGINS)"
    else
        echo "Warning: plugins line not found in .zshrc"
    fi
else
    echo "Warning: .zshrc not found"
fi

echo ""
echo "✓ Plugin installation complete"
echo ""
echo "Installed plugins:"
ls -1 "$PLUGIN_DIR" | grep -E "(zsh-|docker|kubectl|terraform)" | while read plugin; do
    echo "  - $plugin"
done
