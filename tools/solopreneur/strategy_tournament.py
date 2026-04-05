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
strategy_tournament.py — Generate 3 business strategies and pick the best.

Like Verified Fix Mode generates 5 candidate fixes and picks the winner,
this generates LEAN / PREMIUM / GROWTH strategies and scores them.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from .config import MVP_TIMELINE_WEEKS, TOURNAMENT_WEIGHTS
from .market_scanner import MarketAnalysis, _detect_type, _parse_budget
from .validator import IdeaInput

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class StrategyCandidate:
    """A single strategy with its scores."""

    name: str                                    # lean / premium / growth
    description: str = ""
    scores: dict[str, float] = field(default_factory=dict)
    weighted_score: float = 0.0
    rank: int = 0

    # Strategy details
    time_to_revenue_weeks: int = 0
    capital_required_monthly: float = 0.0
    risk_level: str = "medium"
    scalability: str = "medium"
    first_move: str = ""
    key_assumption: str = ""


@dataclass
class TournamentResult:
    """Result of the strategy tournament."""

    winner: StrategyCandidate = field(default_factory=StrategyCandidate)
    candidates: list[StrategyCandidate] = field(default_factory=list)
    rationale: str = ""
    weights_used: dict[str, float] = field(default_factory=dict)


# -- Tournament ----------------------------------------------------------------

