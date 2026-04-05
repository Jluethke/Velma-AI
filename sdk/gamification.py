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
gamification.py
===============

Pokemon Go-style gamification layer for SkillChain.

Tracks XP, trainer levels, achievements, skill collection ("Skilldex"),
skill evolution tiers, daily quests, and streaks. Reads from existing
SkillState and UserProfile — never replaces them.

Persistence: ``~/.skillchain/trainer.json``

Example::

    from skillchain.sdk.gamification import GamificationEngine

    engine = GamificationEngine()
    unlocked = engine.record_skill_run("meal-planner")
    print(engine.get_trainer_card())
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Level table
# ---------------------------------------------------------------------------

LEVEL_THRESHOLDS: list[int] = [
    # Novice (1-4)
    0, 50, 150, 300,
    # Apprentice (5-9)
    500, 750, 1100, 1500, 2000,
    # Practitioner (10-19)
    2500, 3200, 4000, 5000, 6200, 7500, 8500, 9200, 9800, 10000,
    # Expert (20-29)
    12000, 14500, 17000, 19500, 22000, 24500, 27000, 29000, 29800, 30000,
    # Master (30-39)
    35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 73000, 75000,
    # Legend (40-50)
    85000, 90000, 95000, 100000, 107000, 115000, 125000, 135000, 142000, 148000, 150000,
]

TIER_NAMES: dict[int, str] = {
    1: "Novice", 5: "Apprentice", 10: "Practitioner",
    20: "Expert", 30: "Master", 40: "Legend",
}


def _level_from_xp(xp: int) -> int:
    """Return level (1-based) for a given XP total."""
    for i in range(len(LEVEL_THRESHOLDS) - 1, -1, -1):
        if xp >= LEVEL_THRESHOLDS[i]:
            return min(i + 1, 50)
    return 1


def _title_from_level(level: int) -> str:
    """Return tier title for a level."""
    for threshold in sorted(TIER_NAMES.keys(), reverse=True):
        if level >= threshold:
            return TIER_NAMES[threshold]
    return "Novice"


def _xp_for_next_level(level: int) -> int:
    """XP required for the next level."""
    if level >= 50:
        return LEVEL_THRESHOLDS[-1]
    return LEVEL_THRESHOLDS[level]  # level is 1-based, so index=level is next


# ---------------------------------------------------------------------------
# Evolution tiers
# ---------------------------------------------------------------------------

EVOLUTION_TIERS = [
    (100, "Diamond"),
    (50, "Platinum"),
    (15, "Gold"),
    (5, "Silver"),
    (1, "Bronze"),
]


def _evolution_tier(run_count: int) -> str:
    """Return evolution tier name for a run count."""
    for threshold, name in EVOLUTION_TIERS:
        if run_count >= threshold:
            return name
    return "Undiscovered"


# ---------------------------------------------------------------------------
# Streak multiplier
# ---------------------------------------------------------------------------

def _streak_multiplier(streak: int) -> float:
    """XP multiplier based on current streak."""
    if streak >= 90:
        return 3.0
    if streak >= 30:
        return 2.0
    if streak >= 14:
        return 1.5
    if streak >= 7:
        return 1.2
    if streak >= 3:
        return 1.1
    return 1.0


# ---------------------------------------------------------------------------
# Skill categories
# ---------------------------------------------------------------------------

