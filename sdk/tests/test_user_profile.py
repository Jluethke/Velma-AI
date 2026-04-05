"""Tests for user_profile.py — persistent user profile and recommendations."""
from __future__ import annotations

import json

import pytest

from skillchain.sdk.user_profile import (
    GOAL_SKILL_MAP,
    ROLE_CHAIN_MAP,
    ROLE_SKILL_MAP,
    ChainRecommendation,
    ProfileManager,
    SkillRecommendation,
    UserProfile,
)


@pytest.fixture
def manager(tmp_path):
    """Create a ProfileManager backed by a temporary directory."""
    return ProfileManager(config_dir=tmp_path)


@pytest.fixture
def sample_profile() -> UserProfile:
    """A fully populated sample profile."""
    return UserProfile(
        name="Alice",
        role="founder",
        industry="saas",
        company_stage="seed",
        company_name="WidgetCo",
        team_size="2-5",
        tech_stack=["python", "react", "postgres"],
        ai_platform="claude",
        experience_level="senior",
        primary_goal="grow revenue",
        secondary_goals=["ship product"],
        output_style="executive",
        communication_tone="startup",
        member_since="2026-03-31T00:00:00+00:00",
    )


# -- Profile creation and persistence (save/load round-trip) -------------------


def test_save_load_roundtrip(manager, sample_profile):
    """Profile survives a save/load cycle with all fields intact."""
    manager.save(sample_profile)
    loaded = manager.load()

    assert loaded.name == "Alice"
    assert loaded.role == "founder"
    assert loaded.industry == "saas"
    assert loaded.company_stage == "seed"
    assert loaded.company_name == "WidgetCo"
    assert loaded.team_size == "2-5"
    assert loaded.tech_stack == ["python", "react", "postgres"]
    assert loaded.ai_platform == "claude"
    assert loaded.experience_level == "senior"
    assert loaded.primary_goal == "grow revenue"
    assert loaded.secondary_goals == ["ship product"]
    assert loaded.output_style == "executive"
    assert loaded.communication_tone == "startup"
    assert loaded.member_since == "2026-03-31T00:00:00+00:00"
    assert loaded.total_runs == 0
    assert loaded.skills_used == []
    assert loaded.chains_run == []
    assert loaded.favorite_domains == []


def test_exists_false_when_no_profile(manager):
    """exists() returns False when no profile has been saved."""
    assert manager.exists() is False


def test_exists_true_after_save(manager, sample_profile):
    """exists() returns True after a profile is saved."""
    manager.save(sample_profile)
    assert manager.exists() is True


def test_load_returns_defaults_when_no_file(manager):
    """load() returns a default UserProfile when no file exists."""
    profile = manager.load()
    assert profile.name == ""
    assert profile.role == ""
    assert profile.total_runs == 0


def test_load_handles_corrupt_json(manager, tmp_path):
    """load() returns defaults when the profile file is corrupt."""
    path = tmp_path / "profile.json"
    path.write_text("not json!!!", encoding="utf-8")
    profile = manager.load()
    assert profile.name == ""
    assert profile.role == ""


def test_load_handles_partial_json(manager, tmp_path):
    """load() handles a profile with only some keys present."""
    path = tmp_path / "profile.json"
    path.write_text(json.dumps({"name": "Bob", "role": "developer"}), encoding="utf-8")
    profile = manager.load()
    assert profile.name == "Bob"
    assert profile.role == "developer"
    assert profile.tech_stack == []
    assert profile.total_runs == 0


# -- update_usage tracks skills and computes favorite_domains ------------------


def test_update_usage_tracks_skills(manager, sample_profile):
    """update_usage appends skill name and increments total_runs."""
    manager.save(sample_profile)
    manager.update_usage("codebase-mapper")
    manager.update_usage("codebase-mapper")
    manager.update_usage("prompt-engineering")

    profile = manager.load()
    assert profile.total_runs == 3
    assert profile.skills_used == ["codebase-mapper", "codebase-mapper", "prompt-engineering"]


def test_update_usage_computes_favorite_domains(manager, sample_profile):
    """update_usage recomputes favorite_domains from usage frequency."""
    manager.save(sample_profile)
    # Use engineering skills several times
    for _ in range(5):
        manager.update_usage("codebase-mapper")
    for _ in range(3):
        manager.update_usage("prompt-engineering")

    profile = manager.load()
    # "engineering" should be the top domain
    assert len(profile.favorite_domains) > 0
    assert profile.favorite_domains[0] == "engineering"


