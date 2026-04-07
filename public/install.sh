#!/bin/bash
# SkillChain Installer — macOS / Linux
# No dependencies required. Downloads everything pre-bundled.
set -e

SC_DIR="$HOME/.skillchain"
DOWNLOAD_URL="https://velma-ai.vercel.app/skillchain-mcp-0.1.0.tar.gz"

cleanup_on_failure() {
    echo ""
    echo "  Installation FAILED"
    echo "  Check the error messages above and try again."
    echo ""
    exit 1
}

trap cleanup_on_failure ERR

echo ""
echo "  SkillChain - AI Skill Marketplace"
echo "  =================================="
echo ""

# Create directories
echo "  [1/5] Setting up directories..."
mkdir -p "$SC_DIR"/{skills,state,chains,server,marketplace/chains}

# Download and extract (node_modules pre-bundled)
echo "  [2/5] Downloading SkillChain..."
if command -v curl &>/dev/null; then
    curl -sSL -o "/tmp/skillchain-mcp.tar.gz" "$DOWNLOAD_URL"
elif command -v wget &>/dev/null; then
    wget -q -O "/tmp/skillchain-mcp.tar.gz" "$DOWNLOAD_URL"
else
    echo "  ERROR: Neither curl nor wget found."
    echo "  Install one and re-run: brew install curl (macOS) / sudo apt install curl (Linux)"
    exit 1
fi
tar -xzf "/tmp/skillchain-mcp.tar.gz" -C "$SC_DIR"
rm -f "/tmp/skillchain-mcp.tar.gz"
echo "  Downloaded and extracted."

# Install Claude Code instructions
echo "  [3/6] Installing Claude Code instructions..."
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
mkdir -p "$HOME/.claude"
if [ -f "$SC_DIR/INSTRUCTIONS.md" ]; then
    if [ -f "$CLAUDE_MD" ] && grep -q "SkillChain AI Skill Marketplace" "$CLAUDE_MD" 2>/dev/null; then
        echo "  SkillChain instructions already in CLAUDE.md"
    else
        cat "$SC_DIR/INSTRUCTIONS.md" >> "$CLAUDE_MD"
        echo "  Added SkillChain instructions to CLAUDE.md"
    fi
else
    echo "  WARNING: INSTRUCTIONS.md not found in package."
fi

# Configure MCP clients
echo "  [4/6] Configuring MCP clients..."
SERVER_PATH="$SC_DIR/server/index.js"
CONFIGURED=0

configure_json() {
    local SETTINGS_FILE="$1"
    local KEY="$2"  # mcpServers or servers
    local DISPLAY_NAME="$3"

    # Use python3 if available, otherwise python, otherwise skip
    local PY=""
    if command -v python3 &>/dev/null; then PY="python3"
    elif command -v python &>/dev/null; then PY="python"
    fi

    if [ -n "$PY" ]; then
        $PY -c "
import json, os
p = '$SETTINGS_FILE'
s = {}
if os.path.exists(p):
    try:
        with open(p) as f: s = json.load(f)
    except: pass
if '$KEY' not in s: s['$KEY'] = {}
s['$KEY']['skillchain'] = {'command': 'node', 'args': ['$SERVER_PATH'], 'env': {}}
with open(p, 'w') as f: json.dump(s, f, indent=2)
print('  $DISPLAY_NAME: configured')
" && CONFIGURED=1
    else
        # Fallback: create minimal JSON if file doesn't exist
        if [ ! -f "$SETTINGS_FILE" ]; then
            echo "{\"$KEY\":{\"skillchain\":{\"command\":\"node\",\"args\":[\"$SERVER_PATH\"],\"env\":{}}}}" > "$SETTINGS_FILE"
            echo "  $DISPLAY_NAME: configured (new file)"
            CONFIGURED=1
        else
            echo "  $DISPLAY_NAME: skipped (no python to safely edit existing JSON)"
        fi
    fi
}

# Claude Code
if [ -d "$HOME/.claude" ]; then
    configure_json "$HOME/.claude/settings.json" "mcpServers" "Claude Code"
else
    echo "  Claude Code: not detected"
fi

# Cursor
if [ -d "$HOME/.cursor" ]; then
    configure_json "$HOME/.cursor/mcp.json" "mcpServers" "Cursor"
else
    echo "  Cursor: not detected"
fi

# Windsurf
if [ -d "$HOME/.codeium/windsurf" ]; then
    configure_json "$HOME/.codeium/windsurf/mcp_config.json" "mcpServers" "Windsurf"
else
    echo "  Windsurf: not detected"
fi

# VS Code
if [ -d "$HOME/.vscode" ]; then
    configure_json "$HOME/.vscode/mcp.json" "servers" "VS Code"
else
    echo "  VS Code: not detected"
fi

if [ "$CONFIGURED" -eq 0 ]; then
    echo ""
    echo "  No MCP client found. You need one to use SkillChain."
    echo "  Install Claude Code: https://claude.ai/download"
    echo "  Or use: Cursor, Windsurf, VS Code"
    echo ""
    echo "  After installing, re-run this installer to auto-configure."
    # Pre-create for Claude Code
    mkdir -p "$HOME/.claude"
    configure_json "$HOME/.claude/settings.json" "mcpServers" "Claude Code (pre-configured)"
fi

# Initialize profiles
echo "  [5/6] Initializing profiles..."
if [ ! -f "$SC_DIR/trainer.json" ]; then
    echo '{"xp":0,"level":1,"title":"Novice","skills_discovered":[],"chains_completed":[],"achievements_unlocked":{},"streak_current":0,"streak_best":0,"streak_last_date":"","evolution_levels":{},"daily_runs_today":[],"daily_runs_date":"","categories_today":[],"total_skill_runs":0,"total_chain_runs":0}' > "$SC_DIR/trainer.json"
fi
if [ ! -f "$SC_DIR/profile.json" ]; then
    echo '{"display_name":"","role":"","industry":"","stage":"","team_size":"","experience_level":"","tech_stack":[],"goals":[],"preferred_output_style":"structured","preferred_tone":"friendly","favorite_domains":[],"skills_used":[],"chains_used":[],"created_at":"","updated_at":""}' > "$SC_DIR/profile.json"
fi

# Validate
echo "  [6/6] Validating..."
VALID=1

if [ -f "$SC_DIR/server/index.js" ]; then
    echo "  MCP server: OK"
else
    echo "  WARNING: MCP server files not found."
    VALID=0
fi

echo ""
if [ "$VALID" -eq 1 ]; then
    echo "  ========================================"
    echo "  Installation complete! All checks passed."
    echo "  ========================================"
else
    echo "  ========================================"
    echo "  Installation complete with warnings."
    echo "  ========================================"
    echo "  Check the warnings above."
fi
echo ""
echo "  What happens now:"
echo "    1. Open any MCP-compatible AI tool:"
echo "       Claude Code, Cursor, Windsurf, VS Code, etc."
echo "    2. Just talk normally"
echo "    3. Say things like:"
echo "       - \"I hate my job\""
echo "       - \"I feel stuck\""
echo "       - \"help me budget\""
echo "       - \"I'm scared of AI\""
echo "    4. Your AI will find the right skill chain"
echo "       and walk you through it"
echo ""
echo "  Your AI just got 126 skills and 92 chains."
echo "  No extra apps. No websites. Just talk."
echo ""
