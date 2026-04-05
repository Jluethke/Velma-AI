"""
Standalone MCP server launcher.
Run with: python run_mcp.py
"""
import sys
from pathlib import Path

# Add the repo root to sys.path so "skillchain.sdk" is a proper package
repo_root = Path(__file__).parent.parent  # SkillChain/
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

# Now import via the full package path
from skillchain.sdk.mcp_bridge.server import create_server

if __name__ == "__main__":
    server = create_server()
    print("SkillChain MCP server starting...", file=sys.stderr)
    server.run()
