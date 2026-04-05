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
validator.py — Idea validation using the Mom Test framework.

Scores a business idea on 5 dimensions and produces a go/no-go signal.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class IdeaInput:
    """Everything needed to evaluate a business idea."""

    idea_description: str
    target_audience: str
    problem_statement: str = ""
    founder_skills: list[str] = field(default_factory=list)
    budget_range: str = ""
    business_type: str = ""

    def __post_init__(self) -> None:
        if not self.problem_statement:
            self.problem_statement = self.idea_description


@dataclass
class ValidationResult:
    """Outcome of idea validation."""

    scores: dict[str, int] = field(default_factory=dict)
    overall_score: int = 0
    recommendation: str = "no go"  # "strong go" / "go with caveats" / "pivot" / "no go"
    concerns: list[str] = field(default_factory=list)
    strengths: list[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.recommendation in ("strong go", "go with caveats")


# -- Scoring helpers -----------------------------------------------------------

# Specificity markers — the more specific, the higher the score.
_VAGUE_PROBLEM_WORDS = {
    "improve", "better", "enhance", "optimize", "streamline",
    "help", "make easier", "boost", "increase",
}

_SPECIFIC_MARKERS = {
    "hours", "minutes", "week", "month", "day", "per", "manually",
    "currently", "spend", "$", "cost", "pay", "waste", "error",
    "broken", "painful", "frustrating",
}

_AUDIENCE_VAGUE = {
    "everyone", "people", "users", "businesses", "companies",
    "small businesses", "entrepreneurs", "startups",
}

_AUDIENCE_SPECIFIC_MARKERS = {
    "doing", "making", "earning", "with", "who", "between",
    "$", "K", "k", "month", "year", "revenue", "employees",
    "store", "shop", "clinic", "practice", "studio",
}

_PAYMENT_EVIDENCE = {
    "pay", "paid", "subscribe", "subscription", "pricing",
    "budget", "spend", "cost", "invoice", "charge", "fee",
    "$", "per month", "per year", "annually", "monthly",
    "currently use", "alternative", "competitor",
}

_SKILL_KEYWORDS = {
    "years", "experience", "built", "worked", "led", "managed",
    "founded", "shipped", "developed", "designed", "sold",
    "domain", "industry", "expert", "certified",
}


def _count_markers(text: str, markers: set[str]) -> int:
    """Count how many marker phrases appear in text."""
    text_lower = text.lower()
    return sum(1 for m in markers if m.lower() in text_lower)


def _word_count(text: str) -> int:
    return len(text.split())


def _has_numbers(text: str) -> bool:
    return bool(re.search(r'\d', text))


# -- Validator -----------------------------------------------------------------

class IdeaValidator:
    """Validates a business idea using the Mom Test framework."""

    def validate(self, idea: IdeaInput) -> ValidationResult:
        """
        Score an idea on 5 dimensions (0-10 each, total 0-50):

        1. Problem clarity   -- is the problem specific and painful?
        2. Audience definition -- who exactly has this problem?
        3. Willingness to pay -- would they pay to solve it?
        4. Competition level  -- crowded or open market?
        5. Founder fit        -- does the founder have relevant skills/access?

        Returns ValidationResult with scores, recommendation, concerns, strengths.
        """
        scores: dict[str, int] = {}
        concerns: list[str] = []
        strengths: list[str] = []

        # 1. Problem clarity
        scores["problem_clarity"] = self._score_problem(idea, concerns, strengths)

        # 2. Audience definition
        scores["audience_definition"] = self._score_audience(idea, concerns, strengths)

        # 3. Willingness to pay
        scores["willingness_to_pay"] = self._score_willingness(idea, concerns, strengths)

        # 4. Competition level
        scores["competition_level"] = self._score_competition(idea, concerns, strengths)

        # 5. Founder fit
        scores["founder_fit"] = self._score_founder_fit(idea, concerns, strengths)

        overall = sum(scores.values())
        recommendation = self._recommend(overall, scores)

        return ValidationResult(
            scores=scores,
            overall_score=overall,
            recommendation=recommendation,
            concerns=concerns,
            strengths=strengths,
        )

    # -- Dimension scorers -----------------------------------------------------

    def _score_problem(self, idea: IdeaInput, concerns: list, strengths: list) -> int:
        """Score problem clarity 0-10."""
        text = idea.problem_statement or idea.idea_description
        score = 4  # baseline

        # Penalize vague language
        vague_count = _count_markers(text, _VAGUE_PROBLEM_WORDS)
        if vague_count >= 3:
            score -= 2
            concerns.append("Problem statement uses vague language — be more specific about the pain.")
        elif vague_count >= 1:
            score -= 1

        # Reward specific markers
        specific_count = _count_markers(text, _SPECIFIC_MARKERS)
        if specific_count >= 4:
            score += 4
            strengths.append("Problem is highly specific with quantifiable pain points.")
        elif specific_count >= 2:
            score += 2
            strengths.append("Problem has some specific detail — could be sharper.")
        elif specific_count == 0:
            concerns.append("No specific pain metrics — add time/money/frequency details.")

        # Reward numbers (quantified pain)
        if _has_numbers(text):
            score += 1

        # Reward longer, more detailed descriptions
        wc = _word_count(text)
        if wc >= 30:
            score += 1
        elif wc < 10:
            score -= 1
            concerns.append("Problem statement is too brief — elaborate on the pain.")

        return max(1, min(10, score))

    def _score_audience(self, idea: IdeaInput, concerns: list, strengths: list) -> int:
        """Score audience definition 0-10."""
        text = idea.target_audience
        score = 4

        # Penalize overly broad audiences
        vague_count = _count_markers(text, _AUDIENCE_VAGUE)
        if vague_count >= 2:
            score -= 2
            concerns.append("Target audience is too broad — narrow to a specific segment.")
        elif vague_count >= 1:
            score -= 1

        # Reward specific markers
        specific_count = _count_markers(text, _AUDIENCE_SPECIFIC_MARKERS)
        if specific_count >= 4:
            score += 4
            strengths.append("Target audience is precisely defined with demographics and behaviour.")
        elif specific_count >= 2:
            score += 2
        elif specific_count == 0:
            concerns.append("Audience lacks specificity — define income, size, or behaviour.")

        # Numbers (revenue range, employee count, etc.)
        if _has_numbers(text):
            score += 1

        # Word count
        wc = _word_count(text)
        if wc >= 15:
            score += 1
        elif wc < 5:
            score -= 1

        return max(1, min(10, score))

    def _score_willingness(self, idea: IdeaInput, concerns: list, strengths: list) -> int:
        """Score willingness to pay 0-10."""
        combined = f"{idea.idea_description} {idea.problem_statement} {idea.target_audience}"
        score = 4

        payment_count = _count_markers(combined, _PAYMENT_EVIDENCE)
        if payment_count >= 4:
            score += 4
            strengths.append("Strong evidence of willingness to pay — existing spend or alternatives.")
        elif payment_count >= 2:
            score += 2
        elif payment_count == 0:
            score -= 1
            concerns.append(
                "No evidence of willingness to pay — research if audience currently "
                "spends money on alternatives."
            )

        # Budget provided?
        if idea.budget_range and _has_numbers(idea.budget_range):
            score += 1

        return max(1, min(10, score))

    def _score_competition(self, idea: IdeaInput, concerns: list, strengths: list) -> int:
        """
        Score competition level 0-10.

        Heuristic only — the MarketScanner does real competitive analysis.
        High score = healthy competitive landscape (2-3 competitors with gaps).
        Low score = either hyper-crowded or zero competitors (unproven market).
        """
        text = f"{idea.idea_description} {idea.problem_statement}"
        score = 6  # Assume moderate competition by default

        # If the idea mentions competitors/alternatives, that's awareness
        competitor_markers = {"competitor", "alternative", "existing", "better than", "unlike"}
        marker_count = _count_markers(text, competitor_markers)
        if marker_count >= 2:
            score += 2
            strengths.append("Founder is aware of competitive landscape.")
        elif marker_count == 0:
            score -= 1
            concerns.append(
                "No mention of competitors — research the landscape before proceeding."
            )

        # Novel/niche indicators
        niche_markers = {"niche", "underserved", "gap", "unmet", "no one", "first"}
        niche_count = _count_markers(text, niche_markers)
        if niche_count >= 2:
            score += 1
            strengths.append("Identified a potential market gap.")

        return max(1, min(10, score))

    def _score_founder_fit(self, idea: IdeaInput, concerns: list, strengths: list) -> int:
        """Score founder fit 0-10."""
        if not idea.founder_skills:
            concerns.append("No founder skills provided — hard to assess fit.")
            return 4

        skills_text = " ".join(idea.founder_skills).lower()
        idea_text = idea.idea_description.lower()
        score = 4

        # Count relevant skill keywords
        skill_count = _count_markers(skills_text, _SKILL_KEYWORDS)
        if skill_count >= 3:
            score += 3
            strengths.append("Strong founder experience signals.")
        elif skill_count >= 1:
            score += 1

        # Check overlap between skills and idea
        skill_words = set(skills_text.split())
        idea_words = set(idea_text.split())
        overlap = skill_words & idea_words
        if len(overlap) >= 3:
            score += 2
            strengths.append("Founder skills directly overlap with the business domain.")
        elif len(overlap) >= 1:
            score += 1

        # Number of skills listed
        if len(idea.founder_skills) >= 5:
            score += 1
        elif len(idea.founder_skills) <= 1:
            score -= 1
            concerns.append("Limited skill set listed — consider a co-founder or contractor.")

        return max(1, min(10, score))

    # -- Recommendation --------------------------------------------------------

    @staticmethod
    def _recommend(overall: int, scores: dict[str, int]) -> str:
        """Map overall score to a recommendation."""
        # Check for dealbreakers
        low_dims = [k for k, v in scores.items() if v <= 2]
        if len(low_dims) >= 2:
            return "no go"
        if overall >= 40:
            return "strong go"
        if overall >= 30:
            return "go with caveats" if not low_dims else "pivot"
        if overall >= 20:
            return "pivot"
        return "no go"
