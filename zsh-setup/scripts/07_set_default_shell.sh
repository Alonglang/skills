#!/bin/bash
# Set Default Shell Script
# Sets zsh as the default shell using various methods

set -e

ZSH_PATH=$(command -v zsh)

if [[ -z "$ZSH_PATH" ]]; then
    echo "Error: zsh not found in PATH"
    exit 1
fi

echo "Setting zsh as default shell..."
echo "zsh path: $ZSH_PATH"

set_shell_chsh() {
    echo "Method 1: Using chsh..."
    if command -v chsh &> /dev/null; then
        if [[ $EUID -eq 0 ]]; then
            # Root user
            chsh -s "$ZSH_PATH"
        else
            # Non-root user
            chsh -s "$ZSH_PATH"
        fi
        if [[ $? -eq 0 ]]; then
            echo "✓ Default shell set to zsh via chsh"
            return 0
        fi
    else
        echo "  chsh command not available"
    fi
    return 1
}

set_shell_usermod() {
    echo "Method 2: Using usermod..."
    if command -v usermod &> /dev/null; then
        if [[ $EUID -eq 0 ]]; then
            # Get current username
            CURRENT_USER=$(whoami)
            usermod -s "$ZSH_PATH" "$CURRENT_USER"
            if [[ $? -eq 0 ]]; then
                echo "✓ Default shell set to zsh via usermod"
                return 0
            fi
        else
            echo "  usermod requires root privileges"
        fi
    else
        echo "  usermod command not available"
    fi
    return 1
}

set_shell_passwd() {
    echo "Method 3: Manual /etc/passwd edit..."
    echo ""
    echo "Please run the following command:"
    echo "  sudo vim /etc/passwd"
    echo ""
    echo "Find the line for your user and change the last field from:"
    echo "  /bin/bash"
    echo "to:"
    echo "  $ZSH_PATH"
    echo ""
    read -p "Have you completed the manual edit? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    return 1
}

set_shell_profile() {
    echo "Method 4: Adding to .profile..."
    PROFILE="$HOME/.profile"
    BASH_PROFILE="$HOME/.bash_profile"
    
    # Add zsh invocation to .profile
    if [[ -f "$PROFILE" ]] && ! grep -q "exec zsh" "$PROFILE"; then
        echo "" >> "$PROFILE"
        echo "# Start zsh automatically" >> "$PROFILE"
        echo 'if [ -t 0 ] && [ -z "$INSIDE_ZSH" ] && command -v zsh &> /dev/null; then' >> "$PROFILE"
        echo '    exec zsh' >> "$PROFILE"
        echo "fi" >> "$PROFILE"
        echo "✓ Added zsh auto-start to .profile"
    fi
    
    if [[ -f "$BASH_PROFILE" ]] && ! grep -q "exec zsh" "$BASH_PROFILE"; then
        echo "" >> "$BASH_PROFILE"
        echo "# Start zsh automatically" >> "$BASH_PROFILE"
        echo 'if [ -t 0 ] && [ -z "$INSIDE_ZSH" ] && command -v zsh &> /dev/null; then' >> "$BASH_PROFILE"
        echo '    exec zsh' >> "$BASH_PROFILE"
        echo "fi" >> "$BASH_PROFILE"
        echo "✓ Added zsh auto-start to .bash_profile"
    fi
    
    return 0
}

# Try methods in order
if set_shell_chsh; then
    exit 0
fi

if set_shell_usermod; then
    exit 0
fi

if set_shell_passwd; then
    exit 0
fi

# Always fallback to profile method
set_shell_profile

echo ""
echo "Note: Log out and log back in for changes to take effect."
echo "Or run 'zsh' in current session to start using zsh immediately."
