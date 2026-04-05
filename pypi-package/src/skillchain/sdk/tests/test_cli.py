"""
test_cli.py
===========

Tests for the SkillChain CLI using Click's CliRunner.

Tests focus on argument parsing, output formatting, and error handling.
Chain and IPFS interactions are not tested here (they require live infra).
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from skillchain.sdk.cli import cli


@pytest.fixture
def runner() -> CliRunner:
    """Create a Click CliRunner."""
    return CliRunner()


# -- CLI group -----------------------------------------------------------------

class TestCLIGroup:
    """Tests for the top-level CLI group."""

    def test_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "SkillChain" in result.output

    def test_version_in_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["--help"])
        assert "network" in result.output.lower()


# -- init ----------------------------------------------------------------------

class TestInit:
    """Tests for the init command."""

    def test_init_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["init", "--help"])
        assert result.exit_code == 0
        assert "passphrase" in result.output.lower()

    @patch("skillchain.sdk.cli._show_recommendations")
    @patch("skillchain.sdk.cli._install_skill_template")
    def test_init_creates_config(
        self, mock_template: MagicMock, mock_show_recs: MagicMock,
        runner: CliRunner, tmp_path,
    ) -> None:
        mock_node = MagicMock()
        mock_node.register.return_value = "sc-test123"
        mock_node.wallet_address = "0xabc"

        from skillchain.sdk.user_profile import UserProfile

        mock_pm = MagicMock()
        mock_pm.onboard.return_value = UserProfile(name="Test", role="developer")

        with patch("skillchain.sdk.config.SkillChainConfig.load") as MockLoad, \
             patch("skillchain.sdk.node.SkillChainNode", return_value=mock_node), \
             patch("skillchain.sdk.cli.ProfileManager", return_value=mock_pm):
            mock_config = MagicMock()
            mock_config.config_dir = tmp_path
            mock_config.network = "sepolia"
            mock_config.agent_platform = "claude"
            MockLoad.return_value = mock_config

            result = runner.invoke(cli, ["init", "--platform", "claude"], input="testpass\ntestpass\n")

        assert result.exit_code == 0


# -- status --------------------------------------------------------------------

class TestStatus:
    """Tests for the status command."""

    def test_status_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["status", "--help"])
        assert result.exit_code == 0

    @patch("skillchain.sdk.node.SkillChainNode")
    @patch("skillchain.sdk.config.SkillChainConfig.load")
    def test_status_output(self, mock_load: MagicMock, mock_node_cls: MagicMock, runner: CliRunner) -> None:
        mock_config = MagicMock()
        mock_config.agent_platform = "claude"
        mock_load.return_value = mock_config

        mock_node = MagicMock()
        mock_node.status.return_value = {
            "node_id": "sc-test123",
            "wallet_address": "0xabc",
            "network": "sepolia",
            "balance_wei": 1000000000000000000,
            "balance_eth": 1.0,
            "trust_score": 0.85,
            "staking_tier": 1,
            "config_dir": "/tmp/skillchain",
            "domain_tags": ["testing"],
        }
        mock_node_cls.return_value = mock_node

        result = runner.invoke(cli, ["status"])
        assert result.exit_code == 0
        assert "sc-test123" in result.output or "node_id" in result.output


# -- discover ------------------------------------------------------------------

class TestDiscover:
    """Tests for the discover command."""

    def test_discover_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["discover", "--help"])
        assert result.exit_code == 0
        assert "domain" in result.output.lower()

    @patch("skillchain.sdk.cli._get_node")
    def test_discover_empty_results(self, mock_get_node: MagicMock, runner: CliRunner) -> None:
        mock_node = MagicMock()
        mock_node.discover.return_value = []
        mock_get_node.return_value = mock_node

        result = runner.invoke(cli, ["discover", "--domain", "testing"])
        assert result.exit_code == 0
        assert "no skills found" in result.output.lower()


# -- validate ------------------------------------------------------------------

class TestValidate:
    """Tests for the validate command."""

    def test_validate_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["validate", "--help"])
        assert result.exit_code == 0


# -- stake ---------------------------------------------------------------------

class TestStake:
    """Tests for the stake command."""

    def test_stake_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["stake", "--help"])
        assert result.exit_code == 0
        assert "amount" in result.output.lower() or "AMOUNT" in result.output


# -- trust ---------------------------------------------------------------------

class TestTrust:
    """Tests for the trust command."""

    def test_trust_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["trust", "--help"])
        assert result.exit_code == 0

    @patch("skillchain.sdk.cli._get_node")
    def test_trust_output(self, mock_get_node: MagicMock, runner: CliRunner) -> None:
        mock_node = MagicMock()
        mock_node.get_trust.return_value = 0.85
        mock_get_node.return_value = mock_node

        result = runner.invoke(cli, ["trust", "sc-test123"])
        assert result.exit_code == 0
        assert "0.85" in result.output


# -- import --------------------------------------------------------------------

class TestImport:
    """Tests for the import command."""

    def test_import_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["import", "--help"])
        assert result.exit_code == 0
        assert "skill_id" in result.output.lower()


# -- publish -------------------------------------------------------------------

class TestPublish:
    """Tests for the publish command."""

    def test_publish_help(self, runner: CliRunner) -> None:
        result = runner.invoke(cli, ["publish", "--help"])
        assert result.exit_code == 0
        assert "price" in result.output.lower()
