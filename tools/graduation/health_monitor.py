"""
health_monitor.py — Monitor skill health, quarantine bad skills.

Ported from Velma's SkillHealthMonitor in neurofs/management/skill_health.py.
Each skill gets a composite health score from recency, success rate, and
overlap. Skills below the quarantine threshold are sidelined.
"""

from __future__ import annotations

import math
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from .config import (
    HEALTH_OVERLAP_WEIGHT,
    HEALTH_RECENCY_WEIGHT,
    HEALTH_SUCCESS_WEIGHT,
    QUARANTINE_HEALTH_THRESHOLD,
)


@dataclass
class _CallRecord:
    """A single execution record for health tracking."""

    timestamp: float  # Unix epoch
    success: bool


class SkillHealthMonitor:
    """Monitor and maintain graduated skill health.

    Scores every skill on a composite 0-1 health scale and automatically
    quarantines skills that fall below ``QUARANTINE_HEALTH_THRESHOLD``.
    """

    def __init__(self) -> None:
        self._quarantined: set[str] = set()
        # skill_id -> list of call records
        self._call_log: dict[str, list[_CallRecord]] = defaultdict(list)
        # skill_id -> set of tags/keywords for overlap detection
        self._skill_tags: dict[str, set[str]] = {}

    # -- Recording -----------------------------------------------------------

    def record_call(
        self,
        skill_id: str,
        success: bool,
        timestamp: float | None = None,
    ) -> None:
        """Record a skill execution for health tracking.

        Parameters
        ----------
        skill_id:
            The skill that was executed.
        success:
            Whether the execution succeeded.
        timestamp:
            Unix epoch. Defaults to now.
        """
        ts = timestamp if timestamp is not None else time.time()
        self._call_log[skill_id].append(_CallRecord(timestamp=ts, success=success))
        # Keep last 100 records per skill
        if len(self._call_log[skill_id]) > 100:
            self._call_log[skill_id] = self._call_log[skill_id][-100:]

    def register_tags(self, skill_id: str, tags: set[str] | list[str]) -> None:
        """Register tags/keywords for a skill (used for overlap scoring)."""
        self._skill_tags[skill_id] = set(tags)

    # -- Health Computation --------------------------------------------------

    def compute_health(
        self,
        skill_id: str,
        now: float | None = None,
    ) -> float:
        """Compute the composite health score for a skill.

        Health = RECENCY_W * recency + SUCCESS_W * success_rate + OVERLAP_W * (1 - overlap)

        Parameters
        ----------
        skill_id:
            The skill to assess.
        now:
            Current time as Unix epoch. Defaults to ``time.time()``.

        Returns
        -------
        float
            Health score in [0.0, 1.0].
        """
        current = now if now is not None else time.time()

        recency = self._compute_recency(skill_id, current)
        success = self._compute_success_rate_30d(skill_id, current)
        overlap = self._compute_overlap(skill_id)

        health = (
            HEALTH_RECENCY_WEIGHT * recency
            + HEALTH_SUCCESS_WEIGHT * success
            + HEALTH_OVERLAP_WEIGHT * (1.0 - overlap)
        )

        return round(max(0.0, min(1.0, health)), 3)

    # -- Quarantine ----------------------------------------------------------

    def quarantine(self, skill_id: str) -> None:
        """Mark a skill as quarantined (health < threshold)."""
        self._quarantined.add(skill_id)

    def get_quarantined(self) -> list[str]:
        """Return list of quarantined skill IDs."""
        return sorted(self._quarantined)

    def rehabilitate(self, skill_id: str) -> bool:
        """Remove a skill from quarantine after review.

        Returns ``True`` if the skill was quarantined and is now rehabilitated.
        """
        if skill_id in self._quarantined:
            self._quarantined.discard(skill_id)
            return True
        return False

    def is_quarantined(self, skill_id: str) -> bool:
        """Check whether a skill is quarantined."""
        return skill_id in self._quarantined

    def auto_quarantine(self, skill_id: str, now: float | None = None) -> bool:
        """Compute health and quarantine if below threshold.

        Returns ``True`` if the skill was quarantined by this call.
        """
        health = self.compute_health(skill_id, now=now)
        if health < QUARANTINE_HEALTH_THRESHOLD:
            self.quarantine(skill_id)
            return True
        return False

    # -- Internal scoring ----------------------------------------------------

    def _compute_recency(self, skill_id: str, now: float) -> float:
        """Score 0-1 based on how recently the skill was used.

        Uses exponential decay: score = exp(-days_since_last_use / 30).
        """
        calls = self._call_log.get(skill_id, [])
        if not calls:
            return 0.3  # Unknown — give some benefit of the doubt

        last_ts = calls[-1].timestamp
        days_ago = (now - last_ts) / 86400.0
        if days_ago < 0:
            days_ago = 0

        return math.exp(-days_ago / 30.0)

    def _compute_success_rate_30d(self, skill_id: str, now: float) -> float:
        """Success rate over the trailing 30 days."""
        calls = self._call_log.get(skill_id, [])
        if not calls:
            return 0.5  # Unknown — neutral

        cutoff = now - 30 * 86400
        recent = [c for c in calls if c.timestamp >= cutoff]
        if not recent:
            return 0.5  # No recent data — neutral

        successes = sum(1 for c in recent if c.success)
        return successes / len(recent)

    def _compute_overlap(self, skill_id: str) -> float:
        """Overlap score: how similar this skill's tags are to others.

        Uses Jaccard similarity averaged across all other skills.
        Higher overlap = less unique = lower health contribution.
        Returns 0.0 (unique) to 1.0 (duplicate).
        """
        my_tags = self._skill_tags.get(skill_id)
        if not my_tags:
            return 0.0  # No tags — assume unique

        other_ids = [sid for sid in self._skill_tags if sid != skill_id]
        if not other_ids:
            return 0.0

        max_jaccard = 0.0
        for other_id in other_ids:
            other_tags = self._skill_tags[other_id]
            if not other_tags:
                continue
            intersection = len(my_tags & other_tags)
            union = len(my_tags | other_tags)
            if union > 0:
                jaccard = intersection / union
                max_jaccard = max(max_jaccard, jaccard)

        return max_jaccard
