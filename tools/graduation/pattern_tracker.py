"""
pattern_tracker.py — Track task patterns, detect promotion candidates.

Ported from Velma's PatternTracker in neuros/llm_bridge/learning_loop.py.
When a task description pattern appears N times with a high success rate,
it becomes a PromotionCandidate eligible for code generation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .config import (
    MAX_DESCRIPTIONS_PER_PATTERN,
    MAX_PATTERNS,
    PROMOTION_SUCCESS_RATE,
    PROMOTION_THRESHOLD,
)


@dataclass
class PromotionCandidate:
    """A pattern that has met the promotion threshold."""

    pattern_key: str
    descriptions: list[str]
    domain: str
    success_rate: float
    count: int
    sample_outputs: list[str]


class PatternTracker:
    """Track repeated task patterns for skill extraction.

    When a task description pattern appears ``promotion_threshold`` times
    with at least ``min_success_rate`` success, it becomes eligible for
    promotion to an executable skill.

    Parameters
    ----------
    promotion_threshold:
        Minimum number of observations before a pattern can be promoted.
    min_success_rate:
        Minimum success ratio (0.0-1.0) required for promotion.
    """

    def __init__(
        self,
        promotion_threshold: int = PROMOTION_THRESHOLD,
        min_success_rate: float = PROMOTION_SUCCESS_RATE,
    ) -> None:
        self._promotion_threshold = promotion_threshold
        self._min_success_rate = min_success_rate
        # pattern_key -> tracking dict
        self._patterns: dict[str, dict] = {}

    # -- Public API ----------------------------------------------------------

    def record(
        self,
        description: str,
        domain: str,
        success: bool,
        output: str = "",
    ) -> Optional[str]:
        """Record a task outcome.

        Returns the pattern key if the pattern is now ready for promotion,
        otherwise ``None``.
        """
        key = self._compute_key(description)

        if key not in self._patterns:
            self._patterns[key] = {
                "count": 0,
                "successes": 0,
                "descriptions": [],
                "domains": set(),
                "outputs": [],
            }

        entry = self._patterns[key]
        entry["count"] += 1
        if success:
            entry["successes"] += 1

        entry["descriptions"].append(description)
        if len(entry["descriptions"]) > MAX_DESCRIPTIONS_PER_PATTERN:
            entry["descriptions"] = entry["descriptions"][-MAX_DESCRIPTIONS_PER_PATTERN:]

        entry["domains"].add(domain)

        if output:
            entry["outputs"].append(output)
            if len(entry["outputs"]) > MAX_DESCRIPTIONS_PER_PATTERN:
                entry["outputs"] = entry["outputs"][-MAX_DESCRIPTIONS_PER_PATTERN:]

        # Evict lowest-count pattern if at capacity
        if len(self._patterns) > MAX_PATTERNS:
            min_key = min(
                (k for k in self._patterns if k != key),
                key=lambda k: self._patterns[k]["count"],
                default=None,
            )
            if min_key is not None:
                del self._patterns[min_key]

        # Check for promotion
        if (
            entry["count"] >= self._promotion_threshold
            and entry["successes"] / entry["count"] >= self._min_success_rate
        ):
            return key

        return None

    def check_promotions(self) -> list[PromotionCandidate]:
        """Return all patterns that currently meet the promotion criteria."""
        candidates: list[PromotionCandidate] = []
        for key, entry in self._patterns.items():
            if entry["count"] < self._promotion_threshold:
                continue
            rate = entry["successes"] / entry["count"]
            if rate < self._min_success_rate:
                continue
            candidates.append(
                PromotionCandidate(
                    pattern_key=key,
                    descriptions=list(entry["descriptions"]),
                    domain=next(iter(entry["domains"]), "general"),
                    success_rate=rate,
                    count=entry["count"],
                    sample_outputs=list(entry["outputs"]),
                )
            )
        return candidates

    def get_pattern(self, key: str) -> Optional[dict]:
        """Get raw pattern data by key."""
        return self._patterns.get(key)

    def mark_promoted(self, key: str) -> None:
        """Reset a pattern's counts after promotion."""
        if key in self._patterns:
            self._patterns[key]["count"] = 0
            self._patterns[key]["successes"] = 0

    @property
    def tracked_count(self) -> int:
        """Number of patterns currently being tracked."""
        return len(self._patterns)

    # -- Internal ------------------------------------------------------------

    def _compute_key(self, description: str) -> str:
        """Compute a fuzzy key from a description (normalized sorted words).

        Uses sorted significant words (length > 3) to group similar
        descriptions under the same key.
        """
        words = sorted(set(description.lower().split()))
        significant = [w for w in words if len(w) > 3][:5]
        return "|".join(significant) if significant else description.lower()[:50]
