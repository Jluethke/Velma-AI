"""
Adapter stubs for standalone package.

The full adapter suite lives in the Velma ecosystem.
This provides enough for the CLI to import without crashing.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class AgentAdapter:
    """Base agent platform adapter."""
    platform_name: str = "generic"
    default_skills_dir: Path = Path.home() / ".claude" / "skills"

    def install_skill(self, skill_content: str, skill_name: str) -> Path:
        dest = self.default_skills_dir / f"{skill_name}.md"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(skill_content, encoding="utf-8")
        return dest


class ClaudeAdapter(AgentAdapter):
    platform_name: str = "claude"
    default_skills_dir: Path = Path.home() / ".claude" / "skills"

    def __init__(self):
        super().__init__(platform_name="claude", default_skills_dir=Path.home() / ".claude" / "skills")


class CursorAdapter(AgentAdapter):
    def __init__(self):
        super().__init__(platform_name="cursor", default_skills_dir=Path.home() / ".cursor" / "skills")


class GPTAdapter(AgentAdapter):
    def __init__(self):
        super().__init__(platform_name="gpt", default_skills_dir=Path.home() / ".openai" / "skills")


class GeminiAdapter(AgentAdapter):
    def __init__(self):
        super().__init__(platform_name="gemini", default_skills_dir=Path.home() / ".gemini" / "skills")


class GenericAdapter(AgentAdapter):
    def __init__(self):
        super().__init__(platform_name="generic", default_skills_dir=Path.home() / ".skillchain" / "skills")


ADAPTERS: Dict[str, type] = {
    "claude": ClaudeAdapter,
    "cursor": CursorAdapter,
    "gpt": GPTAdapter,
    "gemini": GeminiAdapter,
    "generic": GenericAdapter,
}

SUPPORTED_PLATFORMS: List[str] = list(ADAPTERS.keys())


def get_adapter(platform: Optional[str] = None) -> AgentAdapter:
    """Get adapter for platform (default: claude)."""
    key = (platform or "claude").lower()
    cls = ADAPTERS.get(key, GenericAdapter)
    return cls()