SKILL_CATEGORIES: dict[str, list[str]] = {
    "Life": [
        "daily-planner", "meal-planner", "home-maintenance-scheduler",
        "moving-assistant", "declutter-coach", "family-emergency-plan",
        "habit-builder", "life-os", "nutrition-optimizer", "workout-planner",
    ],
    "Career": [
        "resume-builder", "interview-coach", "salary-negotiator",
        "email-writer", "complaint-letter-writer",
    ],
    "Business": [
        "side-hustle-launcher", "social-media-content-planner",
        "small-biz-bookkeeper", "b2b-lead-finder", "cold-outreach-optimizer",
        "pricing-strategy", "growth-content-system", "seo-cluster-builder",
        "market-entry-analyzer", "product-listing-optimizer", "runway-calculator",
        "competitor-teardown", "solopreneur-engine", "business-in-a-box",
        "company-operator",
    ],
    "Onboarding": [
        "ai-getting-started", "crypto-plain-english", "digital-safety-guide",
        "tech-translator", "scam-detector",
    ],
    "Health": [
        "medication-tracker", "symptom-checker", "fitness-starter",
    ],
    "Developer": [
        "bug-root-cause", "debugging-strategies", "code-review",
        "codebase-mapper", "refactor-planner", "test-coverage-generator",
        "project-scaffolding", "api-design", "api-integration-planner",
        "database-patterns", "ci-cd-pipelines", "data-pipeline",
        "security-hardening", "repo-health",
    ],
    "Creative": [
        "gift-finder", "party-planner", "travel-planner", "pet-care-guide",
        "velma-voice", "content-engine", "technical-writing",
    ],
    "Money": [
        "budget-builder", "retirement-planner", "expense-optimizer",
        "deal-risk-analyzer", "pricing-model-simulator", "review-sentiment-analyzer",
    ],
    "Learning": [
        "explain-anything", "study-planner", "skill-acquisition-engine",
        "prompt-engineering", "problem-decomposer", "decision-analyzer",
        "research-synthesizer", "signal-noise-filter", "contradiction-finder",
        "dashboard-explainer",
    ],
}

# Reverse lookup: skill_name -> category
_SKILL_TO_CATEGORY: dict[str, str] = {}
for _cat, _skills in SKILL_CATEGORIES.items():
    for _s in _skills:
        _SKILL_TO_CATEGORY[_s] = _cat


def _category_for_skill(skill_name: str) -> str:
    """Return category for a skill, or 'Other' if unknown."""
    return _SKILL_TO_CATEGORY.get(skill_name, "Other")


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

@dataclass
class Achievement:
    """Achievement definition."""
    id: str
    name: str
    description: str
    xp_reward: int
    icon: str = ""


ALL_ACHIEVEMENTS: list[Achievement] = [
    # First Steps
    Achievement("first_run", "First Steps", "Run your first skill", 25, "[!]"),
    Achievement("first_chain", "Chain Reaction", "Complete your first chain", 50, "[>>]"),
    Achievement("first_category", "Explorer", "Use a skill from every category", 100, "[*]"),
    # Collection
    Achievement("collector_10", "Collector", "Discover 10 different skills", 50, "[10]"),
    Achievement("collector_25", "Hoarder", "Discover 25 different skills", 100, "[25]"),
    Achievement("collector_50", "Connoisseur", "Discover 50 different skills", 250, "[50]"),
    Achievement("collector_95", "Completionist", "Discover all 95 skills", 1000, "[ALL]"),
    # Chain Runner
    Achievement("chain_5", "Pipeline Pro", "Run 5 different chains", 50, "[5]"),
    Achievement("chain_15", "Chain Master", "Run 15 different chains", 150, "[15]"),
    Achievement("chain_all", "Chained Lightning", "Run all 44 chains", 500, "[44]"),
    # Streaks
    Achievement("streak_3", "Getting Started", "3-day streak", 25, "[3d]"),
    Achievement("streak_7", "Weekly Warrior", "7-day streak", 75, "[7d]"),
    Achievement("streak_14", "Fortnight Force", "14-day streak", 150, "[14d]"),
    Achievement("streak_30", "Monthly Machine", "30-day streak", 500, "[30d]"),
    Achievement("streak_90", "Unstoppable", "90-day streak", 2000, "[90d]"),
    # Category Mastery
    Achievement("master_life", "Life Hacker", "Use every Life skill", 200, "[L]"),
    Achievement("master_career", "Career Builder", "Use every Career skill", 200, "[C]"),
    Achievement("master_business", "Mogul", "Use every Business skill", 200, "[B]"),
    Achievement("master_onboarding", "Welcome Wagon", "Use every Onboarding skill", 200, "[O]"),
    Achievement("master_health", "Wellness Guru", "Use every Health skill", 200, "[H]"),
    Achievement("master_developer", "Code Ninja", "Use every Developer skill", 200, "[D]"),
    # Evolution
    Achievement("evolve_silver", "Polished", "Evolve any skill to Silver (5 runs)", 50, "[Ag]"),
    Achievement("evolve_gold", "Golden Touch", "Evolve any skill to Gold (15 runs)", 150, "[Au]"),
    Achievement("evolve_platinum", "Platinum Status", "Evolve any skill to Platinum (50 runs)", 500, "[Pt]"),
    Achievement("evolve_diamond", "Diamond Hands", "Evolve any skill to Diamond (100 runs)", 1000, "[Dm]"),
    # Special
    Achievement("night_owl", "Night Owl", "Run a skill between midnight and 5am", 50, "[NI]"),
    Achievement("early_bird", "Early Bird", "Run a skill between 5am and 7am", 50, "[AM]"),
    Achievement("speed_runner", "Speed Runner", "Complete a 5+ step chain in under 60s", 100, "[!!]"),
    Achievement("polyglot", "Polyglot", "Use skills from 5+ categories in one day", 100, "[5C]"),
    Achievement("helping_hand", "Helping Hand", "Run an onboarding chain", 75, "[<3]"),
]

