"""
contradiction.py
================
ContradictionDetector — identifies when a new assertion conflicts with
an existing active assertion on the same (subject, predicate) with a
different object value AND overlapping validity windows.

Resolution strategies:
  higher_confidence  — keep whichever has higher confidence (default)
  newer_wins         — newer valid_from always invalidates older
  explicit           — caller decides, detector just flags
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Literal, Optional, Tuple

from .assertion import TKGAssertion


ResolutionStrategy = Literal["higher_confidence", "newer_wins", "explicit"]


@dataclass
class ContradictionResult:
    conflict: bool
    new_assertion: TKGAssertion
    existing: Optional[TKGAssertion] = None
    # Which assertion to keep (and which to invalidate)
    keep: Optional[TKGAssertion] = None
    invalidate: Optional[TKGAssertion] = None
    reason: str = ""


class ContradictionDetector:
    """
    Checks a candidate assertion against active assertions on the same SP key.

    Does NOT mutate the store — returns a ContradictionResult; the store
    calls invalidate() based on the result.
    """

    def __init__(self, strategy: ResolutionStrategy = "higher_confidence"):
        self.strategy = strategy

    def check(
        self,
        candidate: TKGAssertion,
        active_on_sp: List[TKGAssertion],
    ) -> ContradictionResult:
        """
        Check candidate against all active assertions sharing its SP key.

        Returns the first conflict found (highest severity wins in practice).
        """
        for existing in active_on_sp:
            if existing.object == candidate.object:
                # Same SPO — reinforcement, not contradiction
                continue
            if not candidate.overlaps(existing):
                # Non-overlapping windows — no conflict
                continue

            # Contradiction found
            keep, invalidate = self._resolve(candidate, existing)
            return ContradictionResult(
                conflict=True,
                new_assertion=candidate,
                existing=existing,
                keep=keep,
                invalidate=invalidate,
                reason=(
                    f"Subject={candidate.subject!r} predicate={candidate.predicate!r}: "
                    f"new object={candidate.object!r} conflicts with "
                    f"existing object={existing.object!r}"
                ),
            )

        return ContradictionResult(conflict=False, new_assertion=candidate)

    def _resolve(
        self,
        candidate: TKGAssertion,
        existing: TKGAssertion,
    ) -> Tuple[TKGAssertion, TKGAssertion]:
        if self.strategy == "newer_wins":
            if candidate.valid_from >= existing.valid_from:
                return candidate, existing
            return existing, candidate

        if self.strategy == "higher_confidence":
            if candidate.confidence >= existing.confidence:
                return candidate, existing
            return existing, candidate

        # explicit — default to newer wins
        if candidate.valid_from >= existing.valid_from:
            return candidate, existing
        return existing, candidate
