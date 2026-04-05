# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.
"""Tests for skillchain.sdk.gamification — GamificationEngine."""

from __future__ import annotations

import json
from datetime import date, timedelta
from unittest.mock import patch

import pytest

from skillchain.sdk.gamification import (
    ALL_ACHIEVEMENTS,
    GamificationEngine,
    TrainerState,
    _evolution_tier,
    _level_from_xp,
    _streak_multiplier,
    _title_from_level,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def engine(tmp_path):
    """Fresh engine with isolated trainer.json."""
    return GamificationEngine(trainer_path=tmp_path / "trainer.json")


@pytest.fixture
def trainer_path(tmp_path):
    """Return a trainer.json path without creating the engine yet."""
    return tmp_path / "trainer.json"


# ---------------------------------------------------------------------------
# 1. XP and Levels
# ---------------------------------------------------------------------------


class TestXPAndLevels:
    def test_record_skill_run_adds_base_xp(self, engine):
        engine.record_skill_run("meal-planner")
        card = engine.get_trainer_card()
        # 10 XP base + 25 XP from first_run achievement
        assert card["xp"] == 35

    def test_second_run_adds_xp_without_achievement_bonus(self, engine):
        engine.record_skill_run("meal-planner")
        engine.record_skill_run("meal-planner")
        card = engine.get_trainer_card()
        # 10 + 25 (first_run) + 10 = 45
        assert card["xp"] == 45

    def test_level_from_xp_level_1(self):
        assert _level_from_xp(0) == 1
        assert _level_from_xp(49) == 1

    def test_level_from_xp_level_2(self):
        assert _level_from_xp(50) == 2
        assert _level_from_xp(149) == 2

    def test_level_from_xp_level_5(self):
        assert _level_from_xp(500) == 5

    def test_title_novice(self):
        assert _title_from_level(1) == "Novice"
        assert _title_from_level(4) == "Novice"

    def test_title_apprentice(self):
        assert _title_from_level(5) == "Apprentice"
        assert _title_from_level(9) == "Apprentice"

    def test_title_practitioner(self):
        assert _title_from_level(10) == "Practitioner"
        assert _title_from_level(19) == "Practitioner"

    def test_title_expert(self):
        assert _title_from_level(20) == "Expert"
        assert _title_from_level(29) == "Expert"

    def test_title_master(self):
        assert _title_from_level(30) == "Master"
        assert _title_from_level(39) == "Master"

    def test_title_legend(self):
        assert _title_from_level(40) == "Legend"
        assert _title_from_level(50) == "Legend"


# ---------------------------------------------------------------------------
# 2. Achievements
# ---------------------------------------------------------------------------


class TestAchievements:
    def test_first_run_unlocks_after_one_skill(self, engine):
        unlocked = engine.record_skill_run("meal-planner")
        ids = [a.id for a in unlocked]
        assert "first_run" in ids

    def test_first_run_not_duplicated(self, engine):
        engine.record_skill_run("meal-planner")
        unlocked = engine.record_skill_run("meal-planner")
        ids = [a.id for a in unlocked]
        assert "first_run" not in ids

    def test_collector_10_after_10_skills(self, engine):
        skills = [
            "meal-planner", "resume-builder", "budget-builder",
            "bug-root-cause", "gift-finder", "explain-anything",
            "daily-planner", "side-hustle-launcher", "medication-tracker",
            "ai-getting-started",
        ]
        for s in skills:
            unlocked = engine.record_skill_run(s)
        ids = [a.id for a in unlocked]
        assert "collector_10" in ids

    def test_streak_3_after_three_consecutive_days(self, engine):
        today = date.today()
        # Simulate 3 consecutive days by manipulating state directly
        engine._state.streak_last_date = (today - timedelta(days=1)).isoformat()
        engine._state.streak_current = 2
        engine._state.streak_best = 2
        unlocked = engine.record_skill_run("meal-planner")
        assert engine._state.streak_current == 3
        ids = [a.id for a in unlocked]
        assert "streak_3" in ids

    def test_first_chain_after_chain_run(self, engine):
        unlocked = engine.record_chain_run("my-chain", step_count=2)
        ids = [a.id for a in unlocked]
        assert "first_chain" in ids

    def test_helping_hand_on_onboarding_chain(self, engine):
        unlocked = engine.record_chain_run("tech-confidence-builder", step_count=3)
        ids = [a.id for a in unlocked]
        assert "helping_hand" in ids

    def test_helping_hand_not_on_random_chain(self, engine):
        unlocked = engine.record_chain_run("random-chain", step_count=3)
        ids = [a.id for a in unlocked]
        assert "helping_hand" not in ids


# ---------------------------------------------------------------------------
# 3. Streaks
# ---------------------------------------------------------------------------


class TestStreaks:
    def test_first_run_sets_streak_to_1(self, engine):
        engine.record_skill_run("meal-planner")
        assert engine._state.streak_current == 1

    def test_same_day_does_not_increment_streak(self, engine):
        engine.record_skill_run("meal-planner")
        engine.record_skill_run("budget-builder")
        assert engine._state.streak_current == 1

    def test_consecutive_day_increments_streak(self, engine):
        today = date.today()
        engine._state.streak_last_date = (today - timedelta(days=1)).isoformat()
        engine._state.streak_current = 5
        engine._state.streak_best = 5
        engine.record_skill_run("meal-planner")
        assert engine._state.streak_current == 6

    def test_missed_day_resets_streak(self, engine):
        today = date.today()
        engine._state.streak_last_date = (today - timedelta(days=3)).isoformat()
        engine._state.streak_current = 10
        engine._state.streak_best = 10
        engine.record_skill_run("meal-planner")
        assert engine._state.streak_current == 1

    def test_streak_best_tracks_maximum(self, engine):
        engine._state.streak_current = 15
        engine._state.streak_best = 15
        engine._state.streak_last_date = (
            date.today() - timedelta(days=1)
        ).isoformat()
        engine.record_skill_run("meal-planner")
        assert engine._state.streak_best == 16

        # Reset streak and verify best is preserved
        engine._state.streak_last_date = (
            date.today() - timedelta(days=5)
        ).isoformat()
        engine._state.streak_current = 16
        engine.record_skill_run("budget-builder")
        assert engine._state.streak_current == 1
        assert engine._state.streak_best == 16


# ---------------------------------------------------------------------------
# 4. Skilldex
# ---------------------------------------------------------------------------


class TestSkilldex:
    def test_empty_skilldex(self, engine):
        dex = engine.get_skilldex()
        assert dex["total_discovered"] == 0
        assert dex["total_skills"] == 95
        assert "categories" in dex

    def test_skilldex_has_all_categories(self, engine):
        dex = engine.get_skilldex()
        expected = {"Life", "Career", "Business", "Onboarding", "Health",
                    "Developer", "Creative", "Money", "Learning"}
        assert set(dex["categories"].keys()) == expected

    def test_skill_shows_discovered_after_run(self, engine):
        engine.record_skill_run("meal-planner")
        dex = engine.get_skilldex()
        life = dex["categories"]["Life"]
        assert life["discovered"] == 1
        meal = next(s for s in life["skills"] if s["name"] == "meal-planner")
        assert meal["discovered"] is True

    def test_undiscovered_skill_shows_false(self, engine):
        dex = engine.get_skilldex()
        life = dex["categories"]["Life"]
        meal = next(s for s in life["skills"] if s["name"] == "meal-planner")
        assert meal["discovered"] is False


# ---------------------------------------------------------------------------
# 5. Evolution tiers
# ---------------------------------------------------------------------------


class TestEvolution:
    def test_bronze(self):
        assert _evolution_tier(1) == "Bronze"
        assert _evolution_tier(4) == "Bronze"

    def test_silver(self):
        assert _evolution_tier(5) == "Silver"
        assert _evolution_tier(14) == "Silver"

    def test_gold(self):
        assert _evolution_tier(15) == "Gold"
        assert _evolution_tier(49) == "Gold"

    def test_platinum(self):
        assert _evolution_tier(50) == "Platinum"
        assert _evolution_tier(99) == "Platinum"

    def test_diamond(self):
        assert _evolution_tier(100) == "Diamond"
        assert _evolution_tier(500) == "Diamond"

    def test_undiscovered(self):
        assert _evolution_tier(0) == "Undiscovered"


# ---------------------------------------------------------------------------
# 6. Chain runs
# ---------------------------------------------------------------------------


class TestChainRuns:
    def test_chain_run_awards_25_xp_per_step(self, engine):
        engine.record_chain_run("test-chain", step_count=3)
        card = engine.get_trainer_card()
        # 75 base XP + 50 (first_chain achievement)
        assert card["xp"] == 125

    def test_speed_runner_achievement(self, engine):
        unlocked = engine.record_chain_run(
            "fast-chain", step_count=5, duration_ms=30000
        )
        ids = [a.id for a in unlocked]
        assert "speed_runner" in ids

    def test_speed_runner_not_awarded_over_60s(self, engine):
        unlocked = engine.record_chain_run(
            "slow-chain", step_count=5, duration_ms=90000
        )
        ids = [a.id for a in unlocked]
        assert "speed_runner" not in ids

    def test_speed_runner_not_awarded_under_5_steps(self, engine):
        unlocked = engine.record_chain_run(
            "short-chain", step_count=4, duration_ms=10000
        )
        ids = [a.id for a in unlocked]
        assert "speed_runner" not in ids


# ---------------------------------------------------------------------------
# 7. Daily quests
# ---------------------------------------------------------------------------


class TestDailyQuests:
    def test_returns_three_quests(self, engine):
        quests = engine.get_daily_quests()
        assert len(quests) == 3

    def test_quests_have_required_fields(self, engine):
        quests = engine.get_daily_quests()
        for q in quests:
            assert "text" in q
            assert "xp" in q
            assert "completed" in q
            assert "type" in q

    def test_quests_deterministic_for_same_date(self, engine):
        q1 = engine.get_daily_quests()
        q2 = engine.get_daily_quests()
        assert q1 == q2


# ---------------------------------------------------------------------------
# 8. Streak multiplier
# ---------------------------------------------------------------------------


class TestStreakMultiplier:
    def test_no_streak(self):
        assert _streak_multiplier(0) == 1.0
        assert _streak_multiplier(2) == 1.0

    def test_3_day_streak(self):
        assert _streak_multiplier(3) == 1.1
        assert _streak_multiplier(6) == 1.1

    def test_7_day_streak(self):
        assert _streak_multiplier(7) == 1.2
        assert _streak_multiplier(13) == 1.2

    def test_14_day_streak(self):
        assert _streak_multiplier(14) == 1.5
        assert _streak_multiplier(29) == 1.5

    def test_30_day_streak(self):
        assert _streak_multiplier(30) == 2.0
        assert _streak_multiplier(89) == 2.0

    def test_90_day_streak(self):
        assert _streak_multiplier(90) == 3.0
        assert _streak_multiplier(365) == 3.0


# ---------------------------------------------------------------------------
# 9. Trainer card
# ---------------------------------------------------------------------------


class TestTrainerCard:
    def test_trainer_card_has_all_fields(self, engine):
        card = engine.get_trainer_card()
        expected_keys = {
            "level", "title", "xp", "xp_next", "xp_progress",
            "streak", "streak_best", "streak_multiplier",
            "skills_discovered", "skills_total",
            "chains_completed", "chains_total",
            "achievements_unlocked", "achievements_total",
            "total_skill_runs", "total_chain_runs",
        }
        assert set(card.keys()) == expected_keys

    def test_fresh_card_defaults(self, engine):
        card = engine.get_trainer_card()
        assert card["level"] == 1
        assert card["title"] == "Novice"
        assert card["xp"] == 0
        assert card["streak"] == 0
        assert card["skills_discovered"] == 0
        assert card["skills_total"] == 95
        assert card["chains_total"] == 44
        assert card["achievements_total"] == len(ALL_ACHIEVEMENTS)


# ---------------------------------------------------------------------------
# 10. Persistence
# ---------------------------------------------------------------------------


class TestPersistence:
    def test_state_survives_save_load(self, trainer_path):
        engine1 = GamificationEngine(trainer_path=trainer_path)
        engine1.record_skill_run("meal-planner")
        engine1.record_skill_run("resume-builder")
        card1 = engine1.get_trainer_card()

        engine2 = GamificationEngine(trainer_path=trainer_path)
        card2 = engine2.get_trainer_card()

        assert card2["xp"] == card1["xp"]
        assert card2["skills_discovered"] == card1["skills_discovered"]
        assert card2["total_skill_runs"] == card1["total_skill_runs"]
        assert card2["achievements_unlocked"] == card1["achievements_unlocked"]

    def test_corrupted_file_returns_fresh_state(self, trainer_path):
        trainer_path.parent.mkdir(parents=True, exist_ok=True)
        trainer_path.write_text("NOT JSON", encoding="utf-8")
        engine = GamificationEngine(trainer_path=trainer_path)
        card = engine.get_trainer_card()
        assert card["level"] == 1
        assert card["xp"] == 0

    def test_missing_file_returns_fresh_state(self, trainer_path):
        engine = GamificationEngine(trainer_path=trainer_path)
        card = engine.get_trainer_card()
        assert card["level"] == 1