def test_update_chain_usage(manager, sample_profile):
    """update_chain_usage appends chain name."""
    manager.save(sample_profile)
    manager.update_chain_usage("codebase-health")
    manager.update_chain_usage("startup-launch")

    profile = manager.load()
    assert profile.chains_run == ["codebase-health", "startup-launch"]


# -- suggest_skills returns correct skills for each role -----------------------


def test_suggest_skills_for_founder(manager):
    """Founder gets founder-specific skill recommendations."""
    profile = UserProfile(role="founder", primary_goal="grow revenue")
    manager.save(profile)

    recs = manager.suggest_skills()
    skill_names = [r.skill_name for r in recs]

    # Must include founder essentials
    for skill in ROLE_SKILL_MAP["founder"]["essential"]:
        assert skill in skill_names

    # Check priority tagging
    essential_recs = [r for r in recs if r.priority == "essential"]
    assert len(essential_recs) == len(ROLE_SKILL_MAP["founder"]["essential"])


def test_suggest_skills_for_developer(manager):
    """Developer gets developer-specific skill recommendations."""
    profile = UserProfile(role="developer", primary_goal="ship product")
    manager.save(profile)

    recs = manager.suggest_skills()
    skill_names = [r.skill_name for r in recs]

    for skill in ROLE_SKILL_MAP["developer"]["essential"]:
        assert skill in skill_names


def test_suggest_skills_for_all_roles(manager):
    """Every defined role returns at least one recommendation."""
    for role in ROLE_SKILL_MAP:
        profile = UserProfile(role=role)
        manager.save(profile)
        recs = manager.suggest_skills()
        assert len(recs) > 0, f"No recommendations for role: {role}"


# -- suggest_chains returns correct chains for each role -----------------------


def test_suggest_chains_for_founder(manager):
    """Founder gets founder-specific chain recommendations."""
    profile = UserProfile(role="founder")
    manager.save(profile)

    recs = manager.suggest_chains()
    chain_names = [r.chain_name for r in recs]

    assert len(chain_names) >= 3, f"Founder should have 3+ chains, got {chain_names}"
    assert all(r.match_reason == "Matches your role: founder" for r in recs)


def test_suggest_chains_for_developer(manager):
    """Developer gets developer-specific chain recommendations."""
    profile = UserProfile(role="developer")
    manager.save(profile)

    recs = manager.suggest_chains()
    chain_names = [r.chain_name for r in recs]

    assert len(chain_names) >= 3, f"Developer should have 3+ chains, got {chain_names}"


def test_suggest_chains_for_all_roles(manager):
    """Every role with chain definitions returns recommendations."""
    for role in ROLE_CHAIN_MAP:
        profile = UserProfile(role=role)
        manager.save(profile)
        recs = manager.suggest_chains()
        assert len(recs) > 0, f"No chain recommendations for role: {role}"


# -- get_context_for_skill returns properly formatted dict ---------------------


def test_get_context_for_skill(manager, sample_profile):
    """get_context_for_skill returns flat dict with all expected keys."""
    manager.save(sample_profile)

    ctx = manager.get_context_for_skill("codebase-mapper")

    assert ctx["user_name"] == "Alice"
    assert ctx["user_role"] == "founder"
    assert ctx["user_industry"] == "saas"
    assert ctx["user_company_stage"] == "seed"
    assert ctx["user_company_name"] == "WidgetCo"
    assert ctx["user_team_size"] == "2-5"
    assert ctx["user_tech_stack"] == ["python", "react", "postgres"]
    assert ctx["user_ai_platform"] == "claude"
    assert ctx["user_experience_level"] == "senior"
    assert ctx["user_primary_goal"] == "grow revenue"
    assert ctx["user_secondary_goals"] == ["ship product"]
    assert ctx["user_output_style"] == "executive"
    assert ctx["user_communication_tone"] == "startup"
    assert ctx["user_total_runs"] == 0
    assert ctx["skill_name"] == "codebase-mapper"


def test_get_context_for_skill_no_profile(manager):
    """get_context_for_skill works when no profile exists (returns defaults)."""
    ctx = manager.get_context_for_skill("some-skill")
    assert ctx["user_name"] == ""
    assert ctx["user_role"] == ""
    assert ctx["skill_name"] == "some-skill"