class StrategyTournament:
    """Generate 3 different business strategies and pick the best."""

    def __init__(self, weights: dict[str, float] | None = None):
        self.weights = weights or dict(TOURNAMENT_WEIGHTS)

    def run(self, idea: IdeaInput, market: MarketAnalysis) -> TournamentResult:
        """
        Generate and score 3 strategies:

        1. LEAN   -- smallest possible MVP, validate with manual processes first
        2. PREMIUM -- higher price, fewer customers, quality-first
        3. GROWTH  -- aggressive customer acquisition, optimize for speed

        Scores each on 5 dimensions (0-1 each):
        - Time to first revenue   (30%)
        - Capital required        (20%)
        - Risk level              (20%)
        - Scalability potential   (15%)
        - Founder fit             (15%)
        """
        biz_type = _detect_type(idea)
        budget = _parse_budget(idea.budget_range)

        candidates = [
            self._build_lean(idea, biz_type, budget, market),
            self._build_premium(idea, biz_type, budget, market),
            self._build_growth(idea, biz_type, budget, market),
        ]

        # Score and rank
        for c in candidates:
            c.weighted_score = sum(
                c.scores.get(dim, 0.5) * weight
                for dim, weight in self.weights.items()
            )

        candidates.sort(key=lambda c: c.weighted_score, reverse=True)
        for i, c in enumerate(candidates):
            c.rank = i + 1

        winner = candidates[0]
        rationale = self._build_rationale(winner, candidates, idea)

        return TournamentResult(
            winner=winner,
            candidates=candidates,
            rationale=rationale,
            weights_used=dict(self.weights),
        )

    # -- Strategy builders -----------------------------------------------------

    def _build_lean(
        self, idea: IdeaInput, biz_type: str, budget: float, market: MarketAnalysis
    ) -> StrategyCandidate:
        """Build the LEAN strategy: minimum viable, maximum speed."""
        mvp_weeks = max(1, MVP_TIMELINE_WEEKS.get(biz_type, 4) // 2)
        capital = min(budget, 100) if budget else 50

        # Score each dimension 0-1
        scores = {
            "time_to_revenue": 0.9,     # Fastest to revenue
            "capital_required": 0.95,   # Lowest capital
            "risk_level": 0.7,          # Low risk (small bets)
            "scalability": 0.4,         # Hard to scale manual processes
            "founder_fit": self._score_founder_fit(idea, "lean"),
        }

        return StrategyCandidate(
            name="LEAN",
            description=(
                "Ship the smallest possible thing. Sell before you build. "
                "Use manual processes for the first 10 customers. "
                "Validate demand before investing in automation or infrastructure."
            ),
            scores=scores,
            time_to_revenue_weeks=mvp_weeks,
            capital_required_monthly=capital,
            risk_level="low",
            scalability="low-medium",
            first_move=(
                "Create a landing page today. DM 10 potential customers tomorrow. "
                "Offer to solve their problem manually for free or at a discount."
            ),
            key_assumption="People will pay for this if you solve it manually first.",
        )

    def _build_premium(
        self, idea: IdeaInput, biz_type: str, budget: float, market: MarketAnalysis
    ) -> StrategyCandidate:
        """Build the PREMIUM strategy: quality first, charge more."""
        mvp_weeks = MVP_TIMELINE_WEEKS.get(biz_type, 4)
        capital = min(budget, 300) if budget else 200

        scores = {
            "time_to_revenue": 0.5,     # Slower to first revenue
            "capital_required": 0.6,    # Moderate capital
            "risk_level": 0.6,          # Medium risk (higher investment before validation)
            "scalability": 0.7,         # Better margins enable scaling
            "founder_fit": self._score_founder_fit(idea, "premium"),
        }

        return StrategyCandidate(
            name="PREMIUM",
            description=(
                "Build a high-quality offering and charge premium prices. "
                "Focus on fewer customers who pay more. "
                "Over-deliver for early clients to build reputation and referrals."
            ),
            scores=scores,
            time_to_revenue_weeks=mvp_weeks,
            capital_required_monthly=capital,
            risk_level="medium",
            scalability="medium-high",
            first_move=(
                "Define your premium offer in detail. Build a polished pitch deck / proposal. "
                "Reach out to 5 high-value prospects with a personalized approach."
            ),
            key_assumption="The target audience values quality over price and will pay premium rates.",
        )

    def _build_growth(
        self, idea: IdeaInput, biz_type: str, budget: float, market: MarketAnalysis
    ) -> StrategyCandidate:
        """Build the GROWTH strategy: speed and scale."""
        mvp_weeks = max(1, int(MVP_TIMELINE_WEEKS.get(biz_type, 4) * 0.75))
        capital = max(budget, 500) if budget else 500

        scores = {
            "time_to_revenue": 0.6,     # Moderate speed
            "capital_required": 0.3,    # Highest capital needs
            "risk_level": 0.4,          # Higher risk (spending before proven)
            "scalability": 0.95,        # Best scalability
            "founder_fit": self._score_founder_fit(idea, "growth"),
        }

        return StrategyCandidate(
            name="GROWTH",
            description=(
                "Aggressive customer acquisition from day one. "
                "Invest in marketing, content, and outreach at scale. "
                "Optimize for speed of learning — test many channels fast."
            ),
            scores=scores,
            time_to_revenue_weeks=mvp_weeks,
            capital_required_monthly=capital,
            risk_level="high",
            scalability="high",
            first_move=(
                "Launch MVP fast. Immediately start cold outreach at volume (100+/week). "
                "Test paid ads with small budget ($5-10/day). Publish daily content."
            ),
            key_assumption="There's enough demand that volume outreach will find customers quickly.",
        )

    # -- Helpers ---------------------------------------------------------------

    def _score_founder_fit(self, idea: IdeaInput, strategy: str) -> float:
        """Score founder fit for a specific strategy (0-1)."""
        if not idea.founder_skills:
            return 0.5

        skills_text = " ".join(idea.founder_skills).lower()

        # Strategy-specific skill matches
        lean_skills = {"scrappy", "hustle", "sales", "manual", "mvp", "lean", "freelance"}
        premium_skills = {"quality", "design", "brand", "expert", "senior", "consulting", "premium"}
        growth_skills = {"marketing", "growth", "ads", "content", "scale", "data", "analytics"}

        skill_map = {
            "lean": lean_skills,
            "premium": premium_skills,
            "growth": growth_skills,
        }

        target_skills = skill_map.get(strategy, lean_skills)
        matches = sum(1 for s in target_skills if s in skills_text)

        # Also count general relevance
        idea_words = set(idea.idea_description.lower().split())
        skill_words = set(skills_text.split())
        overlap = len(idea_words & skill_words)

        score = 0.5 + (matches * 0.1) + (min(overlap, 3) * 0.05)
        return min(1.0, score)

    def _build_rationale(
        self,
        winner: StrategyCandidate,
        candidates: list[StrategyCandidate],
        idea: IdeaInput,
    ) -> str:
        """Explain why the winner was selected."""
        scores_summary = []
        for c in candidates:
            scores_summary.append(
                f"  {c.name}: {c.weighted_score:.2f} "
                f"(revenue speed={c.scores.get('time_to_revenue', 0):.1f}, "
                f"capital={c.scores.get('capital_required', 0):.1f}, "
                f"risk={c.scores.get('risk_level', 0):.1f}, "
                f"scale={c.scores.get('scalability', 0):.1f}, "
                f"fit={c.scores.get('founder_fit', 0):.1f})"
            )

        runner_up = candidates[1] if len(candidates) > 1 else None
        comparison = ""
        if runner_up:
            diff = winner.weighted_score - runner_up.weighted_score
            if diff < 0.05:
                comparison = (
                    f"\n\nNote: {runner_up.name} scored very close ({diff:.2f} gap). "
                    f"Consider {runner_up.name} if {runner_up.key_assumption}"
                )
            else:
                comparison = (
                    f"\n\n{winner.name} wins by {diff:.2f} over {runner_up.name}."
                )

        return (
            f"WINNER: {winner.name}\n\n"
            f"Rationale: {winner.description}\n\n"
            f"Key assumption: {winner.key_assumption}\n\n"
            f"First move: {winner.first_move}\n\n"
            f"Scores:\n" + "\n".join(scores_summary) + comparison
        )
