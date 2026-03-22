#!/bin/bash
# Install Powerlevel10k Theme Script
# Installs Powerlevel10k theme for oh-my-zsh

set -e

ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
THEME_DIR="$ZSH_CUSTOM/themes/powerlevel10k"
ZSHRC="$HOME/.zshrc"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed"
    exit 1
fi

# Check if already installed
if [[ -d "$THEME_DIR" ]]; then
    echo "Powerlevel10k is already installed"
else
    echo "Installing Powerlevel10k theme..."
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$THEME_DIR"
    echo "✓ Powerlevel10k cloned successfully"
fi

# Update .zshrc to use Powerlevel10k
if [[ -f "$ZSHRC" ]]; then
    # Backup original .zshrc
    cp "$ZSHRC" "${ZSHRC}.bak"
    
    # Update theme setting
    if grep -q '^ZSH_THEME=' "$ZSHRC"; then
        sed -i 's/^ZSH_THEME="[^"]*"/ZSH_THEME="powerlevel10k\/powerlevel10k"/' "$ZSHRC"
        echo "✓ Updated ZSH_THEME in .zshrc"
    else
        echo "ZSH_THEME not found in .zshrc"
    fi
    
    # Add p10k configuration source if not present
    if ! grep -q 'source ~/.p10k.zsh' "$ZSHRC" && ! grep -q '[[ ! -f ~/.p10k.zsh ]]' "$ZSHRC"; then
        echo '' >> "$ZSHRC"
        echo '# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.' >> "$ZSHRC"
        echo '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh' >> "$ZSHRC"
        echo "✓ Added p10k configuration to .zshrc"
    fi
else
    echo "Warning: .zshrc not found at $ZSHRC"
fi

echo "✓ Powerlevel10k theme installation complete"
