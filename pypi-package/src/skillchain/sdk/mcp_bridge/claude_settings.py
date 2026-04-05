"""
claude_settings.py
==================

Helper to install/uninstall the SkillChain MCP server in Claude Code's
settings file (~/.claude/settings.json).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)

_SETTINGS_PATH = Path.home() / ".claude" / "settings.json"
_MCP_KEY = "skillchain"


def _load_settings() -> Dict[str, Any]:
    """Load Claude Code settings, returning empty dict if absent."""
    if _SETTINGS_PATH.exists():
        try:
            return json.loads(_SETTINGS_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Failed to read Claude settings: %s", exc)
    return {}


def _save_settings(settings: Dict[str, Any]) -> None:
    """Write settings back to disk, preserving existing content."""
    _SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _SETTINGS_PATH.write_text(
        json.dumps(settings, indent=2), encoding="utf-8",
    )


def install_mcp_server() -> Path:
    """Add SkillChain to Claude Code's MCP settings.

    Adds the MCP server configuration to ``~/.claude/settings.json``
    under the ``mcpServers`` key. Preserves any existing settings.

    Returns:
        Path to the settings file that was modified.
    """
    settings = _load_settings()
    if "mcpServers" not in settings:
        settings["mcpServers"] = {}

    settings["mcpServers"][_MCP_KEY] = {
        "command": "skillchain",
        "args": ["mcp", "serve"],
        "env": {},
    }

    _save_settings(settings)
    logger.info("Installed SkillChain MCP server in %s", _SETTINGS_PATH)
    return _SETTINGS_PATH


def uninstall_mcp_server() -> bool:
    """Remove SkillChain from Claude Code's MCP settings.

    Returns:
        True if the server was found and removed, False if it wasn't present.
    """
    settings = _load_settings()
    mcp_servers = settings.get("mcpServers", {})

    if _MCP_KEY not in mcp_servers:
        return False

    del mcp_servers[_MCP_KEY]
    if not mcp_servers:
        del settings["mcpServers"]

    _save_settings(settings)
    logger.info("Uninstalled SkillChain MCP server from %s", _SETTINGS_PATH)
    return True


def is_installed() -> bool:
    """Check if the SkillChain MCP server is configured in Claude settings."""
    settings = _load_settings()
    return _MCP_KEY in settings.get("mcpServers", {})
