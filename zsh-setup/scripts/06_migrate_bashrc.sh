#!/bin/bash
# Migrate Bashrc to Zshrc Script
# Migrates user configurations from .bashrc to .zshrc

set -e

BASHRC="$HOME/.bashrc"
ZSHRC="$HOME/.zshrc"
MIGRATION_MARKER="# >>> migrated from bashrc >>>"
MIGRATION_END_MARKER="# <<< migrated from bashrc <<<"

# Check if bashrc exists
if [[ ! -f "$BASHRC" ]]; then
    echo "No .bashrc found, skipping migration"
    exit 0
fi

# Check if bashrc has content to migrate
if [[ ! -s "$BASHRC" ]]; then
    echo ".bashrc is empty, skipping migration"
    exit 0
fi

echo "Starting bashrc migration..."

# Create backup
cp "$ZSHRC" "${ZSHRC}.migration.bak" 2>/dev/null || true

# Remove any existing migration block
if grep -q "$MIGRATION_MARKER" "$ZSHRC"; then
    echo "Removing previous migration block..."
    sed -i "/$MIGRATION_MARKER/,/$MIGRATION_END_MARKER/d" "$ZSHRC"
fi

# Read and process bashrc content
echo "Processing .bashrc content..."

# Initialize migration content
MIGRATION_CONTENT="$MIGRATION_MARKER"
MIGRATION_CONTENT+="\n# This section was automatically migrated from .bashrc"
MIGRATION_CONTENT+="\n# $(date)\n"

# Process each line
SKIP_LINES=0
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip commented lines that are not important user configs
    if [[ "$line" =~ ^[[:space:]]*# ]]; then
        # Keep important comments like license, important notes
        if [[ "$line" =~ (TODO|FIXME|NOTE|IMPORTANT) ]]; then
            MIGRATION_CONTENT+="$line\n"
        fi
        continue
    fi
    
    # Skip empty lines at start
    if [[ -z "$line" ]]; then
        continue
    fi
    
    # Convert bash-specific syntax to zsh-compatible
    processed_line="$line"
    
    # Remove common bash-specific source lines that oh-my-zsh handles
    if [[ "$line" =~ ^[[:space:]]*source[[:space:]]+/etc/bashrc ]]; then
        continue
    fi
    if [[ "$line" =~ ^[[:space:]]*\.\ /etc/bashrc ]]; then
        continue
    fi
    
    # Convert [ to [[ for conditionals (simple cases)
    if [[ "$line" =~ ^[[:space:]]*if[[:space:]]+\[ ]]; then
        processed_line="${line//\[/[}"
    fi
    
    # Keep the line
    MIGRATION_CONTENT+="$processed_line\n"
    
done < "$BASHRC"

MIGRATION_CONTENT+="\n$MIGRATION_END_MARKER"

# Find the insertion point (after "source $ZSH/oh-my-zsh.sh" or before custom aliases)
if grep -q "source \$ZSH/oh-my-zsh.sh" "$ZSHRC"; then
    # Insert after oh-my-zsh.sh source
    INSERT_AFTER="source \$ZSH/oh-my-zsh.sh"
else
    # Insert at end of file
    INSERT_AFTER=""
fi

# Perform the insertion
if [[ -n "$INSERT_AFTER" ]]; then
    # Insert after the specified line
    sed -i "/$INSERT_AFTER/a\\
\\
$MIGRATION_MARKER\\
# Migrated from .bashrc on $(date)\\
$(echo "$MIGRATION_CONTENT" | sed 's/\\/\\\\/g' | sed 's/\//\\//g' | sed 's/&/\\&/g')\\
$MIGRATION_END_MARKER" "$ZSHRC"
else
    # Append to end
    echo "" >> "$ZSHRC"
    echo "$MIGRATION_CONTENT" >> "$ZSHRC"
fi

# Clean up any double blank lines
sed -i '/^$/{ N; /^\n$/d; }' "$ZSHRC"

echo "✓ Migration complete"
echo ""
echo "Migrated items:"
echo "  - Aliases"
echo "  - Environment variables"
echo "  - PATH modifications"
echo "  - Custom exports"
echo ""
echo "Backup saved to: ${ZSHRC}.migration.bak"
echo ""
echo "Please review the migrated content in .zshrc and"
echo "adjust if necessary. Run 'zsh' to test."
