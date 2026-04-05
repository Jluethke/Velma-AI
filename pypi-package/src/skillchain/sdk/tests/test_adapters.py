"""
test_adapters.py
================

Tests for multi-agent platform adapters.
"""

from __future__ import annotations

import json

import pytest

from skillchain.sdk.adapters import (
    ADAPTERS,
    SUPPORTED_PLATFORMS,
    ClaudeAdapter,
    CursorAdapter,
    GPTAdapter,
    GeminiAdapter,
    GenericAdapter,
    get_adapter,
)


SAMPLE_CONTENT = "# My Skill\n\nDo X when Y happens.\n"
SAMPLE_MANIFEST = {
    "name": "test_skill",
    "description": "A test skill",
    "domain": "testing",
    "version": "1.0.0",
    "tags": ["test", "demo"],
}


# -- get_adapter ---------------------------------------------------------------


class TestGetAdapter:
    def test_all_supported_platforms_resolve(self):
        for platform in SUPPORTED_PLATFORMS:
            adapter = get_adapter(platform)
            assert adapter is not None
            assert adapter.platform_name

    def test_case_insensitive(self):
        adapter = get_adapter("Claude")
        assert adapter.platform_name == "claude"

    def test_unsupported_raises(self):
        with pytest.raises(Exception, match="Unsupported platform"):
            get_adapter("nonexistent")

    def test_registry_has_all_five(self):
        assert set(SUPPORTED_PLATFORMS) == {"claude", "gpt", "gemini", "cursor", "generic"}
        assert len(ADAPTERS) == 5


# -- ClaudeAdapter -------------------------------------------------------------


class TestClaudeAdapter:
    def test_install_creates_md(self, tmp_path):
        adapter = ClaudeAdapter()
        result = adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert result.installed_path.exists()
        assert result.installed_path.suffix == ".md"
        assert result.installed_path.name == "my_skill.md"
        assert result.installed_path.read_text(encoding="utf-8") == SAMPLE_CONTENT

    def test_install_platform_name(self):
        adapter = ClaudeAdapter()
        assert adapter.platform_name == "claude"

    def test_uninstall_removes_file(self, tmp_path):
        adapter = ClaudeAdapter()
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert (tmp_path / "my_skill.md").exists()
        removed = adapter.uninstall("my_skill", target_dir=tmp_path)
        assert removed is True
        assert not (tmp_path / "my_skill.md").exists()

    def test_uninstall_nonexistent_returns_false(self, tmp_path):
        adapter = ClaudeAdapter()
        assert adapter.uninstall("nonexistent", target_dir=tmp_path) is False


# -- GPTAdapter ----------------------------------------------------------------


class TestGPTAdapter:
    def test_install_creates_json(self, tmp_path):
        adapter = GPTAdapter()
        result = adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert result.installed_path.suffix == ".json"
        assert result.installed_path.exists()
        assert result.converted is True

        data = json.loads(result.installed_path.read_text(encoding="utf-8"))
        assert data["name"] == "my_skill"
        assert "custom_instruction" in data
        assert SAMPLE_CONTENT in data["custom_instruction"]
        assert data["source"] == "skillchain"

    def test_install_also_saves_md(self, tmp_path):
        adapter = GPTAdapter()
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        md_path = tmp_path / "my_skill.md"
        assert md_path.exists()
        assert md_path.read_text(encoding="utf-8") == SAMPLE_CONTENT

    def test_uninstall(self, tmp_path):
        adapter = GPTAdapter()
        # Default uninstall looks for .md -- GPT adapter stores .json + .md
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        removed = adapter.uninstall("my_skill", target_dir=tmp_path)
        assert removed is True


# -- GeminiAdapter -------------------------------------------------------------


class TestGeminiAdapter:
    def test_install_creates_json(self, tmp_path):
        adapter = GeminiAdapter()
        result = adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert result.installed_path.suffix == ".json"
        assert result.installed_path.exists()

        data = json.loads(result.installed_path.read_text(encoding="utf-8"))
        assert "system_instruction" in data
        assert SAMPLE_CONTENT in data["system_instruction"]
        assert data["source"] == "skillchain"

    def test_platform_name(self):
        assert GeminiAdapter().platform_name == "gemini"

    def test_uninstall(self, tmp_path):
        adapter = GeminiAdapter()
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        removed = adapter.uninstall("my_skill", target_dir=tmp_path)
        assert removed is True


# -- CursorAdapter -------------------------------------------------------------


class TestCursorAdapter:
    def test_install_creates_mdc(self, tmp_path):
        adapter = CursorAdapter()
        result = adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert result.installed_path.suffix == ".mdc"
        assert result.installed_path.exists()

        content = result.installed_path.read_text(encoding="utf-8")
        assert "---" in content
        assert "description:" in content
        assert "alwaysApply:" in content
        assert SAMPLE_CONTENT in content

    def test_platform_name(self):
        assert CursorAdapter().platform_name == "cursor"

    def test_uninstall_removes_mdc(self, tmp_path):
        adapter = CursorAdapter()
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert (tmp_path / "my_skill.mdc").exists()
        removed = adapter.uninstall("my_skill", target_dir=tmp_path)
        assert removed is True
        assert not (tmp_path / "my_skill.mdc").exists()


# -- GenericAdapter ------------------------------------------------------------


class TestGenericAdapter:
    def test_install_creates_md(self, tmp_path):
        adapter = GenericAdapter()
        result = adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        assert result.installed_path.suffix == ".md"
        assert result.installed_path.read_text(encoding="utf-8") == SAMPLE_CONTENT

    def test_platform_name(self):
        assert GenericAdapter().platform_name == "generic"

    def test_uninstall(self, tmp_path):
        adapter = GenericAdapter()
        adapter.install(SAMPLE_CONTENT, "my_skill", SAMPLE_MANIFEST, target_dir=tmp_path)
        removed = adapter.uninstall("my_skill", target_dir=tmp_path)
        assert removed is True
