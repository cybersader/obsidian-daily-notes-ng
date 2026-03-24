#!/bin/bash
# Launch Obsidian with remote debugging port for E2E testing.
# Usage: bash e2e-launch.sh [vault-path]

VAULT_PATH="${1:-$(pwd)/test-vault}"
PORT=9333

echo "Launching Obsidian with debug port $PORT..."
echo "Vault: $VAULT_PATH"

# Detect platform
if grep -qi microsoft /proc/version 2>/dev/null; then
  # WSL2: Use Windows Obsidian
  WIN_PATH=$(wslpath -w "$VAULT_PATH")
  OBSIDIAN_EXE=$(find /mnt/c/Users/*/AppData/Local/Obsidian/Obsidian.exe 2>/dev/null | head -1)
  if [ -z "$OBSIDIAN_EXE" ]; then
    echo "Error: Obsidian.exe not found"
    exit 1
  fi
  "$OBSIDIAN_EXE" --remote-debugging-port=$PORT "obsidian://open?path=$WIN_PATH" &
elif [ "$(uname)" = "Darwin" ]; then
  # macOS
  open -a Obsidian --args --remote-debugging-port=$PORT "obsidian://open?path=$VAULT_PATH"
else
  # Linux
  obsidian --remote-debugging-port=$PORT "obsidian://open?path=$VAULT_PATH" &
fi

echo "Obsidian launched. Connect Playwright to port $PORT"
