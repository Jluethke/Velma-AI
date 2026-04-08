#!/bin/bash
# SkillChain Uninstaller — macOS / Linux

echo ""
echo "  SkillChain Uninstaller"
echo "  ======================"
echo ""
echo "  This will remove SkillChain from your system."
echo "  Your wallet and on-chain data are NOT affected."
echo ""
read -p "  Are you sure? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo ""
    echo "  Uninstall cancelled."
    echo ""
    exit 0
fi

SC_DIR="$HOME/.skillchain"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"

echo ""
echo "  [1/5] Removing Claude Code integration..."
if [[ -f "$CLAUDE_SETTINGS" ]]; then
    python3 -c "
import json
path = '$CLAUDE_SETTINGS'
with open(path) as f:
    s = json.load(f)
if 'skillchain' in s.get('mcpServers', {}):
    del s['mcpServers']['skillchain']
    with open(path, 'w') as f:
        json.dump(s, f, indent=2)
    print('  Removed from Claude Code settings.')
else:
    print('  Not found in Claude Code settings.')
" 2>/dev/null || echo "  Could not modify Claude settings."
else
    echo "  Claude settings.json not found."
fi

echo "  [2/5] Removing CLAUDE.md instructions..."
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
if [[ -f "$CLAUDE_MD" ]]; then
    python3 -c "
import re
path = '$CLAUDE_MD'
with open(path) as f:
    content = f.read()
cleaned = re.sub(r'## SkillChain AI Skill Marketplace.*?(?=\n## |\Z)', '', content, flags=re.DOTALL).strip()
if cleaned:
    with open(path, 'w') as f:
        f.write(cleaned)
    print('  Cleaned SkillChain from CLAUDE.md')
else:
    import os
    os.remove(path)
    print('  Removed empty CLAUDE.md')
" 2>/dev/null || echo "  Could not modify CLAUDE.md."
else
    echo "  CLAUDE.md not found."
fi

echo "  [3/5] Removing PATH entry..."
SHELL_PROFILE=""
if [[ -f "$HOME/.zshrc" ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ -f "$HOME/.bashrc" ]]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_PROFILE" ]]; then
    sed -i.bak '/\.skillchain\/bin/d' "$SHELL_PROFILE"
    sed -i.bak '/# SkillChain/d' "$SHELL_PROFILE"
    rm -f "${SHELL_PROFILE}.bak"
    echo "  Removed from $SHELL_PROFILE"
else
    echo "  No shell profile found."
fi

echo "  [4/5] Removing SkillChain directory..."
if [[ -d "$SC_DIR" ]]; then
    rm -rf "$SC_DIR"
    echo "  Removed $SC_DIR"
else
    echo "  Directory not found."
fi

echo "  [5/5] Uninstalling pip package..."
pip3 uninstall skillchain -y --quiet 2>/dev/null || pip uninstall skillchain -y --quiet 2>/dev/null
echo "  Done."

echo ""
echo "  ========================================"
echo "  SkillChain has been uninstalled."
echo "  ========================================"
echo ""
echo "  What was removed:"
echo "    - MCP server from Claude Code settings"
echo "    - SkillChain instructions from CLAUDE.md"
echo "    - ~/.skillchain/ directory"
echo "    - skillchain pip package"
echo "    - PATH entry"
echo ""
echo "  What was NOT removed:"
echo "    - Your wallet and TRUST tokens"
echo "    - Any on-chain data"
echo "    - Your Claude Code installation"
echo ""
echo "  To reinstall: velma-ai.vercel.app"
echo ""
