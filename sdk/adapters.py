"""
adapters.py
===========

Agent adapters for installing skills to different AI platforms.
Each adapter knows how to convert a .skillpack into the format
expected by a specific AI agent.
"""
from __future__ import annotations

import json
import shutil
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .exceptions import SkillChainError


@dataclass
class InstallResult:
    """Result of installing a skill to an agent."""
    platform: str
    installed_path: Path
    converted: bool  # True if format conversion was needed
    notes: str = ""


class AgentAdapter(ABC):
    """Base class for AI agent adapters."""

    @property
    @abstractmethod
    def platform_name(self) -> str: ...

    @property
    @abstractmethod
    def default_skills_dir(self) -> Path: ...

    @abstractmethod
    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult: ...

    def uninstall(self, skill_name: str, target_dir: Optional[Path] = None) -> bool:
        path = (target_dir or self.default_skills_dir) / f"{skill_name}.md"
        if path.exists():
            path.unlink()
            return True
        return False


class ClaudeAdapter(AgentAdapter):
    """Adapter for Claude Code (Anthropic)."""

    @property
    def platform_name(self) -> str:
        return "claude"

    @property
    def default_skills_dir(self) -> Path:
        return Path.home() / ".claude" / "skills"

    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult:
        dest = (target_dir or self.default_skills_dir)
        dest.mkdir(parents=True, exist_ok=True)
        path = dest / f"{skill_name}.md"
        path.write_text(skill_content, encoding="utf-8")
        return InstallResult(platform="claude", installed_path=path, converted=False)


class GPTAdapter(AgentAdapter):
    """Adapter for OpenAI GPT (Custom Instructions / GPT Actions)."""

    @property
    def platform_name(self) -> str:
        return "gpt"

    @property
    def default_skills_dir(self) -> Path:
        return Path.home() / ".skillchain" / "gpt-skills"

    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult:
        dest = (target_dir or self.default_skills_dir)
        dest.mkdir(parents=True, exist_ok=True)

        # Convert to GPT custom instruction format
        converted = self._convert_to_gpt_format(skill_content, skill_name, manifest)
        path = dest / f"{skill_name}.json"
        path.write_text(json.dumps(converted, indent=2), encoding="utf-8")

        # Also save raw markdown
        md_path = dest / f"{skill_name}.md"
        md_path.write_text(skill_content, encoding="utf-8")

        return InstallResult(
            platform="gpt",
            installed_path=path,
            converted=True,
            notes="Exported as GPT custom instruction JSON. Import via ChatGPT Settings > Custom Instructions, or use as system prompt."
        )

    def _convert_to_gpt_format(self, content: str, name: str, manifest: dict) -> dict:
        return {
            "name": name,
            "description": manifest.get("description", ""),
            "domain": manifest.get("domain", ""),
            "custom_instruction": f"You have the following skill loaded:\n\n{content}",
            "tags": manifest.get("tags", []),
            "version": manifest.get("version", "1.0.0"),
            "source": "skillchain"
        }


class GeminiAdapter(AgentAdapter):
    """Adapter for Google Gemini (System Instructions)."""

    @property
    def platform_name(self) -> str:
        return "gemini"

    @property
    def default_skills_dir(self) -> Path:
        return Path.home() / ".skillchain" / "gemini-skills"

    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult:
        dest = (target_dir or self.default_skills_dir)
        dest.mkdir(parents=True, exist_ok=True)

        # Gemini uses system instructions -- save as structured JSON
        converted = {
            "system_instruction": f"You have the following skill loaded. Follow its guidance when relevant:\n\n{skill_content}",
            "skill_name": skill_name,
            "domain": manifest.get("domain", ""),
            "tags": manifest.get("tags", []),
            "source": "skillchain"
        }
        path = dest / f"{skill_name}.json"
        path.write_text(json.dumps(converted, indent=2), encoding="utf-8")

        md_path = dest / f"{skill_name}.md"
        md_path.write_text(skill_content, encoding="utf-8")

        return InstallResult(
            platform="gemini",
            installed_path=path,
            converted=True,
            notes="Exported as Gemini system instruction. Use with Google AI Studio or Gemini API."
        )


class CursorAdapter(AgentAdapter):
    """Adapter for Cursor IDE (.cursor/rules/)."""

    @property
    def platform_name(self) -> str:
        return "cursor"

    @property
    def default_skills_dir(self) -> Path:
        return Path.cwd() / ".cursor" / "rules"

    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult:
        dest = (target_dir or self.default_skills_dir)
        dest.mkdir(parents=True, exist_ok=True)

        # Cursor uses .mdc files in .cursor/rules/
        path = dest / f"{skill_name}.mdc"

        # Add Cursor frontmatter
        cursor_content = f"""---
description: {manifest.get('description', skill_name)}
globs:
alwaysApply: false
---

{skill_content}"""

        path.write_text(cursor_content, encoding="utf-8")
        return InstallResult(
            platform="cursor",
            installed_path=path,
            converted=True,
            notes="Installed as Cursor rule. Enable in Cursor Settings > Rules."
        )

    def uninstall(self, skill_name: str, target_dir: Optional[Path] = None) -> bool:
        path = (target_dir or self.default_skills_dir) / f"{skill_name}.mdc"
        if path.exists():
            path.unlink()
            return True
        return False


class GenericAdapter(AgentAdapter):
    """Generic adapter -- saves raw markdown for any LLM."""

    @property
    def platform_name(self) -> str:
        return "generic"

    @property
    def default_skills_dir(self) -> Path:
        return Path.home() / ".skillchain" / "skills"

    def install(self, skill_content: str, skill_name: str, manifest: dict, target_dir: Optional[Path] = None) -> InstallResult:
        dest = (target_dir or self.default_skills_dir)
        dest.mkdir(parents=True, exist_ok=True)
        path = dest / f"{skill_name}.md"
        path.write_text(skill_content, encoding="utf-8")
        return InstallResult(
            platform="generic",
            installed_path=path,
            converted=False,
            notes="Saved as raw markdown. Inject into your LLM's system prompt or context window."
        )


# Registry
ADAPTERS: dict[str, type[AgentAdapter]] = {
    "claude": ClaudeAdapter,
    "gpt": GPTAdapter,
    "gemini": GeminiAdapter,
    "cursor": CursorAdapter,
    "generic": GenericAdapter,
}

SUPPORTED_PLATFORMS = list(ADAPTERS.keys())

def get_adapter(platform: str) -> AgentAdapter:
    """Get an adapter instance for the given platform."""
    cls = ADAPTERS.get(platform.lower())
    if cls is None:
        raise SkillChainError(f"Unsupported platform: {platform}. Supported: {SUPPORTED_PLATFORMS}")
    return cls()
