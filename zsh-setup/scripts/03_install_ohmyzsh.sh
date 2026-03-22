#!/bin/bash
# Install Oh-My-Zsh Script
# Installs oh-my-zsh framework

set -e

OHMYZSH_DIR="$HOME/.oh-my-zsh"

# Check if already installed
if [[ -d "$OHMYZSH_DIR" ]]; then
    echo "oh-my-zsh is already installed at $OHMYZSH_DIR"
    exit 0
fi

echo "Installing oh-my-zsh..."

# Check for curl
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

# Install oh-my-zsh (unattended mode)
RUNZSH=no CHSH=no sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Verify installation
if [[ -d "$OHMYZSH_DIR" ]]; then
    echo "✓ oh-my-zsh installed successfully"
else
    echo "✗ oh-my-zsh installation failed"
    exit 1
fi
