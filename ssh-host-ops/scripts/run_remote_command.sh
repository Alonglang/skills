#!/usr/bin/env bash

set -euo pipefail

SSH_PORT=2822
SSH_USER=root

usage() {
    cat <<'EOF'
Usage:
  run_remote_command.sh <hostname> --probe-os
  run_remote_command.sh <hostname> -- '<command>'
  run_remote_command.sh <hostname> -- <command> [args...]
EOF
}

die() {
    printf 'ERROR=%s\n' "$*" >&2
    exit 1
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

TARGET_HOST="${1:-}"
MODE="${2:-}"

[ -n "$TARGET_HOST" ] || die "hostname is required"
[ -n "$MODE" ] || die "mode is required"
command -v ssh >/dev/null 2>&1 || die "required command not found: ssh"

shift 2

SSH_BASE=(
    ssh
    -p "$SSH_PORT"
    "${SSH_USER}@${TARGET_HOST}"
)

if [ "$MODE" = "--probe-os" ]; then
    PROBE_CMD='uname -s; [ -f /etc/os-release ] && cat /etc/os-release; if command -v sw_vers >/dev/null 2>&1; then sw_vers; fi'
    exec "${SSH_BASE[@]}" "$PROBE_CMD"
fi

[ "$MODE" = "--" ] || die "unsupported mode: $MODE"
[ "$#" -gt 0 ] || die "remote command is required after --"

if [ "$#" -eq 1 ]; then
    REMOTE_CMD="$1"
else
    printf -v REMOTE_CMD '%q ' "$@"
    REMOTE_CMD="${REMOTE_CMD% }"
fi

exec "${SSH_BASE[@]}" "$REMOTE_CMD"
