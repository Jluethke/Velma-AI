#!/bin/bash
# SkillChain Installer — macOS / Linux
# Requires Claude Code (which includes Node.js).
set -e

SC_DIR="$HOME/.skillchain"
CLAUDE_DIR="$HOME/.claude"
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

# Check for Node.js (ships with Claude Code)
echo "  [1/6] Checking Node.js..."
if ! command -v node &>/dev/null; then
    echo ""
    echo "  ERROR: Node.js not found."
    echo ""
    echo "  SkillChain requires Claude Code, which includes Node.js."
    echo "  Install Claude Code first: https://claude.ai/download"
    echo ""
    echo "  If you already have Claude Code, try restarting your terminal."
    exit 1
fi
echo "  Found Node.js $(node --version)"

# Create directories
echo "  [2/6] Setting up directories..."
mkdir -p "$SC_DIR"/{skills,state,chains,server,marketplace/chains}

# Download and extract
echo "  [3/6] Downloading SkillChain..."
curl -sSL -o "/tmp/skillchain-mcp.tar.gz" "$DOWNLOAD_URL"
tar -xzf "/tmp/skillchain-mcp.tar.gz" -C "$SC_DIR"
rm -f "/tmp/skillchain-mcp.tar.gz"
echo "  Downloaded and extracted."

# Install Node.js dependencies
echo "  [4/6] Installing server dependencies..."
cd "$SC_DIR/server"
npm install --omit=dev --silent 2>/dev/null || npm install --omit=dev

# Configure Claude Code
echo "  [5/6] Configuring Claude Code..."
mkdir -p "$CLAUDE_DIR"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"

node -e "
const fs = require('fs');
const p = '$CLAUDE_SETTINGS';
let s = {};
try { s = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch {}
if (!s.mcpServers) s.mcpServers = {};
s.mcpServers.skillchain = {
  command: 'node',
  args: ['$SC_DIR/server/index.js'],
  env: {}
};
fs.writeFileSync(p, JSON.stringify(s, null, 2), 'utf-8');
console.log('  MCP server registered in ' + p);
" || {
    echo "  WARNING: Could not auto-configure Claude Code."
    echo "  You may need to add the MCP server manually."
}

# Initialize profiles
echo "  [6/6] Initializing trainer profile..."
if [ ! -f "$SC_DIR/trainer.json" ]; then
    echo '{"xp":0,"level":1,"title":"Novice","skills_discovered":[],"chains_completed":[],"achievements_unlocked":{},"streak_current":0,"streak_best":0,"streak_last_date":"","evolution_levels":{},"daily_runs_today":[],"daily_runs_date":"","categories_today":[],"total_skill_runs":0,"total_chain_runs":0}' > "$SC_DIR/trainer.json"
fi
if [ ! -f "$SC_DIR/profile.json" ]; then
    echo '{"display_name":"","role":"","industry":"","stage":"","team_size":"","experience_level":"","tech_stack":[],"goals":[],"preferred_output_style":"structured","preferred_tone":"friendly","favorite_domains":[],"skills_used":[],"chains_used":[],"created_at":"","updated_at":""}' > "$SC_DIR/profile.json"
fi

# Validate
echo ""
VALID=1

if [ -f "$SC_DIR/server/index.js" ]; then
    echo "  MCP server: OK (installed)"
else
    echo "  WARNING: MCP server files not found."
    VALID=0
fi

if [ -f "$CLAUDE_SETTINGS" ]; then
    node -e "const s=JSON.parse(require('fs').readFileSync('$CLAUDE_SETTINGS','utf-8'));if(s.mcpServers&&s.mcpServers.skillchain)console.log('  Claude config: OK');else{console.log('  WARNING: not in settings');process.exit(1)}" || VALID=0
else
    echo "  WARNING: Claude settings.json not found."
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
echo "    1. Restart Claude Code (or any AI with MCP support)"
echo "    2. Just talk to it normally"
echo "    3. Say things like:"
echo "       - \"I hate my job\""
echo "       - \"I feel stuck\""
echo "       - \"help me budget\""
echo "       - \"I'm scared of AI\""
echo "    4. Claude will find the right skill chain"
echo "       and walk you through it"
echo ""
echo "  Your AI just got 126 skills and 92 chains."
echo "  No extra apps. No websites. Just talk."
echo ""
