#!/bin/bash
# SkillChain Installer — macOS / Linux
set -e

SC_DIR="$HOME/.skillchain"
CLAUDE_DIR="$HOME/.claude"

cleanup_on_failure() {
    echo ""
    echo "  Installation FAILED"
    echo "  Cleaning up partial installation..."
    rm -f "$SC_DIR/bin/skillchain" 2>/dev/null
    echo "  Check the error messages above and try again."
    echo "  For manual install: pip install skillchain"
    echo ""
    exit 1
}

trap cleanup_on_failure ERR

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
        # Detect Linux distro and use the right package manager
        if command -v apt-get &>/dev/null; then
            echo "  Installing Python 3 via apt-get..."
            sudo apt-get update -qq && sudo apt-get install -y -qq python3 python3-pip
        elif command -v dnf &>/dev/null; then
            echo "  Installing Python 3 via dnf..."
            sudo dnf install -y python3 python3-pip
        elif command -v yum &>/dev/null; then
            echo "  Installing Python 3 via yum..."
            sudo yum install -y python3 python3-pip
        elif command -v pacman &>/dev/null; then
            echo "  Installing Python 3 via pacman..."
            sudo pacman -Sy --noconfirm python python-pip
        elif command -v apk &>/dev/null; then
            echo "  Installing Python 3 via apk..."
            sudo apk add python3 py3-pip
        elif command -v zypper &>/dev/null; then
            echo "  Installing Python 3 via zypper..."
            sudo zypper install -y python3 python3-pip
        else
            echo "  ERROR: Could not detect package manager."
            echo "  Please install Python 3.11+ manually and re-run this script."
            exit 1
        fi
    fi
fi

# Install SkillChain
echo "  [1/6] Installing SkillChain SDK..."
pip3 install skillchain --quiet 2>/dev/null || pip install skillchain --quiet || {
    echo "  WARNING: pip install skillchain failed, installing dependencies..."
    pip3 install click cryptography rich requests numpy --quiet 2>/dev/null || true
}

# Configure Claude Code
echo "  [2/6] Configuring Claude Code integration..."
python3 -c "from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server; install_mcp_server()" 2>/dev/null || {
    echo "  WARNING: Could not auto-configure Claude Code."
}

# Create directories
echo "  [3/6] Setting up directories..."
mkdir -p "$SC_DIR"/{skills,state,chains,bin,marketplace}

# Initialize trainer
echo "  [4/6] Creating trainer profile..."
python3 -c "from skillchain.sdk.gamification import GamificationEngine; e = GamificationEngine(); c = e.get_trainer_card(); print(f'  Level {c[\"level\"]} {c[\"title\"]}')" 2>/dev/null || true

# Register PATH
echo "  [5/6] Registering PATH..."
BIN_DIR="$SC_DIR/bin"

# Create wrapper script
cat > "$BIN_DIR/skillchain" << 'WRAPPER'
#!/bin/bash
python3 -m skillchain.sdk.cli "$@"
WRAPPER
chmod +x "$BIN_DIR/skillchain"

# Add to PATH in shell profile
SHELL_PROFILE=""
if [[ -f "$HOME/.zshrc" ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ -f "$HOME/.bashrc" ]]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_PROFILE" ]]; then
    if ! grep -q ".skillchain/bin" "$SHELL_PROFILE" 2>/dev/null; then
        echo '' >> "$SHELL_PROFILE"
        echo '# SkillChain' >> "$SHELL_PROFILE"
        echo 'export PATH="$HOME/.skillchain/bin:$PATH"' >> "$SHELL_PROFILE"
        echo "  Added to PATH in $SHELL_PROFILE"
        echo "  Run: source $SHELL_PROFILE  (or restart your terminal)"
    else
        echo "  Already on PATH."
    fi
else
    echo "  WARNING: Could not find shell profile (.zshrc/.bashrc)."
    echo "  Manually add to PATH: export PATH=\"\$HOME/.skillchain/bin:\$PATH\""
fi

# Validate installation
echo "  [6/6] Validating installation..."
VALID=1

if [[ ! -d "$SC_DIR/marketplace" ]]; then
    echo "  Marketplace: Skills load on first use from the network."
fi

python3 -c "from skillchain.sdk.mcp_bridge.server import create_server; s = create_server(); print('  MCP server: OK')" 2>/dev/null || {
    echo "  WARNING: MCP server import failed."
    echo "  Ensure 'mcp' package is installed: pip install mcp"
    VALID=0
}

if [[ -f "$CLAUDE_DIR/settings.json" ]]; then
    python3 -c "import json; s=json.load(open('$CLAUDE_DIR/settings.json')); assert 'skillchain' in s.get('mcpServers',{}); print('  Claude config: OK')" 2>/dev/null || {
        echo "  WARNING: SkillChain not found in Claude MCP settings."
        VALID=0
    }
else
    echo "  WARNING: Claude settings.json not found."
    VALID=0
fi

echo ""
if [[ "$VALID" -eq 1 ]]; then
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
