"""Tests for the agent_social module."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from skillchain.sdk.agent_social import (
    ActivityEvent,
    AgentMatch,
    AgentMessage,
    AgentProfile,
    CollaborationRequest,
    SkillBounty,
    SocialManager,
    SuggestedTeam,
    compute_reputation_tier,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_social_dir(tmp_path):
    """Redirect social storage to a temp directory."""
    social_dir = tmp_path / "social"
    social_dir.mkdir()
    with patch("skillchain.sdk.agent_social._social_dir", return_value=social_dir):
        yield social_dir


@pytest.fixture
def manager(tmp_social_dir):
    """Create a SocialManager with temp storage."""
    sm = SocialManager()
    return sm


# ---------------------------------------------------------------------------
# Reputation tier
# ---------------------------------------------------------------------------

class TestReputationTier:
    def test_newcomer(self):
        assert compute_reputation_tier(0, 0.0) == "newcomer"
        assert compute_reputation_tier(3, 0.2) == "newcomer"
        assert compute_reputation_tier(5, 0.4) == "newcomer"

    def test_contributor(self):
        assert compute_reputation_tier(6, 0.5) == "contributor"
        assert compute_reputation_tier(15, 0.6) == "contributor"

    def test_expert(self):
        assert compute_reputation_tier(21, 0.7, 0.8) == "expert"
        assert compute_reputation_tier(30, 0.75, 0.85) == "expert"

    def test_expert_requires_accuracy(self):
        # 21 skills, 0.7 trust, but low accuracy => falls to contributor
        assert compute_reputation_tier(21, 0.7, 0.5) == "contributor"

    def test_master(self):
        assert compute_reputation_tier(51, 0.85) == "master"
        assert compute_reputation_tier(80, 0.9) == "master"

    def test_legend(self):
        assert compute_reputation_tier(100, 0.9) == "legend"
        assert compute_reputation_tier(200, 0.95) == "legend"

    def test_boundary_cases(self):
        # Exactly at contributor boundary
        assert compute_reputation_tier(6, 0.5) == "contributor"
        # Just below contributor
        assert compute_reputation_tier(5, 0.5) == "newcomer"
        assert compute_reputation_tier(6, 0.49) == "newcomer"


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class TestProfile:
    def test_get_default_profile(self, manager):
        profile = manager.get_profile()
        assert profile.node_id == "local-node"
        assert profile.display_name == "local-node"
        assert profile.skills_published == 0

    def test_update_profile(self, manager):
        profile = manager.update_profile(display_name="TestAgent", bio="Hello world")
        assert profile.display_name == "TestAgent"
        assert profile.bio == "Hello world"

    def test_bio_truncated(self, manager):
        long_bio = "x" * 500
        profile = manager.update_profile(bio=long_bio)
        assert len(profile.bio) == 280

    def test_profile_persists(self, manager):
        manager.update_profile(display_name="Persisted", domains=["trading"])
        profile = manager.get_profile()
        assert profile.display_name == "Persisted"
        assert profile.domains == ["trading"]

    def test_update_domains(self, manager):
        manager.update_profile(domains=["code", "ml"])
        profile = manager.get_profile()
        assert profile.domains == ["code", "ml"]

    def test_profile_reputation_auto_computed(self, manager):
        profile = manager.get_profile()
        profile.skills_published = 25
        profile.trust_score = 0.75
        profile.validation_accuracy = 0.85
        manager._save_profile(profile)
        updated = manager.update_profile()
        assert updated.reputation_tier == "expert"


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------

class TestMessaging:
    def test_send_message(self, manager):
        msg = manager.send_message(
            to_node="node-b",
            msg_type="direct",
            subject="Hello",
            body="Test message",
        )
        assert msg.from_node == "local-node"
        assert msg.to_node == "node-b"
        assert msg.msg_type == "direct"
        assert msg.subject == "Hello"
        assert msg.read is False

    def test_get_inbox(self, manager):
        # Send to self to test inbox
        manager.send_message("local-node", "direct", "Test", "Body")
        inbox = manager.get_inbox()
        assert len(inbox) == 1
        assert inbox[0].subject == "Test"

    def test_unread_filter(self, manager):
        manager.send_message("local-node", "direct", "Msg1", "B1")
        manager.send_message("local-node", "direct", "Msg2", "B2")

        inbox = manager.get_inbox(unread_only=True)
        assert len(inbox) == 2

        manager.mark_read(inbox[0].msg_id)
        inbox = manager.get_inbox(unread_only=True)
        assert len(inbox) == 1

    def test_mark_read(self, manager):
        msg = manager.send_message("local-node", "direct", "Test", "Body")
        manager.mark_read(msg.msg_id)
        inbox = manager.get_inbox()
        assert inbox[0].read is True

    def test_reply(self, manager):
        original = manager.send_message("local-node", "direct", "Original", "Body")
        reply = manager.reply(original.msg_id, "Reply body")
        assert reply.subject == "Re: Original"
        assert reply.reply_to == original.msg_id

    def test_empty_inbox(self, manager):
        inbox = manager.get_inbox()
        assert inbox == []


# ---------------------------------------------------------------------------
# Bounties
# ---------------------------------------------------------------------------

class TestBounties:
    def test_create_bounty(self, manager):
        b = manager.create_bounty(
            title="Parse SEC filings",
            description="Need parser",
            domain="analytics",
            reward=100,
            deadline="2026-05-01",
        )
        assert b.status == "open"
        assert b.reward_trust == 100
        assert b.creator_node_id == "local-node"

    def test_list_bounties(self, manager):
        manager.create_bounty("B1", "D1", "code", 50, "2026-05-01")
        manager.create_bounty("B2", "D2", "trading", 100, "2026-05-01")
        bounties = manager.list_bounties()
        assert len(bounties) == 2
        # Sorted by reward descending
        assert bounties[0].reward_trust == 100

    def test_list_bounties_by_domain(self, manager):
        manager.create_bounty("B1", "D1", "code", 50, "2026-05-01")
        manager.create_bounty("B2", "D2", "trading", 100, "2026-05-01")
        bounties = manager.list_bounties(domain="trading")
        assert len(bounties) == 1
        assert bounties[0].domain == "trading"

    def test_bounty_lifecycle(self, manager):
        # Create
        b = manager.create_bounty("Test", "Desc", "code", 200, "2026-05-01")
        assert b.status == "open"

        # Claim (simulating another node)
        b = manager.claim_bounty(b.bounty_id)
        assert b.status == "claimed"
        assert b.claimed_by == "local-node"

        # Submit
        b = manager.submit_bounty(b.bounty_id, "skill-123")
        assert b.status == "submitted"
        assert b.submission_skill_id == "skill-123"

        # Complete
        b = manager.complete_bounty(b.bounty_id)
        assert b.status == "completed"

    def test_bounty_expiration(self, manager):
        b = manager.create_bounty("Expiring", "Desc", "code", 50, "2025-01-01")
        b = manager.expire_bounty(b.bounty_id)
        assert b.status == "expired"

    def test_claim_non_open_fails(self, manager):
        b = manager.create_bounty("Test", "D", "code", 50, "2026-05-01")
        manager.claim_bounty(b.bounty_id)
        with pytest.raises(ValueError, match="not open"):
            manager.claim_bounty(b.bounty_id)

    def test_submit_non_claimed_fails(self, manager):
        b = manager.create_bounty("Test", "D", "code", 50, "2026-05-01")
        with pytest.raises(ValueError, match="not claimed"):
            manager.submit_bounty(b.bounty_id, "s1")

    def test_complete_non_submitted_fails(self, manager):
        b = manager.create_bounty("Test", "D", "code", 50, "2026-05-01")
        with pytest.raises(ValueError, match="not submitted"):
            manager.complete_bounty(b.bounty_id)

    def test_expire_completed_fails(self, manager):
        b = manager.create_bounty("Test", "D", "code", 50, "2026-05-01")
        manager.claim_bounty(b.bounty_id)
        manager.submit_bounty(b.bounty_id, "s1")
        manager.complete_bounty(b.bounty_id)
        with pytest.raises(ValueError, match="Cannot expire"):
            manager.expire_bounty(b.bounty_id)


# ---------------------------------------------------------------------------
# Collaboration
# ---------------------------------------------------------------------------

class TestCollaboration:
    def test_propose(self, manager):
        collab = manager.propose_collaboration(
            chain_name="test-chain",
            chain_def={"steps": ["a", "b"]},
            participant_assignments={
                "local-node": ["step-a"],
                "node-b": ["step-b"],
            },
        )
        assert collab.status == "proposed"
        assert collab.chain_name == "test-chain"
        assert "local-node" in collab.participants
        assert "node-b" in collab.participants

    def test_accept(self, manager):
        collab = manager.propose_collaboration(
            "chain", {}, {"local-node": ["a"], "node-b": ["b"]},
        )
        accepted = manager.accept_collaboration(collab.collab_id)
        assert accepted.status == "accepted"

    def test_decline(self, manager):
        collab = manager.propose_collaboration(
            "chain", {}, {"local-node": ["a"], "node-b": ["b"]},
        )
        declined = manager.decline_collaboration(collab.collab_id)
        assert declined.status == "declined"

    def test_accept_non_proposed_fails(self, manager):
        collab = manager.propose_collaboration(
            "chain", {}, {"local-node": ["a"]},
        )
        manager.accept_collaboration(collab.collab_id)
        with pytest.raises(ValueError, match="not in proposed state"):
            manager.accept_collaboration(collab.collab_id)

    def test_get_collaboration(self, manager):
        collab = manager.propose_collaboration(
            "chain", {"steps": []}, {"local-node": ["a"]},
        )
        loaded = manager.get_collaboration(collab.collab_id)
        assert loaded.collab_id == collab.collab_id


# ---------------------------------------------------------------------------
# Activity feed
# ---------------------------------------------------------------------------

class TestActivity:
    def test_activity_events_created(self, manager):
        manager.create_bounty("Test", "D", "code", 50, "2026-05-01")
        events = manager.get_network_activity()
        assert len(events) >= 1
        assert any(e.event_type == "bounty_created" for e in events)

    def test_activity_limit(self, manager):
        for i in range(10):
            manager.create_bounty(f"B{i}", "D", "code", 10, "2026-05-01")
        events = manager.get_network_activity(limit=5)
        assert len(events) == 5

    def test_activity_order(self, manager):
        manager.create_bounty("First", "D", "code", 10, "2026-05-01")
        manager.create_bounty("Second", "D", "code", 20, "2026-05-01")
        events = manager.get_network_activity()
        # Most recent first
        assert "Second" in events[0].description


# ---------------------------------------------------------------------------
# Search and Leaderboard
# ---------------------------------------------------------------------------

class TestDiscovery:
    def _seed_agents(self, manager):
        profiles = [
            AgentProfile("n1", "Alpha", "", ["trading"], skills_published=50,
                         trust_score=0.9, role="developer",
                         skill_names=["trading-system"]),
            AgentProfile("n2", "Beta", "", ["code", "trading"], skills_published=20,
                         trust_score=0.7, role="analyst",
                         skill_names=["feature-eng"]),
            AgentProfile("n3", "Gamma", "", ["design"], skills_published=10,
                         trust_score=0.5, role="designer",
                         skill_names=["dashboard"]),
        ]
        for p in profiles:
            manager._save_profile(p)

    def test_search_all(self, manager):
        self._seed_agents(manager)
        agents = manager.search_agents()
        assert len(agents) == 3

    def test_search_by_domain(self, manager):
        self._seed_agents(manager)
        agents = manager.search_agents(domain="trading")
        assert len(agents) == 2
        assert all("trading" in a.domains for a in agents)

    def test_search_min_trust(self, manager):
        self._seed_agents(manager)
        agents = manager.search_agents(min_trust=0.8)
        assert len(agents) == 1
        assert agents[0].display_name == "Alpha"

    def test_leaderboard_ordering(self, manager):
        self._seed_agents(manager)
        lb = manager.get_leaderboard()
        assert lb[0].trust_score >= lb[1].trust_score >= lb[2].trust_score

    def test_leaderboard_limit(self, manager):
        self._seed_agents(manager)
        lb = manager.get_leaderboard(limit=2)
        assert len(lb) == 2


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

class TestMatching:
    def _seed_for_matching(self, manager):
        me = AgentProfile(
            "local-node", "Me", "", ["trading", "code"],
            skills_published=10, trust_score=0.8, role="developer",
            skill_names=["trading-system", "event-bus"],
        )
        manager._save_profile(me)

        others = [
            AgentProfile("n-analyst", "Analyst", "", ["trading", "analytics"],
                         skills_published=15, trust_score=0.75, role="analyst",
                         skill_names=["feature-eng", "backtest"]),
            AgentProfile("n-designer", "Designer", "", ["design", "content"],
                         skills_published=8, trust_score=0.6, role="designer",
                         skill_names=["dashboard", "chart-renderer"]),
            AgentProfile("n-marketer", "Marketer", "", ["marketing"],
                         skills_published=5, trust_score=0.5, role="marketer",
                         skill_names=["seo", "email-drip"]),
            AgentProfile("n-founder", "Founder", "", ["business", "code"],
                         skills_published=3, trust_score=0.4, role="founder",
                         skill_names=["mvp-builder"]),
        ]
        for p in others:
            manager._save_profile(p)

    def test_find_matches_returns_results(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        assert len(matches) == 4  # excludes self

    def test_matches_exclude_self(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        assert all(m.node_id != "local-node" for m in matches)

    def test_matches_sorted_by_score(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        scores = [m.match_score for m in matches]
        assert scores == sorted(scores, reverse=True)

    def test_complementary_role_pairs(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        # Analyst should have high score (developer + analyst is complementary)
        analyst = next(m for m in matches if m.node_id == "n-analyst")
        designer = next(m for m in matches if m.node_id == "n-designer")
        # developer+analyst and developer+designer are both complementary
        assert analyst.match_score > 0.3
        assert designer.match_score > 0.3

    def test_match_reasons_populated(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        # At least some matches should have reasons
        matches_with_reasons = [m for m in matches if m.match_reasons]
        assert len(matches_with_reasons) > 0

    def test_skill_complementarity_scoring(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        # Analyst has skills we don't have
        analyst = next(m for m in matches if m.node_id == "n-analyst")
        assert len(analyst.complementary_skills) > 0

    def test_trust_compatibility(self, manager):
        self._seed_for_matching(manager)
        matches = manager.find_matches()
        # Analyst (0.75) is close to us (0.8) => high compat
        analyst = next(m for m in matches if m.node_id == "n-analyst")
        assert analyst.trust_compatibility >= 0.8
        # Founder (0.4) is far from us (0.8) => lower compat
        founder = next(m for m in matches if m.node_id == "n-founder")
        assert founder.trust_compatibility < analyst.trust_compatibility


class TestTeams:
    def _seed_for_teams(self, manager):
        me = AgentProfile(
            "local-node", "Me", "", ["trading"],
            skills_published=10, trust_score=0.8, role="developer",
            skill_names=["trading-system"],
        )
        manager._save_profile(me)

        for i, (name, role, domain, skills) in enumerate([
            ("Agent1", "analyst", "trading", ["feature-eng", "backtest"]),
            ("Agent2", "designer", "design", ["dashboard"]),
            ("Agent3", "marketer", "marketing", ["seo"]),
        ]):
            p = AgentProfile(
                f"n{i}", name, "", [domain],
                skills_published=10, trust_score=0.7, role=role,
                skill_names=skills,
            )
            manager._save_profile(p)

    def test_suggest_teams_returns_results(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams()
        assert len(teams) > 0

    def test_team_has_multiple_members(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams()
        for team in teams:
            assert len(team.members) >= 2

    def test_team_has_name(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams()
        assert all(team.team_name for team in teams)

    def test_team_combined_skills(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams()
        for team in teams:
            assert len(team.combined_skills) > 0

    def test_team_sorted_by_score(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams()
        scores = [t.team_score for t in teams]
        assert scores == sorted(scores, reverse=True)

    def test_max_teams_limit(self, manager):
        self._seed_for_teams(manager)
        teams = manager.suggest_teams(max_teams=1)
        assert len(teams) <= 1

    def test_insufficient_agents_returns_empty(self, manager):
        # Only self, no other agents
        me = AgentProfile("local-node", "Me", "", ["code"],
                          skills_published=1, trust_score=0.5, role="developer",
                          skill_names=["hello"])
        manager._save_profile(me)
        teams = manager.suggest_teams()
        assert teams == []
