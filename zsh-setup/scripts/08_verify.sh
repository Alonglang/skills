#!/bin/bash
# Verify Installation Script
# Verifies zsh, oh-my-zsh, and plugins are correctly installed

echo "=========================================="
echo "Zsh Setup Verification"
echo "=========================================="
echo ""

ERRORS=0

# Check zsh installation
echo "[1] Checking zsh installation..."
if command -v zsh &> /dev/null; then
    echo "  ✓ zsh: $(zsh --version)"
else
    echo "  ✗ zsh: NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

# Check oh-my-zsh installation
echo ""
echo "[2] Checking oh-my-zsh installation..."
OHMYZSH_DIR="$HOME/.oh-my-zsh"
if [[ -d "$OHMYZSH_DIR" ]]; then
    echo "  ✓ oh-my-zsh: installed at $OHMYZSH_DIR"
else
    echo "  ✗ oh-my-zsh: NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

# Check Powerlevel10k theme
echo ""
echo "[3] Checking Powerlevel10k theme..."
P10K_DIR="$HOME/.oh-my-zsh/custom/themes/powerlevel10k"
if [[ -d "$P10K_DIR" ]]; then
    echo "  ✓ Powerlevel10k: installed"
else
    echo "  ✗ Powerlevel10k: NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

# Check plugins
echo ""
echo "[4] Checking plugins..."
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
PLUGIN_DIR="$ZSH_CUSTOM/plugins"

declare -A PLUGINS=(
    ["zsh-autosuggestions"]="Auto suggestions"
    ["zsh-syntax-highlighting"]="Syntax highlighting"
)

for plugin in "${!PLUGINS[@]}"; do
    if [[ -d "$PLUGIN_DIR/$plugin" ]]; then
        echo "  ✓ ${PLUGINS[$plugin]}: installed"
    else
        echo "  ✗ ${PLUGINS[$plugin]}: NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check .zshrc
echo ""
echo "[5] Checking .zshrc configuration..."
ZSHRC="$HOME/.zshrc"
if [[ -f "$ZSHRC" ]]; then
    echo "  ✓ .zshrc: exists"
    
    # Check theme setting
    if grep -q 'ZSH_THEME="powerlevel10k' "$ZSHRC"; then
        echo "  ✓ Theme: Powerlevel10k configured"
    else
        echo "  ✗ Theme: Powerlevel10k NOT configured"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check plugins
    if grep -q 'zsh-autosuggestions' "$ZSHRC"; then
        echo "  ✓ Plugins: configured"
    else
        echo "  ✗ Plugins: NOT configured"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check syntax
    echo ""
    echo "[6] Checking .zshrc syntax..."
    if zsh -n "$ZSHRC" 2>/dev/null; then
        echo "  ✓ .zshrc: syntax OK"
    else
        echo "  ✗ .zshrc: syntax error!"
        zsh -n "$ZSHRC" 2>&1 | head -5
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ✗ .zshrc: NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

# Check default shell
echo ""
echo "[7] Checking default shell..."
CURRENT_SHELL=$(getent passwd $(whoami) | cut -d: -f7)
if [[ "$CURRENT_SHELL" == *zsh* ]]; then
    echo "  ✓ Default shell: zsh ($CURRENT_SHELL)"
else
    echo "  ⚠ Default shell: $CURRENT_SHELL (not zsh)"
    echo "    Run 'zsh' to start using zsh, or logout/login to change default shell"
fi

# Summary
echo ""
echo "=========================================="
if [[ $ERRORS -eq 0 ]]; then
    echo "✓ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'zsh' to start using zsh"
    echo "  2. On first launch, Powerlevel10k will show a setup wizard"
    echo "  3. Run 'p10k configure' anytime to reconfigure the theme"
else
    echo "✗ $ERRORS error(s) found"
    echo ""
    echo "Please review the errors above and fix them manually."
fi
echo "=========================================="