# -- Goal-based recommendations -----------------------------------------------


def test_goal_based_recommendations(manager):
    """Goal-based skills are included in recommendations."""
    profile = UserProfile(role="student", primary_goal="automate ops")
    manager.save(profile)

    recs = manager.suggest_skills()
    skill_names = [r.skill_name for r in recs]

    # Should include goal-based skills not already in role skills
    for skill in GOAL_SKILL_MAP["automate ops"]:
        # Some may overlap with role skills, but all should be present
        assert skill in skill_names


def test_goal_and_role_combined(manager):
    """Combined role+goal recommendations don't duplicate skills."""
    profile = UserProfile(role="developer", primary_goal="ship product")
    manager.save(profile)

    recs = manager.suggest_skills()
    skill_names = [r.skill_name for r in recs]

    # No duplicates
    assert len(skill_names) == len(set(skill_names))


def test_secondary_goals_add_useful_skills(manager):
    """Secondary goals add additional skills at 'useful' priority."""
    profile = UserProfile(
        role="founder",
        primary_goal="grow revenue",
        secondary_goals=["learn skills"],
    )
    manager.save(profile)

    recs = manager.suggest_skills()
    skill_names = [r.skill_name for r in recs]

    # At least some "learn skills" goal skills that aren't already founder skills
    learn_exclusive = set(GOAL_SKILL_MAP["learn skills"]) - set(skill_names[:20])
    # The learn-skills goals should be in recommendations somewhere
    for skill in GOAL_SKILL_MAP["learn skills"]:
        assert skill in skill_names


# -- Unknown role/goal handled gracefully --------------------------------------


def test_unknown_role_returns_empty_role_skills(manager):
    """An unknown role still returns goal-based recommendations."""
    profile = UserProfile(role="astronaut", primary_goal="ship product")
    manager.save(profile)

    recs = manager.suggest_skills()
    # Should still have goal-based recs
    assert len(recs) > 0
    # All from goal, none from role
    for r in recs:
        assert "goal" in r.reason.lower() or "based" in r.reason.lower()


def test_unknown_goal_returns_role_skills(manager):
    """An unknown goal still returns role-based recommendations."""
    profile = UserProfile(role="developer", primary_goal="conquer the universe")
    manager.save(profile)

    recs = manager.suggest_skills()
    assert len(recs) > 0


def test_unknown_role_and_goal(manager):
    """Unknown role AND goal returns empty list gracefully."""
    profile = UserProfile(role="alien", primary_goal="phone home")
    manager.save(profile)

    recs = manager.suggest_skills()
    assert recs == []

    chains = manager.suggest_chains()
    assert chains == []


# -- Profile with no usage history still gives recommendations -----------------


def test_fresh_profile_gives_recommendations(manager):
    """A brand new profile with no usage history still gets recommendations."""
    profile = UserProfile(role="marketer", primary_goal="create content")
    manager.save(profile)

    recs = manager.suggest_skills()
    assert len(recs) > 0

    chains = manager.suggest_chains()
    assert len(chains) > 0


# -- Installed skills flagging -------------------------------------------------


def test_installed_skills_flagging(manager):
    """suggest_skills marks installed skills correctly."""
    profile = UserProfile(role="developer", primary_goal="ship product")
    manager.save(profile)

    installed = ["codebase-mapper", "code-review"]
    recs = manager.suggest_skills(installed_skills=installed)

    for r in recs:
        if r.skill_name in installed:
            assert r.installed is True
        else:
            assert r.installed is False


# -- Dataclass construction ----------------------------------------------------


def test_skill_recommendation_dataclass():
    """SkillRecommendation holds the expected fields."""
    rec = SkillRecommendation(
        skill_name="test-skill",
        reason="test reason",
        priority="essential",
        installed=True,
    )
    assert rec.skill_name == "test-skill"
    assert rec.priority == "essential"
    assert rec.installed is True


def test_chain_recommendation_dataclass():
    """ChainRecommendation holds the expected fields."""
    rec = ChainRecommendation(
        chain_name="test-chain",
        description="a test chain",
        skills=["a", "b"],
        match_reason="test",
    )
    assert rec.chain_name == "test-chain"
    assert rec.skills == ["a", "b"]