_ACHIEVEMENT_MAP: dict[str, Achievement] = {a.id: a for a in ALL_ACHIEVEMENTS}

# Onboarding chains
_ONBOARDING_CHAINS = {"tech-confidence-builder", "digital-life-setup"}


# ---------------------------------------------------------------------------
# Quest templates
# ---------------------------------------------------------------------------

_QUEST_TEMPLATES = [
    {"id": "run_category", "text": "Run any {category} skill", "xp": 15, "type": "category"},
    {"id": "try_new", "text": "Try a skill you haven't used before", "xp": 20, "type": "new_skill"},
    {"id": "complete_chain", "text": "Complete any chain", "xp": 25, "type": "chain"},
    {"id": "run_3", "text": "Run 3 skills today", "xp": 20, "type": "count_3"},
    {"id": "new_category", "text": "Use a skill from a new category", "xp": 25, "type": "new_category"},
]

_CATEGORIES_LIST = list(SKILL_CATEGORIES.keys())


# ---------------------------------------------------------------------------
# Trainer state
# ---------------------------------------------------------------------------

@dataclass
class TrainerState:
    """Persisted gamification state."""
    xp: int = 0
    level: int = 1
    title: str = "Novice"
    skills_discovered: list[str] = field(default_factory=list)
    chains_completed: list[str] = field(default_factory=list)
    achievements_unlocked: dict[str, str] = field(default_factory=dict)  # id -> ISO timestamp
    streak_current: int = 0
    streak_best: int = 0
    streak_last_date: str = ""
    evolution_levels: dict[str, str] = field(default_factory=dict)  # skill -> tier name
    daily_runs_today: list[str] = field(default_factory=list)  # skills run today
    daily_runs_date: str = ""  # date of daily_runs_today
    categories_today: list[str] = field(default_factory=list)
    total_skill_runs: int = 0
    total_chain_runs: int = 0


# ---------------------------------------------------------------------------
# Gamification Engine
# ---------------------------------------------------------------------------

_TRAINER_PATH = Path.home() / ".skillchain" / "trainer.json"


