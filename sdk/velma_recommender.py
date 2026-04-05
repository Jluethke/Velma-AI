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
velma_recommender.py
====================

Velma knows what you need before you ask.

Observes your trainer state, skill history, streaks, time patterns,
and category gaps — then recommends the chain you should run RIGHT NOW.
No searching. No browsing. Velma just tells you.

Example::

    from skillchain.sdk.velma_recommender import VelmaRecommender

    velma = VelmaRecommender()
    rec = velma.what_now()
    print(rec)
    # → "You haven't checked in on yourself in 3 weeks. Run am-i-okay."
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from .gamification import GamificationEngine, SKILL_CATEGORIES, TrainerState

logger = logging.getLogger(__name__)

_MARKETPLACE_DIR = Path(__file__).resolve().parent.parent / "marketplace"


# ---------------------------------------------------------------------------
# Recommendation
# ---------------------------------------------------------------------------

@dataclass
class VelmaRecommendation:
    """What Velma thinks you should do right now."""
    chain_name: str
    reason: str
    priority: int  # 1 = most urgent, 5 = nice to have
    category: str
    nudge: str  # The human-friendly message


# ---------------------------------------------------------------------------
# Time rules
# ---------------------------------------------------------------------------

_DAY_OF_WEEK_CHAINS = {
    0: ("weekly-ops", "It's Monday. Time to plan your week."),
    6: ("weekly-ops", "Sunday night. Set up tomorrow."),
}

_TIME_OF_DAY_CHAINS = {
    # (start_hour, end_hour): (chain, nudge)
    (5, 8): ("morning-routine", "Early bird gets the plan."),
}


# ---------------------------------------------------------------------------
# Category health thresholds
# ---------------------------------------------------------------------------

_CATEGORY_NUDGES = {
    "Life": ("am-i-okay", "You haven't done a life check-in lately."),
    "Health": ("healthy-living-reset", "Your health category is untouched."),
    "Money": ("money-wake-up", "When's the last time you looked at your money?"),
    "Career": ("should-i-quit", "Your career chains have been quiet."),
    "Learning": ("learn-anything", "You haven't learned anything new in a while."),
    "Onboarding": ("tech-confidence-builder", "Some onboarding skills might help."),
}

# New user progression
_NEW_USER_SEQUENCE = [
    ("tech-confidence-builder", "Let's start with the basics.", 0),
    ("learn-anything", "Pick something you've always wanted to learn.", 3),
    ("am-i-okay", "Let's check in on how you're doing.", 7),
    ("weekly-ops", "Time to build a weekly rhythm.", 10),
    ("before-you-leap", "Got any big decisions brewing?", 14),
]


# ---------------------------------------------------------------------------
# Recommender
# ---------------------------------------------------------------------------

