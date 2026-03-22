#!/bin/bash
# Install Zsh Script
# Installs zsh based on detected OS and package manager

set -e

source ~/.agents/skills/zsh-setup/scripts/01_detect_env.sh

install_zsh_apt() {
    echo "Installing zsh via apt..."
    sudo apt update
    sudo apt install -y zsh
}

install_zsh_yum() {
    echo "Installing zsh via yum..."
    sudo yum install -y zsh
}

install_zsh_dnf() {
    echo "Installing zsh via dnf..."
    sudo dnf install -y zsh
}

install_zsh_pacman() {
    echo "Installing zsh via pacman..."
    sudo pacman -Sy --noconfirm zsh
}

install_zsh_brew() {
    echo "Installing zsh via brew..."
    brew install zsh
}

# Check if zsh is already installed
if command -v zsh &> /dev/null; then
    echo "zsh is already installed: $(zsh --version)"
    exit 0
fi

# Install based on package manager
case "$PACKAGE_MANAGER" in
    apt)
        install_zsh_apt
        ;;
    yum)
        install_zsh_yum
        ;;
    dnf)
        install_zsh_dnf
        ;;
    pacman)
        install_zsh_pacman
        ;;
    brew)
        install_zsh_brew
        ;;
    *)
        echo "Error: Unsupported package manager: $PACKAGE_MANAGER"
        echo "Please install zsh manually and ensure it's in your PATH"
        exit 1
        ;;
esac

# Verify installation
if command -v zsh &> /dev/null; then
    echo "✓ zsh installed successfully: $(zsh --version)"
else
    echo "✗ zsh installation failed"
    exit 1
fi
