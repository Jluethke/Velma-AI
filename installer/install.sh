#!/bin/bash
# SkillChain Installer — macOS / Linux
set -e

echo ""
echo "  SkillChain - AI Skill Marketplace"
echo "  =================================="
echo ""

# Check for Python
if ! command -v python3 &>/dev/null; then
    echo "  Python 3 not found."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Installing via Homebrew..."
        if ! command -v brew &>/dev/null; then
            echo "  Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install python@3.11
    else
        echo "  Installing Python 3..."
        sudo apt-get update -qq && sudo apt-get install -y -qq python3 python3-pip
    fi
fi

# Install SkillChain
echo "  [1/4] Installing SkillChain SDK..."
pip3 install skillchain --quiet 2>/dev/null || pip install skillchain --quiet

# Configure Claude Code
echo "  [2/4] Configuring Claude Code integration..."
python3 -c "from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server; install_mcp_server()" 2>/dev/null

# Create directories
echo "  [3/4] Setting up directories..."
mkdir -p ~/.skillchain/skills ~/.skillchain/state ~/.skillchain/chains

# Initialize trainer
echo "  [4/4] Creating trainer profile..."
python3 -c "from skillchain.sdk.gamification import GamificationEngine; e = GamificationEngine(); c = e.get_trainer_card(); print(f'  Level {c[\"level\"]} {c[\"title\"]}')" 2>/dev/null

echo ""
echo "  ========================================"
echo "  Installation complete!"
echo "  ========================================"
echo ""
echo "  What happens now:"
echo "    1. Restart Claude Code"
echo "    2. Just talk to it normally"
echo "    3. Say things like:"
echo "       - \"I hate my job\""
echo "       - \"I feel stuck\""
echo "       - \"help me budget\""
echo "    4. Claude will find the right skill chain"
echo ""
echo "  Your AI just got 120 skills and 65 chains."
echo ""
