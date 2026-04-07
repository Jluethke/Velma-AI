"""
Standalone MCP server launcher.
Run with: python -m skillchain.sdk.run_mcp
"""
import sys

from skillchain.sdk.mcp_bridge.server import create_server

if __name__ == "__main__":
    server = create_server()
    print("SkillChain MCP server starting...", file=sys.stderr)
    server.run()
