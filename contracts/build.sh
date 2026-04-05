#!/bin/bash
# Run from the contracts directory
export PATH="$HOME/.foundry/bin:$PATH"
cd "$(dirname "$0")"
echo "=== forge build ==="
forge build 2>&1
echo ""
echo "=== Exit code: $? ==="