class GamificationEngine:
    """Pokemon Go-style gamification for SkillChain.

    Reads from existing SkillState (run counts, history) and layers
    XP, levels, achievements, collection tracking, and streaks on top.
    """

    def __init__(self, trainer_path: Optional[Path] = None) -> None:
        self._path = trainer_path or _TRAINER_PATH
        self._state = self._load()
        self._newly_unlocked: list[Achievement] = []

    # -- Public API --------------------------------------------------------

    def record_skill_run(self, skill_name: str, run_count: int = 0) -> list[Achievement]:
        """Record a skill execution. Returns newly unlocked achievements."""
        self._newly_unlocked = []
        today = date.today().isoformat()

        # Reset daily tracking if new day
        if self._state.daily_runs_date != today:
            self._state.daily_runs_today = []
            self._state.categories_today = []
            self._state.daily_runs_date = today

        # Track discovery
        if skill_name not in self._state.skills_discovered:
            self._state.skills_discovered.append(skill_name)

        # Track daily runs
        self._state.daily_runs_today.append(skill_name)
        self._state.total_skill_runs += 1

        # Track category
        cat = _category_for_skill(skill_name)
        if cat not in self._state.categories_today:
            self._state.categories_today.append(cat)

        # Evolution
        if run_count > 0:
            tier = _evolution_tier(run_count)
            old_tier = self._state.evolution_levels.get(skill_name, "")
            if tier != old_tier:
                self._state.evolution_levels[skill_name] = tier

        # Update streak
        self._update_streak()

        # Award XP
        base_xp = 10
        multiplier = _streak_multiplier(self._state.streak_current)
        xp_gained = int(base_xp * multiplier)
        self._add_xp(xp_gained)

        # Check achievements
        self._check_achievements()

        # Check time-based achievements
        hour = datetime.now().hour
        if 0 <= hour < 5:
            self._try_unlock("night_owl")
        elif 5 <= hour < 7:
            self._try_unlock("early_bird")

        self._save()
        return list(self._newly_unlocked)

    def record_chain_run(
        self, chain_name: str, step_count: int, duration_ms: float = 0.0
    ) -> list[Achievement]:
        """Record a chain completion. Returns newly unlocked achievements."""
        self._newly_unlocked = []

        if chain_name not in self._state.chains_completed:
            self._state.chains_completed.append(chain_name)
        self._state.total_chain_runs += 1

        # XP: 25 per step
        base_xp = 25 * step_count
        multiplier = _streak_multiplier(self._state.streak_current)
        xp_gained = int(base_xp * multiplier)
        self._add_xp(xp_gained)

        # Speed runner check
        if step_count >= 5 and duration_ms > 0 and duration_ms < 60000:
            self._try_unlock("speed_runner")

        # Helping hand check
        if chain_name in _ONBOARDING_CHAINS:
            self._try_unlock("helping_hand")

        self._check_achievements()
        self._save()
        return list(self._newly_unlocked)

    def record_validation(self, skill_name: str) -> list[Achievement]:
        """Record a skill validation."""
        self._newly_unlocked = []
        self._add_xp(int(50 * _streak_multiplier(self._state.streak_current)))
        self._check_achievements()
        self._save()
        return list(self._newly_unlocked)

    def record_publish(self, skill_name: str) -> list[Achievement]:
        """Record a skill publication."""
        self._newly_unlocked = []
        self._add_xp(int(100 * _streak_multiplier(self._state.streak_current)))
        self._check_achievements()
        self._save()
        return list(self._newly_unlocked)

    def get_trainer_card(self) -> dict[str, Any]:
        """Return trainer summary for display."""
        s = self._state
        next_xp = _xp_for_next_level(s.level)
        current_threshold = LEVEL_THRESHOLDS[s.level - 1] if s.level > 0 else 0
        progress = (s.xp - current_threshold) / max(next_xp - current_threshold, 1)

        return {
            "level": s.level,
            "title": s.title,
            "xp": s.xp,
            "xp_next": next_xp,
            "xp_progress": round(min(progress, 1.0), 3),
            "streak": s.streak_current,
            "streak_best": s.streak_best,
            "streak_multiplier": _streak_multiplier(s.streak_current),
            "skills_discovered": len(s.skills_discovered),
            "skills_total": 95,
            "chains_completed": len(s.chains_completed),
            "chains_total": 44,
            "achievements_unlocked": len(s.achievements_unlocked),
            "achievements_total": len(ALL_ACHIEVEMENTS),
            "total_skill_runs": s.total_skill_runs,
            "total_chain_runs": s.total_chain_runs,
        }

    def get_achievements(self) -> list[dict[str, Any]]:
        """Return all achievements with lock status."""
        results = []
        for a in ALL_ACHIEVEMENTS:
            unlocked_at = self._state.achievements_unlocked.get(a.id)
            results.append({
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "xp_reward": a.xp_reward,
                "icon": a.icon,
                "unlocked": unlocked_at is not None,
                "unlocked_at": unlocked_at,
            })
        return results

    def get_skilldex(self) -> dict[str, Any]:
        """Return skill collection progress by category."""
        discovered = set(self._state.skills_discovered)
        categories: dict[str, dict[str, Any]] = {}

        for cat, skills in SKILL_CATEGORIES.items():
            found = [s for s in skills if s in discovered]
            categories[cat] = {
                "discovered": len(found),
                "total": len(skills),
                "percent": round(len(found) / max(len(skills), 1) * 100, 1),
                "skills": [
                    {
                        "name": s,
                        "discovered": s in discovered,
                        "evolution": self._state.evolution_levels.get(s, "Undiscovered"),
                    }
                    for s in skills
                ],
            }

        total_discovered = len(discovered)
        return {
            "total_discovered": total_discovered,
            "total_skills": 95,
            "percent": round(total_discovered / 95 * 100, 1),
            "categories": categories,
        }

    def get_daily_quests(self) -> list[dict[str, Any]]:
        """Return today's 3 daily quests with completion status."""
        today = date.today()
        seed = int(hashlib.md5(today.isoformat().encode()).hexdigest()[:8], 16)

        quests = []
        used_indices: set[int] = set()

        for i in range(3):
            idx = (seed + i * 7) % len(_QUEST_TEMPLATES)
            while idx in used_indices:
                idx = (idx + 1) % len(_QUEST_TEMPLATES)
            used_indices.add(idx)

            template = _QUEST_TEMPLATES[idx]
            text = template["text"]

            # Fill in category placeholder
            if "{category}" in text:
                cat_idx = (seed + i * 13) % len(_CATEGORIES_LIST)
                text = text.format(category=_CATEGORIES_LIST[cat_idx])

            completed = self._check_quest_completed(template, today)
            quests.append({
                "text": text,
                "xp": template["xp"],
                "completed": completed,
                "type": template["type"],
            })

        return quests

    def get_evolutions(self) -> list[dict[str, Any]]:
        """Return top evolved skills."""
        tier_order = {"Diamond": 5, "Platinum": 4, "Gold": 3, "Silver": 2, "Bronze": 1}
        evos = [
            {"skill": s, "tier": t, "order": tier_order.get(t, 0)}
            for s, t in self._state.evolution_levels.items()
        ]
        evos.sort(key=lambda x: -x["order"])
        return [{"skill": e["skill"], "tier": e["tier"]} for e in evos[:10]]

    def backfill(self) -> dict[str, Any]:
        """Scan existing SkillState to retroactively populate trainer state."""
        try:
            from .skill_state import SkillStateStore
            store = SkillStateStore()
        except Exception:
            return {"backfilled": False, "error": "Could not load SkillStateStore"}

        skills = store.list_skills_with_state()
        backfilled_count = 0

        for skill_name in skills:
            state = store.get_state(skill_name)
            if state.run_count > 0:
                if skill_name not in self._state.skills_discovered:
                    self._state.skills_discovered.append(skill_name)
                    backfilled_count += 1
                # Update evolution
                tier = _evolution_tier(state.run_count)
                self._state.evolution_levels[skill_name] = tier
                # Add XP for historical runs
                self._state.xp += state.run_count * 10

        # Recalculate level
        self._state.level = _level_from_xp(self._state.xp)
        self._state.title = _title_from_level(self._state.level)

        self._check_achievements()
        self._save()

        return {
            "backfilled": True,
            "skills_found": len(skills),
            "newly_discovered": backfilled_count,
            "xp": self._state.xp,
            "level": self._state.level,
            "title": self._state.title,
        }

    # -- Internal ----------------------------------------------------------

    def _add_xp(self, amount: int) -> None:
        """Add XP and check for level up."""
        old_level = self._state.level
        self._state.xp += amount
        self._state.level = _level_from_xp(self._state.xp)
        self._state.title = _title_from_level(self._state.level)

        if self._state.level > old_level:
            logger.info(
                "LEVEL UP! %d -> %d (%s)",
                old_level, self._state.level, self._state.title,
            )

    def _update_streak(self) -> None:
        """Update streak based on today's date."""
        today = date.today().isoformat()
        yesterday = date.fromordinal(date.today().toordinal() - 1).isoformat()

        if self._state.streak_last_date == today:
            return  # Already tracked today
        elif self._state.streak_last_date == yesterday:
            self._state.streak_current += 1
        elif self._state.streak_last_date == "":
            self._state.streak_current = 1
        else:
            self._state.streak_current = 1  # Streak broken

        self._state.streak_last_date = today
        self._state.streak_best = max(
            self._state.streak_best, self._state.streak_current
        )

    def _try_unlock(self, achievement_id: str) -> None:
        """Unlock an achievement if not already unlocked."""
        if achievement_id not in self._state.achievements_unlocked:
            self._state.achievements_unlocked[achievement_id] = (
                datetime.now().isoformat()
            )
            ach = _ACHIEVEMENT_MAP.get(achievement_id)
            if ach:
                self._state.xp += ach.xp_reward
                self._newly_unlocked.append(ach)
                logger.info("Achievement unlocked: %s (+%d XP)", ach.name, ach.xp_reward)

    def _check_achievements(self) -> None:
        """Check all achievement conditions."""
        s = self._state
        n_skills = len(s.skills_discovered)
        n_chains = len(s.chains_completed)
        discovered = set(s.skills_discovered)

        # First steps
        if n_skills >= 1:
            self._try_unlock("first_run")
        if n_chains >= 1:
            self._try_unlock("first_chain")

        # Check if user has used at least one skill from every category
        cats_covered = set()
        for sk in s.skills_discovered:
            cat = _category_for_skill(sk)
            if cat != "Other":
                cats_covered.add(cat)
        if len(cats_covered) >= len(SKILL_CATEGORIES):
            self._try_unlock("first_category")

        # Collection
        if n_skills >= 10:
            self._try_unlock("collector_10")
        if n_skills >= 25:
            self._try_unlock("collector_25")
        if n_skills >= 50:
            self._try_unlock("collector_50")
        if n_skills >= 95:
            self._try_unlock("collector_95")

        # Chains
        if n_chains >= 5:
            self._try_unlock("chain_5")
        if n_chains >= 15:
            self._try_unlock("chain_15")
        if n_chains >= 44:
            self._try_unlock("chain_all")

        # Streaks
        streak = s.streak_current
        if streak >= 3:
            self._try_unlock("streak_3")
        if streak >= 7:
            self._try_unlock("streak_7")
        if streak >= 14:
            self._try_unlock("streak_14")
        if streak >= 30:
            self._try_unlock("streak_30")
        if streak >= 90:
            self._try_unlock("streak_90")

        # Category mastery
        mastery_map = {
            "master_life": "Life",
            "master_career": "Career",
            "master_business": "Business",
            "master_onboarding": "Onboarding",
            "master_health": "Health",
            "master_developer": "Developer",
        }
        for ach_id, cat in mastery_map.items():
            cat_skills = set(SKILL_CATEGORIES.get(cat, []))
            if cat_skills and cat_skills.issubset(discovered):
                self._try_unlock(ach_id)

        # Evolution
        tier_set = set(s.evolution_levels.values())
        if "Silver" in tier_set or "Gold" in tier_set or "Platinum" in tier_set or "Diamond" in tier_set:
            self._try_unlock("evolve_silver")
        if "Gold" in tier_set or "Platinum" in tier_set or "Diamond" in tier_set:
            self._try_unlock("evolve_gold")
        if "Platinum" in tier_set or "Diamond" in tier_set:
            self._try_unlock("evolve_platinum")
        if "Diamond" in tier_set:
            self._try_unlock("evolve_diamond")

        # Polyglot (5+ categories today)
        if len(s.categories_today) >= 5:
            self._try_unlock("polyglot")

        # Recalculate level after achievement XP
        self._state.level = _level_from_xp(self._state.xp)
        self._state.title = _title_from_level(self._state.level)

    def _check_quest_completed(self, template: dict, today: date) -> bool:
        """Check if a quest is completed for today."""
        if self._state.daily_runs_date != today.isoformat():
            return False

        qtype = template["type"]
        runs = self._state.daily_runs_today

        if qtype == "chain":
            return self._state.total_chain_runs > 0
        elif qtype == "new_skill":
            # Any skill run today that was first discovery
            return len(runs) > 0
        elif qtype == "count_3":
            return len(runs) >= 3
        elif qtype == "new_category":
            return len(self._state.categories_today) > 1
        elif qtype == "category":
            return len(runs) > 0
        return False

    # -- Persistence -------------------------------------------------------

    def _load(self) -> TrainerState:
        """Load trainer state from disk with schema validation."""
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                if not isinstance(data, dict):
                    logger.warning("Trainer state is not a dict, resetting")
                    return TrainerState()
                # Filter to known fields only, validate types for critical fields
                filtered = {}
                for k, v in data.items():
                    if k in TrainerState.__dataclass_fields__:
                        filtered[k] = v
                state = TrainerState(**filtered)
                # Clamp numeric fields to sane ranges
                state.xp = max(0, min(state.xp, 10_000_000))
                state.level = max(1, min(state.level, 50))
                state.streak_current = max(0, min(state.streak_current, 3650))
                state.streak_best = max(0, min(state.streak_best, 3650))
                return state
            except Exception as exc:
                logger.warning("Could not load trainer state: %s", exc)
        return TrainerState()

    def _save(self) -> None:
        """Persist trainer state to disk."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(asdict(self._state), indent=2, default=str),
            encoding="utf-8",
        )
