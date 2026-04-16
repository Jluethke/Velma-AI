"""
decay.py
========
ImportanceDecay — scores assertions by their current relevance.

importance(t) = base_confidence * decay_factor ^ (elapsed_days / half_life)

Where:
  elapsed_days = days since valid_from
  half_life    = days at which importance halves  (default 30)
  decay_factor = 0.5  (50% per half_life)

Exceptions to decay:
  - hard constraints (predicate starts with "constraint:")   → no decay
  - consensus_validated assertions                           → no decay
  - assertions with explicit valid_to in the future          → no decay until expiry
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import List

from .assertion import TKGAssertion

DEFAULT_HALF_LIFE_DAYS = 30.0
DECAY_FACTOR = 0.5


def compute_importance(
    assertion: TKGAssertion,
    now: datetime | None = None,
    half_life_days: float = DEFAULT_HALF_LIFE_DAYS,
) -> float:
    if now is None:
        now = datetime.now(timezone.utc)

    # No decay for constraints or consensus-validated facts
    if assertion.predicate.startswith("constraint:"):
        return assertion.confidence
    if assertion.derivation_kind == "consensus_validated":
        return assertion.confidence

    # No decay if still within explicit valid_to
    if assertion.valid_to is not None and assertion.valid_to > now:
        return assertion.confidence

    elapsed_seconds = max(0.0, (now - assertion.valid_from).total_seconds())
    elapsed_days = elapsed_seconds / 86_400.0

    importance = assertion.confidence * (DECAY_FACTOR ** (elapsed_days / half_life_days))
    return max(0.0, importance)


class ImportanceDecay:
    """
    Applies decay to all assertions in a collection.

    Call `run(assertions)` periodically (e.g., on every store load or
    on a scheduled tick) to update importance scores.
    """

    def __init__(self, half_life_days: float = DEFAULT_HALF_LIFE_DAYS):
        self.half_life_days = half_life_days

    def run(self, assertions: List[TKGAssertion]) -> int:
        """Update importance on all assertions. Returns count updated."""
        now = datetime.now(timezone.utc)
        count = 0
        for a in assertions:
            new_importance = compute_importance(a, now, self.half_life_days)
            if abs(new_importance - a.importance) > 1e-6:
                a.importance = new_importance
                count += 1
        return count

    def below_threshold(
        self,
        assertions: List[TKGAssertion],
        threshold: float = 0.05,
    ) -> List[TKGAssertion]:
        """Return assertions whose importance has decayed below threshold."""
        return [a for a in assertions if a.importance < threshold]