class VelmaRecommender:
    """Observes your state and recommends what to do next."""

    def __init__(self) -> None:
        self._engine = GamificationEngine()
        self._state = self._engine._state
        self._chains = self._load_chains()

    def what_now(self) -> list[VelmaRecommendation]:
        """What should you do right now? Returns ranked recommendations."""
        recs: list[VelmaRecommendation] = []

        # 1. New user check
        if self._state.total_skill_runs == 0:
            recs.append(VelmaRecommendation(
                chain_name="tech-confidence-builder",
                reason="first_time_user",
                priority=1,
                category="onboarding",
                nudge="Welcome. Let's start with understanding what AI can do for you.",
            ))
            return recs

        # 2. Streak about to die
        streak_rec = self._check_streak()
        if streak_rec:
            recs.append(streak_rec)

        # 3. Time-based recommendations
        time_rec = self._check_time()
        if time_rec:
            recs.append(time_rec)

        # 4. Category gaps
        gap_recs = self._check_category_gaps()
        recs.extend(gap_recs)

        # 5. Progression — what's the natural next step
        prog_rec = self._check_progression()
        if prog_rec:
            recs.append(prog_rec)

        # 6. Quest completion
        quest_rec = self._check_quests()
        if quest_rec:
            recs.append(quest_rec)

        # Sort by priority
        recs.sort(key=lambda r: r.priority)

        # Dedupe by chain name
        seen: set[str] = set()
        unique: list[VelmaRecommendation] = []
        for r in recs:
            if r.chain_name not in seen:
                seen.add(r.chain_name)
                unique.append(r)

        return unique[:5]  # Top 5

    def nudge(self) -> str:
        """Get a single human-friendly nudge message."""
        recs = self.what_now()
        if not recs:
            return "You're all caught up. Take a break or explore something new."
        return recs[0].nudge

    # -- Checks ------------------------------------------------------------

    def _check_streak(self) -> Optional[VelmaRecommendation]:
        """Is the streak about to break?"""
        if self._state.streak_current == 0:
            return None

        today = date.today().isoformat()
        if self._state.streak_last_date == today:
            return None  # Already ran today

        yesterday = date.fromordinal(date.today().toordinal() - 1).isoformat()
        if self._state.streak_last_date == yesterday:
            # Streak is alive but hasn't been maintained today
            return VelmaRecommendation(
                chain_name=self._quick_chain(),
                reason="streak_maintenance",
                priority=1,
                category="life",
                nudge=f"Your {self._state.streak_current}-day streak is on the line. Run anything to keep it alive.",
            )
        return None

    def _check_time(self) -> Optional[VelmaRecommendation]:
        """Time-of-day or day-of-week recommendations."""
        now = datetime.now()
        dow = now.weekday()

        # Day of week
        if dow in _DAY_OF_WEEK_CHAINS:
            chain, nudge = _DAY_OF_WEEK_CHAINS[dow]
            # Only suggest if they haven't run it today
            if chain not in self._state.daily_runs_today:
                return VelmaRecommendation(
                    chain_name=chain,
                    reason="day_of_week",
                    priority=2,
                    category="life",
                    nudge=nudge,
                )

        # Time of day
        hour = now.hour
        for (start, end), (chain, nudge) in _TIME_OF_DAY_CHAINS.items():
            if start <= hour < end and chain not in self._state.daily_runs_today:
                return VelmaRecommendation(
                    chain_name=chain,
                    reason="time_of_day",
                    priority=2,
                    category="life",
                    nudge=nudge,
                )

        return None

    def _check_category_gaps(self) -> list[VelmaRecommendation]:
        """Find categories the user has never explored."""
        discovered = set(self._state.skills_discovered)
        recs: list[VelmaRecommendation] = []

        for cat, skills in SKILL_CATEGORIES.items():
            found = [s for s in skills if s in discovered]
            if len(found) == 0 and cat in _CATEGORY_NUDGES:
                chain, nudge = _CATEGORY_NUDGES[cat]
                recs.append(VelmaRecommendation(
                    chain_name=chain,
                    reason=f"category_gap_{cat.lower()}",
                    priority=3,
                    category=cat.lower(),
                    nudge=nudge,
                ))

        return recs[:2]  # Max 2 category gap suggestions

    def _check_progression(self) -> Optional[VelmaRecommendation]:
        """What's the natural next step based on what they've done?"""
        completed = set(self._state.chains_completed)

        # If they just finished should-i-quit, suggest the next step
        if "should-i-quit" in completed and "job-search-blitz" not in completed:
            return VelmaRecommendation(
                chain_name="job-search-blitz",
                reason="progression",
                priority=3,
                category="career",
                nudge="You thought about quitting. Ready to start looking?",
            )

        if "job-search-blitz" in completed and "career-pivot" not in completed:
            return VelmaRecommendation(
                chain_name="career-pivot",
                reason="progression",
                priority=4,
                category="career",
                nudge="Job search is rolling. Want to explore a different field entirely?",
            )

        # Business progression
        if "micro-business-launch" in completed and "content-to-customers" not in completed:
            return VelmaRecommendation(
                chain_name="content-to-customers",
                reason="progression",
                priority=3,
                category="business",
                nudge="Business is launched. Time to get customers with content.",
            )

        if "startup-validation" in completed and "first-customers" not in completed:
            return VelmaRecommendation(
                chain_name="first-customers",
                reason="progression",
                priority=3,
                category="business",
                nudge="Idea is validated. Time to find your first 10 customers.",
            )

        # Life progression
        if "stuck-to-unstuck" in completed and "before-you-leap" not in completed:
            return VelmaRecommendation(
                chain_name="before-you-leap",
                reason="progression",
                priority=4,
                category="life",
                nudge="You broke the paralysis. Ready to make the big move?",
            )

        # Health progression
        if "healthy-living-reset" in completed and "morning-routine" not in completed:
            return VelmaRecommendation(
                chain_name="morning-routine",
                reason="progression",
                priority=4,
                category="life",
                nudge="Health plan is set. Build a morning routine to sustain it.",
            )

        return None

    def _check_quests(self) -> Optional[VelmaRecommendation]:
        """Suggest a chain that helps complete a daily quest."""
        quests = self._engine.get_daily_quests()
        for q in quests:
            if not q["completed"]:
                if q["type"] == "chain":
                    return VelmaRecommendation(
                        chain_name=self._quick_chain(),
                        reason="quest_completion",
                        priority=4,
                        category="life",
                        nudge=f"Daily quest: {q['text']} (+{q['xp']} XP)",
                    )
                if q["type"] == "new_skill":
                    # Find a category they haven't explored
                    discovered = set(self._state.skills_discovered)
                    for cat, skills in SKILL_CATEGORIES.items():
                        for s in skills:
                            if s not in discovered:
                                return VelmaRecommendation(
                                    chain_name=_CATEGORY_NUDGES.get(cat, ("learn-anything", ""))[0],
                                    reason="quest_new_skill",
                                    priority=4,
                                    category=cat.lower(),
                                    nudge=f"Try something new: {s.replace('-', ' ')} (+{q['xp']} XP)",
                                )
        return None

    # -- Helpers -----------------------------------------------------------

    def _quick_chain(self) -> str:
        """Return a short chain for streak maintenance."""
        # Prefer chains the user hasn't run yet
        completed = set(self._state.chains_completed)
        quick_options = [
            "morning-routine", "weekly-ops", "health-check-prep",
            "learn-anything", "meeting-to-action",
        ]
        for c in quick_options:
            if c not in completed:
                return c
        return "morning-routine"

    def _load_chains(self) -> list[dict]:
        """Load chain definitions."""
        chains_dir = _MARKETPLACE_DIR / "chains"
        chains = []
        if chains_dir.exists():
            for f in sorted(chains_dir.glob("*.chain.json")):
                try:
                    chains.append(json.loads(f.read_text(encoding="utf-8")))
                except Exception:
                    continue
        return chains
