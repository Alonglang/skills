#!/usr/bin/env bash

set -euo pipefail

SSH_PORT=2822
SSH_USER=root

usage() {
    cat <<'EOF'
Usage:
  ensure_ssh_key_auth.sh <hostname>

Behavior:
  1. Reuse an existing local SSH public key if available
  2. Generate ~/.ssh/id_ed25519 if no public key exists
  3. Test key-based auth with ssh -p 2822 root@hostname
  4. If needed, run ssh-copy-id -p 2822 root@hostname
  5. Re-test and exit non-zero on failure
EOF
}

die() {
    printf 'ERROR=%s\n' "$*" >&2
    exit 1
}

log() {
    printf '%s\n' "$*"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

TARGET_HOST="${1:-}"
[ -n "$TARGET_HOST" ] || die "hostname is required"

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

require_cmd ssh
require_cmd ssh-keygen

GENERATED_KEY=0
PUBLIC_KEY=""
IDENTITY_FILE=""

find_public_key() {
    local identity="${SSH_HOST_OPS_IDENTITY_FILE:-}"
    local candidates=()
    local candidate

    if [ -n "$identity" ]; then
        if [ "${identity##*.}" = "pub" ]; then
            candidates+=("$identity")
        else
            candidates+=("${identity}.pub")
        fi
    fi

    candidates+=(
        "$HOME/.ssh/id_ed25519.pub"
        "$HOME/.ssh/id_ecdsa.pub"
        "$HOME/.ssh/id_rsa.pub"
        "$HOME/.ssh/id_dsa.pub"
    )

    for candidate in "${candidates[@]}"; do
        [ -n "$candidate" ] || continue
        if [ -f "$candidate" ] && [ -f "${candidate%.pub}" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done
    return 1
}

find_private_key() {
    local identity="${SSH_HOST_OPS_IDENTITY_FILE:-}"
    local candidates=()
    local candidate

    if [ -n "$identity" ]; then
        if [ "${identity##*.}" = "pub" ]; then
            candidates+=("${identity%.pub}")
        else
            candidates+=("$identity")
        fi
    fi

    candidates+=(
        "$HOME/.ssh/id_ed25519"
        "$HOME/.ssh/id_ecdsa"
        "$HOME/.ssh/id_rsa"
        "$HOME/.ssh/id_dsa"
    )

    for candidate in "${candidates[@]}"; do
        [ -n "$candidate" ] || continue
        if [ -f "$candidate" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done
    return 1
}

ensure_public_key() {
    local pubkey
    local private_key

    if pubkey="$(find_public_key)"; then
        GENERATED_KEY=0
        PUBLIC_KEY="$pubkey"
        if [ -f "${pubkey%.pub}" ]; then
            IDENTITY_FILE="${pubkey%.pub}"
        else
            IDENTITY_FILE=""
        fi
        return 0
    fi

    if private_key="$(find_private_key)"; then
        GENERATED_KEY=0
        ssh-keygen -y -f "$private_key" > "${private_key}.pub"
        PUBLIC_KEY="${private_key}.pub"
        IDENTITY_FILE="$private_key"
        return 0
    fi

    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"

    GENERATED_KEY=1
    ssh-keygen -t ed25519 -N "" -f "$HOME/.ssh/id_ed25519" >/dev/null
    PUBLIC_KEY="$HOME/.ssh/id_ed25519.pub"
    IDENTITY_FILE="$HOME/.ssh/id_ed25519"
}

test_key_auth() {
    local ssh_cmd=(
        ssh
        -p "$SSH_PORT"
        -o BatchMode=yes
        -o ConnectTimeout=8
        -o StrictHostKeyChecking=yes
    )

    if [ -n "$IDENTITY_FILE" ]; then
        ssh_cmd+=(-i "$IDENTITY_FILE" -o IdentitiesOnly=yes)
    fi

    ssh_cmd+=("${SSH_USER}@${TARGET_HOST}" "true")
    "${ssh_cmd[@]}" >/dev/null 2>&1
}

ensure_public_key

if test_key_auth; then
    log "TARGET=${SSH_USER}@${TARGET_HOST}:${SSH_PORT}"
    log "PUBLIC_KEY=$PUBLIC_KEY"
    log "GENERATED_KEY=${GENERATED_KEY:-0}"
    log "AUTH_STATUS=already_configured"
    exit 0
fi

require_cmd ssh-copy-id

ssh-copy-id \
    -p "$SSH_PORT" \
    -i "$PUBLIC_KEY" \
    "${SSH_USER}@${TARGET_HOST}"

if ! test_key_auth; then
    die "ssh-copy-id completed but key-based auth still failed for ${SSH_USER}@${TARGET_HOST}:${SSH_PORT}"
fi

log "TARGET=${SSH_USER}@${TARGET_HOST}:${SSH_PORT}"
log "PUBLIC_KEY=$PUBLIC_KEY"
log "GENERATED_KEY=${GENERATED_KEY:-0}"
log "AUTH_STATUS=configured_via_ssh_copy_id"
