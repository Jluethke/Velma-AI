"""
test_server.py
==============

Tests for the SkillChain MCP server.

These tests exercise the server's tools, resources, and prompts by calling
them directly through the FastMCP internal API, without needing a running
server or stdio transport.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def tmp_home(tmp_path):
    """Redirect all home-dir paths to a temp directory."""
    home = tmp_path / "home"
    home.mkdir()
    (home / ".claude" / "skills").mkdir(parents=True)
    (home / ".skillchain" / "state").mkdir(parents=True)
    (home / ".skillchain" / "social" / "profiles").mkdir(parents=True)
    (home / ".skillchain" / "social" / "messages").mkdir(parents=True)
    (home / ".skillchain" / "social" / "bounties").mkdir(parents=True)
    (home / ".skillchain" / "social" / "collaborations").mkdir(parents=True)
    return home


@pytest.fixture
def sample_skill(tmp_home):
    """Install a sample skill into the temp Claude skills dir."""
    skill_path = tmp_home / ".claude" / "skills" / "test-skill.md"
    skill_path.write_text(
        "# Test Skill\n\n## OBSERVE\nGather data.\n\n## REFLECT\nAnalyze.\n\n## PLAN\nStrategize.\n\n## ACT\nExecute.",
        encoding="utf-8",
    )
    return skill_path


@pytest.fixture
def sample_marketplace(tmp_path):
    """Create a mock marketplace with a skill and chain."""
    mkt = tmp_path / "marketplace"
    # Skill
    skill_dir = mkt / "demo-skill"
    skill_dir.mkdir(parents=True)
    (skill_dir / "skill.md").write_text("# Demo Skill\nA demo.", encoding="utf-8")
    (skill_dir / "manifest.json").write_text(json.dumps({
        "name": "demo-skill",
        "version": "1.0.0",
        "domain": "testing",
        "tags": ["demo", "test"],
        "execution_pattern": "orpa",
        "description": "A demo skill for testing.",
    }), encoding="utf-8")
    # Chain
    chains_dir = mkt / "chains"
    chains_dir.mkdir(parents=True)
    (chains_dir / "test-chain.chain.json").write_text(json.dumps({
        "name": "test-chain",
        "description": "A test chain.",
        "category": "testing",
        "steps": [
            {"skill_name": "demo-skill", "alias": "step1", "depends_on": [], "config": {}, "phase_filter": None},
        ],
    }), encoding="utf-8")
    return mkt


@pytest.fixture
def server(tmp_home, sample_marketplace):
    """Create a configured MCP server with patched paths."""
    import skillchain.sdk.mcp_bridge.server as srv_mod
    from skillchain.sdk.mcp_bridge.server import create_server

    # Patch module-level path constants
    old_claude = srv_mod._SKILLS_DIR_CLAUDE
    old_sc = srv_mod._SKILLS_DIR_SC
    old_mkt = srv_mod._MARKETPLACE_DIR
    old_chains = srv_mod._CHAINS_DIR

    srv_mod._SKILLS_DIR_CLAUDE = tmp_home / ".claude" / "skills"
    srv_mod._SKILLS_DIR_SC = tmp_home / ".skillchain" / "skills"
    srv_mod._MARKETPLACE_DIR = sample_marketplace
    srv_mod._CHAINS_DIR = sample_marketplace / "chains"

    # Also patch SkillStateStore, ProfileManager, SocialManager to use tmp dirs
    with patch("skillchain.sdk.skill_state.SkillStateStore.__init__",
               lambda self, base_dir=None: (
                   setattr(self, '_base', tmp_home / ".skillchain" / "state") or
                   self._base.mkdir(parents=True, exist_ok=True)
               )), \
         patch("skillchain.sdk.user_profile.ProfileManager.__init__",
               lambda self, config_dir=None: setattr(self, '_path', tmp_home / ".skillchain" / "profile.json")), \
         patch("skillchain.sdk.agent_social._social_dir",
               return_value=tmp_home / ".skillchain" / "social"):

        # Clear active runs between tests
        srv_mod._active_runs.clear()
        s = create_server()

    yield s, srv_mod

    # Restore
    srv_mod._SKILLS_DIR_CLAUDE = old_claude
    srv_mod._SKILLS_DIR_SC = old_sc
    srv_mod._MARKETPLACE_DIR = old_mkt
    srv_mod._CHAINS_DIR = old_chains
    srv_mod._active_runs.clear()


# ---------------------------------------------------------------------------
# Helper to call tools synchronously
# ---------------------------------------------------------------------------

def _call_tool_sync(server_instance, name: str, **kwargs) -> str:
    """Call a tool function directly and return its result string.

    FastMCP wraps tool functions but we can call them via the internal
    tool manager. This helper works without an async event loop.
    """
    import asyncio

    async def _run():
        tools = server_instance._tool_manager._tools
        tool = tools.get(name)
        if tool is None:
            raise KeyError(f"Tool '{name}' not found. Available: {list(tools.keys())}")
        result = await tool.run(kwargs)
        if isinstance(result, str):
            return result
        if isinstance(result, list):
            texts = [c.text for c in result if hasattr(c, 'text')]
            return "\n".join(texts)
        return str(result)

    return asyncio.get_event_loop().run_until_complete(_run())


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestServerCreation:
    def test_server_creates(self, server):
        s, _ = server
        assert s is not None
        assert s.name == "skillchain"


class TestListSkills:
    def test_list_skills_finds_marketplace(self, server, sample_skill):
        s, _ = server
        result = _call_tool_sync(s, "list_skills")
        data = json.loads(result)
        names = [d["name"] for d in data]
        assert "demo-skill" in names

    def test_list_skills_finds_installed(self, server, sample_skill):
        s, _ = server
        result = _call_tool_sync(s, "list_skills")
        data = json.loads(result)
        names = [d["name"] for d in data]
        assert "test-skill" in names


class TestGetSkill:
    def test_get_existing_skill(self, server, sample_skill):
        s, _ = server
        result = _call_tool_sync(s, "get_skill", skill_name="test-skill")
        assert "# Test Skill" in result

    def test_get_missing_skill(self, server):
        s, _ = server
        result = _call_tool_sync(s, "get_skill", skill_name="nonexistent")
        assert "not found" in result.lower()


class TestSkillRunLifecycle:
    def test_start_record_complete(self, server):
        s, _ = server
        # Start
        start_result = json.loads(_call_tool_sync(s, "start_skill_run",
                                                   skill_name="demo-skill",
                                                   execution_pattern="orpa"))
        run_id = start_result["run_id"]
        assert start_result["status"] == "in_progress"

        # Record phase
        phase_result = json.loads(_call_tool_sync(s, "record_phase",
                                                   run_id=run_id,
                                                   phase="observe",
                                                   status="completed",
                                                   output='{"items": 5}'))
        assert phase_result["phase"] == "observe"
        assert phase_result["total_phases"] == 1

        # Complete
        complete_result = json.loads(_call_tool_sync(s, "complete_skill_run",
                                                      run_id=run_id))
        assert complete_result["status"] == "completed"
        assert complete_result["phases_completed"] == 1

    def test_complete_missing_run(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "complete_skill_run", run_id="bogus"))
        assert "error" in result


class TestDataPersistence:
    def test_save_and_load(self, server):
        s, _ = server
        # Save
        save_result = json.loads(_call_tool_sync(s, "save_skill_data",
                                                  skill_name="demo-skill",
                                                  key="analysis",
                                                  data='{"score": 42}'))
        assert save_result["saved"] is True

        # Load
        load_result = json.loads(_call_tool_sync(s, "load_skill_data",
                                                  skill_name="demo-skill",
                                                  key="analysis"))
        assert load_result["found"] is True
        assert load_result["data"]["score"] == 42

    def test_load_missing_key(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "load_skill_data",
                                             skill_name="demo-skill",
                                             key="nonexistent"))
        assert result["found"] is False


class TestHistory:
    def test_get_history(self, server):
        s, _ = server
        # Do a run first
        start = json.loads(_call_tool_sync(s, "start_skill_run",
                                           skill_name="demo-skill",
                                           execution_pattern="orpa"))
        _call_tool_sync(s, "complete_skill_run", run_id=start["run_id"])

        # Get history
        result = json.loads(_call_tool_sync(s, "get_skill_history",
                                             skill_name="demo-skill", limit=5))
        assert result["count"] >= 1


class TestProfile:
    def test_get_profile(self, server, tmp_home):
        s, _ = server
        # Create a profile
        profile_data = {"name": "Test User", "role": "developer", "primary_goal": "ship product"}
        (tmp_home / ".skillchain" / "profile.json").write_text(
            json.dumps(profile_data), encoding="utf-8",
        )
        result = json.loads(_call_tool_sync(s, "get_profile"))
        assert result["name"] == "Test User"


class TestRecommendations:
    def test_get_recommendations(self, server, tmp_home):
        s, _ = server
        profile_data = {"name": "Test", "role": "developer", "primary_goal": "ship product"}
        (tmp_home / ".skillchain" / "profile.json").write_text(
            json.dumps(profile_data), encoding="utf-8",
        )
        result = json.loads(_call_tool_sync(s, "get_recommendations"))
        assert "skill_recommendations" in result
        assert "chain_recommendations" in result
        assert len(result["skill_recommendations"]) > 0


class TestDiscover:
    def test_discover_by_domain(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "discover_skills", domain="testing"))
        names = [d["name"] for d in result]
        assert "demo-skill" in names

    def test_discover_all(self, server, sample_skill):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "discover_skills"))
        assert len(result) >= 1


class TestImportSkill:
    def test_import_from_marketplace(self, server):
        s, srv_mod = server
        result = json.loads(_call_tool_sync(s, "import_skill", skill_name="demo-skill"))
        assert result["success"] is True
        # Verify file was created
        dest = srv_mod._SKILLS_DIR_CLAUDE / "demo-skill.md"
        assert dest.exists()

    def test_import_missing(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "import_skill", skill_name="nonexistent"))
        assert "error" in result


class TestChains:
    def test_list_chains(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "list_chains"))
        names = [c["name"] for c in result]
        assert "test-chain" in names

    def test_run_chain(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "run_chain",
                                             chain_name="test-chain",
                                             initial_context='{"topic": "test"}'))
        assert result["chain_name"] == "test-chain"
        assert result["success"] is True

    def test_run_missing_chain(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "run_chain", chain_name="nonexistent"))
        assert "error" in result


class TestBounties:
    def test_list_bounties_empty(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "list_bounties"))
        assert isinstance(result, list)


class TestMatches:
    def test_get_matches_empty(self, server):
        s, _ = server
        result = json.loads(_call_tool_sync(s, "get_matches"))
        assert isinstance(result, list)


# ---------------------------------------------------------------------------
# Claude settings install/uninstall
# ---------------------------------------------------------------------------

class TestClaudeSettings:
    def test_install(self, tmp_path):
        from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server
        import skillchain.sdk.mcp_bridge.claude_settings as cs_mod

        settings_path = tmp_path / "settings.json"
        original = cs_mod._SETTINGS_PATH
        cs_mod._SETTINGS_PATH = settings_path

        try:
            install_mcp_server()
            assert settings_path.exists()
            data = json.loads(settings_path.read_text(encoding="utf-8"))
            assert "mcpServers" in data
            assert "skillchain" in data["mcpServers"]
            assert data["mcpServers"]["skillchain"]["command"] == "skillchain"
            assert data["mcpServers"]["skillchain"]["args"] == ["mcp", "serve"]
        finally:
            cs_mod._SETTINGS_PATH = original

    def test_install_preserves_existing(self, tmp_path):
        from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server
        import skillchain.sdk.mcp_bridge.claude_settings as cs_mod

        settings_path = tmp_path / "settings.json"
        settings_path.write_text(json.dumps({
            "existingKey": "preserved",
            "mcpServers": {"other-server": {"command": "other"}},
        }), encoding="utf-8")
        original = cs_mod._SETTINGS_PATH
        cs_mod._SETTINGS_PATH = settings_path

        try:
            install_mcp_server()
            data = json.loads(settings_path.read_text(encoding="utf-8"))
            assert data["existingKey"] == "preserved"
            assert "other-server" in data["mcpServers"]
            assert "skillchain" in data["mcpServers"]
        finally:
            cs_mod._SETTINGS_PATH = original

    def test_uninstall(self, tmp_path):
        from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server, uninstall_mcp_server
        import skillchain.sdk.mcp_bridge.claude_settings as cs_mod

        settings_path = tmp_path / "settings.json"
        original = cs_mod._SETTINGS_PATH
        cs_mod._SETTINGS_PATH = settings_path

        try:
            install_mcp_server()
            removed = uninstall_mcp_server()
            assert removed is True
            data = json.loads(settings_path.read_text(encoding="utf-8"))
            assert "skillchain" not in data.get("mcpServers", {})
        finally:
            cs_mod._SETTINGS_PATH = original

    def test_uninstall_not_present(self, tmp_path):
        from skillchain.sdk.mcp_bridge.claude_settings import uninstall_mcp_server
        import skillchain.sdk.mcp_bridge.claude_settings as cs_mod

        settings_path = tmp_path / "settings.json"
        settings_path.write_text("{}", encoding="utf-8")
        original = cs_mod._SETTINGS_PATH
        cs_mod._SETTINGS_PATH = settings_path

        try:
            removed = uninstall_mcp_server()
            assert removed is False
        finally:
            cs_mod._SETTINGS_PATH = original
