"""
hooks.py
========

Claude Code hook integration for SkillChain.

Generates hook configurations that auto-pack .skillpack archives when
skills are created or modified in ``~/.claude/skills/``.  Hooks are
installed into Claude Code's ``settings.json``.

Usage::

    from skillchain.sdk.hooks import install_hooks, uninstall_hooks

    install_hooks()   # Add SkillChain hooks to Claude Code
    uninstall_hooks() # Remove them
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Claude Code settings locations
CLAUDE_SETTINGS_PATHS = [
    Path.home() / ".claude" / "settings.json",
    Path.home() / ".claude" / "settings.local.json",
]

HOOK_NAME = "skillchain-auto-pack"


def generate_hooks_config() -> Dict[str, Any]:
    """Generate the Claude Code hooks configuration for SkillChain.

    Returns a hooks dict that watches for skill file creation/modification
    and auto-packs .skillpack archives.

    Returns:
        Dict suitable for inclusion in Claude Code settings.json under "hooks".
    """
    return {
        HOOK_NAME: {
            "type": "afterFileWrite",
            "pattern": "~/.claude/skills/*.md",
            "command": "skillchain publish \"$FILE\" --auto",
            "description": (
                "Auto-pack and publish skill to SkillChain when a "
                "skill file is written to ~/.claude/skills/"
            ),
            "enabled": True,
        },
        "skillchain-post-validate": {
            "type": "afterCommand",
            "pattern": "skillchain import *",
            "command": "echo 'Skill imported and validated via SkillChain'",
            "description": "Post-import notification hook",
            "enabled": True,
        },
    }


def install_hooks() -> bool:
    """Install SkillChain hooks into Claude Code settings.json.

    Reads the existing settings, merges in SkillChain hooks, and writes
    back.  Existing hooks are preserved.

    Returns:
        True if hooks were successfully installed.
    """
    settings_path = _find_settings_path()

    # Read existing settings
    settings: Dict[str, Any] = {}
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Failed to read settings.json: %s", exc)

    # Merge hooks
    if "hooks" not in settings:
        settings["hooks"] = {}

    hooks_config = generate_hooks_config()
    settings["hooks"].update(hooks_config)

    # Write back
    try:
        settings_path.parent.mkdir(parents=True, exist_ok=True)
        settings_path.write_text(
            json.dumps(settings, indent=2), encoding="utf-8",
        )
        logger.info("Installed SkillChain hooks to %s", settings_path)
        return True
    except OSError as exc:
        logger.error("Failed to write settings.json: %s", exc)
        return False


def uninstall_hooks() -> bool:
    """Remove SkillChain hooks from Claude Code settings.json.

    Returns:
        True if hooks were successfully removed.
    """
    settings_path = _find_settings_path()

    if not settings_path.exists():
        return True  # Nothing to remove

    try:
        settings = json.loads(settings_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return False

    hooks = settings.get("hooks", {})
    removed = False

    for key in list(hooks.keys()):
        if key.startswith("skillchain"):
            del hooks[key]
            removed = True

    if removed:
        settings["hooks"] = hooks
        try:
            settings_path.write_text(
                json.dumps(settings, indent=2), encoding="utf-8",
            )
            logger.info("Uninstalled SkillChain hooks from %s", settings_path)
        except OSError as exc:
            logger.error("Failed to update settings.json: %s", exc)
            return False

    return True


def get_installed_hooks() -> List[str]:
    """List currently installed SkillChain hook names.

    Returns:
        List of hook names that start with "skillchain".
    """
    settings_path = _find_settings_path()

    if not settings_path.exists():
        return []

    try:
        settings = json.loads(settings_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

    hooks = settings.get("hooks", {})
    return [k for k in hooks if k.startswith("skillchain")]


def _find_settings_path() -> Path:
    """Find the Claude Code settings.json path."""
    for path in CLAUDE_SETTINGS_PATHS:
        if path.exists():
            return path

    # Default to primary path
    return CLAUDE_SETTINGS_PATHS[0]
