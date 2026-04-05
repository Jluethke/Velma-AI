# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the SandboxManager — isolated repo copies for parallel testing."""

from __future__ import annotations

import pytest

from skillchain.tools.debugger.fix_generator import FileChange, ProposedFix
from skillchain.tools.debugger.sandbox import SandboxManager


def _populate_repo(tmp_path):
    """Create a minimal repo structure for testing."""
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "app.py").write_text("x = 1\n", encoding="utf-8")
    (tmp_path / "test_app.py").write_text("def test_x(): pass\n", encoding="utf-8")
    (tmp_path / "conftest.py").write_text("", encoding="utf-8")
    # Dirs that should be skipped
    (tmp_path / "__pycache__").mkdir()
    (tmp_path / "__pycache__" / "app.cpython-312.pyc").write_text("bytecode", encoding="utf-8")
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "HEAD").write_text("ref: refs/heads/main\n", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "pkg.js").write_text("//", encoding="utf-8")


class TestCreateSandboxes:
    def test_creates_n_copies(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(3)
            assert len(sandboxes) == 3
            for sb in sandboxes:
                assert sb.is_dir()
                assert (sb / "src" / "app.py").is_file()
                assert (sb / "test_app.py").is_file()
        finally:
            mgr.cleanup()

    def test_each_sandbox_is_independent(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(2)
            # Verify different paths
            assert sandboxes[0] != sandboxes[1]
            assert sandboxes[0].parent != sandboxes[1].parent
        finally:
            mgr.cleanup()


class TestSandboxIsolation:
    def test_changes_dont_leak(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(2)

            # Modify a file in sandbox 0
            (sandboxes[0] / "src" / "app.py").write_text("x = 999\n", encoding="utf-8")

            # Sandbox 1 should be unaffected
            content1 = (sandboxes[1] / "src" / "app.py").read_text(encoding="utf-8")
            assert content1 == "x = 1\n"

            # Original should be unaffected
            orig = (tmp_path / "src" / "app.py").read_text(encoding="utf-8")
            assert orig == "x = 1\n"
        finally:
            mgr.cleanup()


class TestApplyFix:
    def test_applies_fix_to_sandbox(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(1)
            sb = sandboxes[0]

            fix = ProposedFix(
                fix_id="test-fix-001",
                description="Fix x",
                confidence=0.9,
                files_changed=[FileChange(
                    file_path="src/app.py",
                    original_content="x = 1\n",
                    fixed_content="x = 42\n",
                    diff="",
                )],
            )

            ok = mgr.apply_fix(sb, fix)
            assert ok

            content = (sb / "src" / "app.py").read_text(encoding="utf-8")
            assert content == "x = 42\n"
        finally:
            mgr.cleanup()


class TestCleanup:
    def test_removes_all_temp_dirs(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        sandboxes = mgr.create(3)
        roots = [sb.parent for sb in sandboxes]

        mgr.cleanup()

        for root in roots:
            assert not root.exists()

    def test_cleanup_idempotent(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        mgr.create(1)
        mgr.cleanup()
        mgr.cleanup()  # Should not raise


class TestContextManager:
    def test_cleans_up_on_exit(self, tmp_path):
        _populate_repo(tmp_path)
        with SandboxManager(tmp_path) as mgr:
            sandboxes = mgr.create(2)
            roots = [sb.parent for sb in sandboxes]

        # After exiting context, sandboxes should be gone
        for root in roots:
            assert not root.exists()


class TestSkipsGitignorePatterns:
    def test_skips_git_dir(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(1)
            sb = sandboxes[0]
            assert not (sb / ".git").exists()
        finally:
            mgr.cleanup()

    def test_skips_node_modules(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(1)
            sb = sandboxes[0]
            assert not (sb / "node_modules").exists()
        finally:
            mgr.cleanup()

    def test_skips_pycache(self, tmp_path):
        _populate_repo(tmp_path)
        mgr = SandboxManager(tmp_path)
        try:
            sandboxes = mgr.create(1)
            sb = sandboxes[0]
            assert not (sb / "__pycache__").exists()
        finally:
            mgr.cleanup()
