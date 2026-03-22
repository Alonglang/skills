#!/bin/bash
# Environment Detection Script for Zsh Setup
# Detects OS type, package manager, and existing configurations

set -e

detect_os() {
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        echo "$ID"
    elif [[ -f /etc/redhat-release ]]; then
        if grep -q "CentOS" /etc/redhat-release; then
            echo "centos"
        elif grep -q "Red Hat" /etc/redhat-release; then
            echo "rhel"
        else
            echo "unknown"
        fi
    elif [[ -f /etc/debian_version ]]; then
        echo "debian"
    elif [[ $(uname) == "Darwin" ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

detect_os_version() {
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        echo "${VERSION_ID:-unknown}"
    elif [[ -f /etc/redhat-release ]]; then
        grep -oE '[0-9]+\.[0-9]+' /etc/redhat-release | head -1
    elif [[ $(uname) == "Darwin" ]]; then
        sw_vers -productVersion
    else
        echo "unknown"
    fi
}

detect_package_manager() {
    local os="$1"
    case "$os" in
        ubuntu|debian|pop|kali)
            echo "apt"
            ;;
        fedora)
            echo "dnf"
            ;;
        centos|rhel|almalinux|rocky)
            if command -v dnf &> /dev/null; then
                echo "dnf"
            else
                echo "yum"
            fi
            ;;
        openeuler)
            echo "dnf"
            ;;
        arch)
            echo "pacman"
            ;;
        macos)
            echo "brew"
            ;;
        *)
            if command -v apt-get &> /dev/null; then
                echo "apt"
            elif command -v dnf &> /dev/null; then
                echo "dnf"
            elif command -v yum &> /dev/null; then
                echo "yum"
            elif command -v brew &> /dev/null; then
                echo "brew"
            else
                echo "unknown"
            fi
            ;;
    esac
}

check_zsh_installed() {
    if command -v zsh &> /dev/null; then
        echo "true"
    else
        echo "false"
    fi
}

check_ohmyzsh_installed() {
    if [[ -d "$HOME/.oh-my-zsh" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

check_p10k_installed() {
    if [[ -d "$HOME/.oh-my-zsh/custom/themes/powerlevel10k" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

check_autosuggestions() {
    if [[ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

check_syntax_highlighting() {
    if [[ -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

check_bashrc() {
    if [[ -f "$HOME/.bashrc" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

check_zshrc() {
    if [[ -f "$HOME/.zshrc" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

get_current_shell() {
    echo "$SHELL"
}

check_docker() {
    if command -v docker &> /dev/null; then
        echo "true"
    else
        echo "false"
    fi
}

check_kubectl() {
    if command -v kubectl &> /dev/null; then
        echo "true"
    else
        echo "false"
    fi
}

check_terraform() {
    if command -v terraform &> /dev/null; then
        echo "true"
    else
        echo "false"
    fi
}

check_git() {
    if command -v git &> /dev/null; then
        echo "true"
    else
        echo "false"
    fi
}

# Main execution
OS=$(detect_os)
OS_VERSION=$(detect_os_version)
PACKAGE_MANAGER=$(detect_package_manager "$OS")
ZSH_INSTALLED=$(check_zsh_installed)
OHMYZSH_INSTALLED=$(check_ohmyzsh_installed)
P10K_INSTALLED=$(check_p10k_installed)
AUTOSUGGESTIONS=$(check_autosuggestions)
SYNTAX_HL=$(check_syntax_highlighting)
HAS_BASHRC=$(check_bashrc)
HAS_ZSHRC=$(check_zshrc)
CURRENT_SHELL=$(get_current_shell)
DOCKER_INSTALLED=$(check_docker)
KUBECTL_INSTALLED=$(check_kubectl)
TERRAFORM_INSTALLED=$(check_terraform)
GIT_INSTALLED=$(check_git)

# Output JSON
cat << EOF
{
  "os": "$OS",
  "os_version": "$OS_VERSION",
  "package_manager": "$PACKAGE_MANAGER",
  "zsh_installed": $ZSH_INSTALLED,
  "ohmyzsh_installed": $OHMYZSH_INSTALLED,
  "p10k_installed": $P10K_INSTALLED,
  "autosuggestions_installed": $AUTOSUGGESTIONS,
  "syntax_highlighting_installed": $SYNTAX_HL,
  "has_bashrc": $HAS_BASHRC,
  "has_zshrc": $HAS_ZSHRC,
  "current_shell": "$CURRENT_SHELL",
  "docker_installed": $DOCKER_INSTALLED,
  "kubectl_installed": $KUBECTL_INSTALLED,
  "terraform_installed": $TERRAFORM_INSTALLED,
  "git_installed": $GIT_INSTALLED
}
EOF
