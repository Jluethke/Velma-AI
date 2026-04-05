# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
sandbox.py
==========

Manages isolated copies of a repository for parallel fix testing.
Each candidate fix gets its own sandbox (temp directory copy of the repo),
so fixes can be applied and tested independently without interfering.
"""

from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path

from .fix_generator import ProposedFix

logger = logging.getLogger(__name__)

# Directories to skip when copying a repo into a sandbox
_SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", ".tox", ".mypy_cache"}


def _ignore_patterns(directory: str, contents: list[str]) -> set[str]:
    """Return the set of names in *contents* that should be skipped."""
    return {name for name in contents if name in _SKIP_DIRS}


class SandboxManager:
    """Create and manage isolated repo copies for parallel fix testing."""

    def __init__(self, repo_path: Path):
        self.repo_path = Path(repo_path).resolve()
        self._sandboxes: list[Path] = []

    # -- public API ---------------------------------------------------------------

    def create(self, count: int) -> list[Path]:
        """Create *count* isolated copies of the repo for parallel testing.

        Returns a list of sandbox root paths (temp directories).
        """
        sandboxes: list[Path] = []
        for i in range(count):
            tmp_dir = Path(tempfile.mkdtemp(prefix=f"sc_sandbox_{i}_"))
            dest = tmp_dir / self.repo_path.name
            shutil.copytree(
                self.repo_path,
                dest,
                ignore=_ignore_patterns,
                dirs_exist_ok=False,
            )
            sandboxes.append(dest)
            logger.debug("Created sandbox %d at %s", i, dest)
        self._sandboxes.extend(sandboxes)
        return sandboxes

    def apply_fix(self, sandbox_path: Path, fix: ProposedFix) -> bool:
        """Apply a proposed fix to a sandbox copy.

        Returns True if all file changes were written successfully.
        """
        sandbox_path = Path(sandbox_path).resolve()
        ok = True
        for fc in fix.files_changed:
            if not fc.changed:
                continue
            target = self._resolve_in_sandbox(sandbox_path, fc.file_path)
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(fc.fixed_content, encoding="utf-8")
                logger.debug("Applied fix to %s in sandbox %s", fc.file_path, sandbox_path)
            except OSError as exc:
                logger.error("Failed to write fix to %s: %s", target, exc)
                ok = False
        return ok

    def cleanup(self) -> None:
        """Remove all sandbox copies."""
        for sb in self._sandboxes:
            # The sandbox is a sub-dir inside the temp dir — remove the temp root
            root = sb.parent
            try:
                shutil.rmtree(root, ignore_errors=True)
                logger.debug("Cleaned up sandbox %s", root)
            except OSError:
                pass
        self._sandboxes.clear()

    # -- context manager -----------------------------------------------------------

    def __enter__(self) -> "SandboxManager":
        return self

    def __exit__(self, *args: object) -> None:
        self.cleanup()

    # -- helpers -------------------------------------------------------------------

    @staticmethod
    def _resolve_in_sandbox(sandbox_path: Path, file_path: str) -> Path:
        """Resolve a file path inside a sandbox."""
        p = Path(file_path)
        if p.is_absolute():
            # Make it relative to reconstruct inside the sandbox
            try:
                rel = p.relative_to(p.anchor)
            except ValueError:
                rel = p
            return sandbox_path / rel
        return sandbox_path / file_path
