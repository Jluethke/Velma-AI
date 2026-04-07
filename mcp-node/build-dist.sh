#!/bin/bash
# Build the distributable SkillChain MCP package
# Output: dist-package/ containing everything needed for installation
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DIST="$SCRIPT_DIR/dist-package"

echo "Building SkillChain MCP distribution..."

# Clean
rm -rf "$DIST"
mkdir -p "$DIST/marketplace/chains" "$DIST/server"

# 1. Copy compiled server + deps
echo "[1/4] Copying server files..."
cp "$SCRIPT_DIR/dist/"*.js "$DIST/server/"
cp "$SCRIPT_DIR/package.json" "$DIST/server/"

# 2. Copy marketplace data (skills + chains only — skip examples/tests/provenance)
echo "[2/4] Copying marketplace data (skills + chains)..."
SKILL_COUNT=0
for skill_dir in "$REPO_ROOT/marketplace"/*/; do
    skill_name=$(basename "$skill_dir")
    [ "$skill_name" = "chains" ] && continue
    [ ! -f "$skill_dir/skill.md" ] && continue
    mkdir -p "$DIST/marketplace/$skill_name"
    cp "$skill_dir/skill.md" "$DIST/marketplace/$skill_name/"
    [ -f "$skill_dir/manifest.json" ] && cp "$skill_dir/manifest.json" "$DIST/marketplace/$skill_name/"
    SKILL_COUNT=$((SKILL_COUNT + 1))
done
echo "  $SKILL_COUNT skills"

CHAIN_COUNT=0
for chain_file in "$REPO_ROOT/marketplace/chains/"*.chain.json; do
    [ -f "$chain_file" ] && cp "$chain_file" "$DIST/marketplace/chains/"
    CHAIN_COUNT=$((CHAIN_COUNT + 1))
done
echo "  $CHAIN_COUNT chains"

# 3. Create archives
echo "[3/5] Creating tarball (Unix)..."
cd "$DIST"
tar czf "$SCRIPT_DIR/skillchain-mcp-0.1.0.tar.gz" .
SIZE=$(du -h "$SCRIPT_DIR/skillchain-mcp-0.1.0.tar.gz" | cut -f1)
echo "  Archive: skillchain-mcp-0.1.0.tar.gz ($SIZE)"

echo "[4/5] Creating zip (Windows)..."
cd "$DIST"
python3 -c "
import zipfile, os
zippath = '$SCRIPT_DIR/skillchain-mcp-0.1.0.zip'
with zipfile.ZipFile(zippath, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('server'):
        for f in files:
            fp = os.path.join(root, f)
            zf.write(fp)
    for root, dirs, files in os.walk('marketplace'):
        for f in files:
            fp = os.path.join(root, f)
            zf.write(fp)
print(f'  Archive: skillchain-mcp-0.1.0.zip ({os.path.getsize(zippath) / 1024 / 1024:.1f}M)')
"

# 5. Done
echo "[5/5] Done."
echo ""
echo "Distribution package ready:"
echo "  $DIST/"
echo "  $SCRIPT_DIR/skillchain-mcp-0.1.0.tar.gz"
