#!/usr/bin/env bash

set -euo pipefail

HOSTS_FILE="/etc/hosts"

usage() {
    cat <<'EOF'
Usage:
  resolve_target.sh <hostname> [ip]

Behavior:
  1. Check whether <hostname> exists in /etc/hosts
  2. If found, print resolved metadata and exit 0
  3. If missing and [ip] is provided, append the mapping to /etc/hosts
  4. If missing and no [ip] is provided, exit non-zero
EOF
}

log() {
    printf '%s\n' "$*"
}

die() {
    printf 'ERROR=%s\n' "$*" >&2
    exit 1
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
fi

HOSTNAME_INPUT="${1:-}"
IP_INPUT="${2:-}"

[ -n "$HOSTNAME_INPUT" ] || die "hostname is required"
[ -r "$HOSTS_FILE" ] || die "$HOSTS_FILE is not readable"

find_host_ip() {
    awk -v host="$1" '
        /^[[:space:]]*#/ || NF < 2 { next }
        {
            for (i = 2; i <= NF; i++) {
                if ($i ~ /^#/) {
                    break
                }
                if ($i == host) {
                    print $1
                    exit
                }
            }
        }
    ' "$HOSTS_FILE"
}

validate_ip_token() {
    command -v python3 >/dev/null 2>&1 || die "python3 is required to validate IP addresses"
    python3 - "$1" <<'PY'
import ipaddress
import sys

try:
    ipaddress.ip_address(sys.argv[1])
except ValueError:
    raise SystemExit(1)
PY
}

validate_hostname_token() {
    [[ "$1" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]]
}

append_hosts_entry() {
    local ip="$1"
    local host="$2"
    local line
    line="$(printf '%s\t%s\n' "$ip" "$host")"

    if [ "$(id -u)" -eq 0 ]; then
        printf '%s' "$line" >> "$HOSTS_FILE"
    elif command -v sudo >/dev/null 2>&1; then
        printf '%s' "$line" | sudo tee -a "$HOSTS_FILE" >/dev/null
    else
        die "need root privileges to update $HOSTS_FILE"
    fi
}

validate_hostname_token "$HOSTNAME_INPUT" || die "hostname '$HOSTNAME_INPUT' contains invalid characters"
FOUND_IP="$(find_host_ip "$HOSTNAME_INPUT" || true)"

if [ -n "$FOUND_IP" ]; then
    log "TARGET_HOST=$HOSTNAME_INPUT"
    log "TARGET_IP=$FOUND_IP"
    log "TARGET_SOURCE=etc_hosts"
    exit 0
fi

if [ -z "$IP_INPUT" ]; then
    printf 'TARGET_HOST=%s\n' "$HOSTNAME_INPUT"
    printf 'TARGET_SOURCE=missing\n'
    die "hostname '$HOSTNAME_INPUT' was not found in $HOSTS_FILE"
fi

validate_ip_token "$IP_INPUT" || die "ip '$IP_INPUT' is not a valid IPv4 or IPv6 address"

append_hosts_entry "$IP_INPUT" "$HOSTNAME_INPUT"

FOUND_IP="$(find_host_ip "$HOSTNAME_INPUT" || true)"
[ -n "$FOUND_IP" ] || die "failed to verify hosts entry for '$HOSTNAME_INPUT'"

log "TARGET_HOST=$HOSTNAME_INPUT"
log "TARGET_IP=$FOUND_IP"
log "TARGET_SOURCE=added_to_etc_hosts"
