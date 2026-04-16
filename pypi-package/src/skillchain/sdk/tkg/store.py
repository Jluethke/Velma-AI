"""
store.py
========
TemporalKnowledgeGraph — the main store.

Indexes:
  _by_id      — assertion_id → TKGAssertion
  _by_subject — subject → [assertion_id, ...]
  _by_sp      — "subject\x00predicate" → [assertion_id, ...]
  _by_spo     — "subject\x00predicate\x00object" → [assertion_id, ...]

All writes go through write(), which:
  1. Runs contradiction detection
  2. Invalidates conflicting assertions
  3. Appends the new assertion
  4. Updates importance via decay engine

Facts are NEVER deleted — status transitions to invalidated/expired.
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .assertion import TKGAssertion, AssertionStatus
from .contradiction import ContradictionDetector, ResolutionStrategy
from .decay import ImportanceDecay
from .retrieval import ResonantRetrieval, RetrievalResult, RetrievalWeights

logger = logging.getLogger(__name__)


class TemporalKnowledgeGraph:
    """
    In-memory TKG with optional JSON disk persistence.

    Thread-safety: not thread-safe. Wrap in a lock for concurrent use.
    """

    def __init__(
        self,
        persist_path: Optional[Path] = None,
        resolution_strategy: ResolutionStrategy = "higher_confidence",
        half_life_days: float = 30.0,
        retrieval_weights: Optional[RetrievalWeights] = None,
    ):
        self._by_id: Dict[str, TKGAssertion] = {}
        self._by_subject: Dict[str, List[str]] = defaultdict(list)
        self._by_sp: Dict[str, List[str]] = defaultdict(list)
        self._by_spo: Dict[str, List[str]] = defaultdict(list)

        self._detector = ContradictionDetector(resolution_strategy)
        self._decay = ImportanceDecay(half_life_days)
        self._retrieval = ResonantRetrieval(retrieval_weights)
        self._persist_path = persist_path

        if persist_path and persist_path.exists():
            self.load()

    # ── Write ─────────────────────────────────────────────────────────────────

    def write(self, assertion: TKGAssertion) -> Dict[str, Any]:
        """
        Insert an assertion.

        Returns:
          {"written": id, "contradictions_resolved": [...invalidated ids]}
        """
        active_on_sp = [
            self._by_id[aid]
            for aid in self._by_sp.get(assertion.sp_key(), [])
            if self._by_id[aid].is_active()
        ]

        result = self._detector.check(assertion, active_on_sp)
        invalidated_ids: List[str] = []

        if result.conflict and result.invalidate:
            to_invalidate = result.invalidate
            to_invalidate.status = "invalidated_by_contradiction"
            to_invalidate.invalidated_by = assertion.id
            to_invalidate.invalidation_reason = result.reason
            invalidated_ids.append(to_invalidate.id)
            logger.debug("Contradiction resolved: invalidated %s", to_invalidate.id)

            # If detector chose to keep the existing, don't write the new one
            if result.keep and result.keep.id != assertion.id:
                logger.debug("Existing assertion retained: %s", result.keep.id)
                return {"written": None, "contradictions_resolved": invalidated_ids}

        # Compute initial importance
        assertion.importance = assertion.confidence
        self._decay.run([assertion])

        # Index
        self._by_id[assertion.id] = assertion
        self._by_subject[assertion.subject].append(assertion.id)
        self._by_sp[assertion.sp_key()].append(assertion.id)
        self._by_spo[assertion.spo_key()].append(assertion.id)

        logger.debug("TKG write: %s", assertion.id)
        return {"written": assertion.id, "contradictions_resolved": invalidated_ids}

    def retract(self, assertion_id: str, reason: str = "") -> bool:
        """Explicitly invalidate an assertion."""
        a = self._by_id.get(assertion_id)
        if a is None:
            return False
        a.status = "invalidated_by_retraction"
        a.invalidation_reason = reason
        return True

    # ── Read ─────────────────────────────────────────────────────────────────

    def get(self, assertion_id: str) -> Optional[TKGAssertion]:
        return self._by_id.get(assertion_id)

    def get_by_subject(
        self,
        subject: str,
        active_only: bool = True,
    ) -> List[TKGAssertion]:
        ids = self._by_subject.get(subject, [])
        result = [self._by_id[i] for i in ids if i in self._by_id]
        if active_only:
            result = [a for a in result if a.is_active()]
        return result

    def get_by_sp(
        self,
        subject: str,
        predicate: str,
        active_only: bool = True,
    ) -> List[TKGAssertion]:
        key = f"{subject}\x00{predicate}"
        ids = self._by_sp.get(key, [])
        result = [self._by_id[i] for i in ids if i in self._by_id]
        if active_only:
            result = [a for a in result if a.is_active()]
        return result

    def all_assertions(self, active_only: bool = False) -> List[TKGAssertion]:
        result = list(self._by_id.values())
        if active_only:
            result = [a for a in result if a.is_active()]
        return result

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def query(
        self,
        subject: Optional[str] = None,
        predicate: Optional[str] = None,
        query_text: str = "",
        top_k: int = 20,
        min_confidence: float = 0.0,
    ) -> List[RetrievalResult]:
        """Resonant retrieval over active assertions."""
        return self._retrieval.query(
            self.all_assertions(active_only=True),
            subject=subject,
            predicate=predicate,
            query_text=query_text,
            top_k=top_k,
            min_confidence=min_confidence,
        )

    # ── Maintenance ───────────────────────────────────────────────────────────

    def run_decay(self) -> int:
        """Update importance scores. Returns count of updated assertions."""
        return self._decay.run(list(self._by_id.values()))

    def expire_stale(self, importance_threshold: float = 0.05) -> int:
        """
        Mark assertions as expired if their importance has decayed below threshold.
        Does NOT delete them — they remain in history.
        """
        stale = self._decay.below_threshold(
            [a for a in self._by_id.values() if a.status == "active"],
            importance_threshold,
        )
        for a in stale:
            a.status = "expired"
        return len(stale)

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self) -> None:
        if not self._persist_path:
            return
        self._persist_path.parent.mkdir(parents=True, exist_ok=True)
        data = [a.to_dict() for a in self._by_id.values()]
        self._persist_path.write_text(json.dumps(data, indent=2, default=str))
        logger.info("TKG saved: %d assertions → %s", len(data), self._persist_path)

    def load(self) -> None:
        if not self._persist_path or not self._persist_path.exists():
            return
        data = json.loads(self._persist_path.read_text())
        for raw in data:
            a = TKGAssertion.from_dict(raw)
            self._by_id[a.id] = a
            self._by_subject[a.subject].append(a.id)
            self._by_sp[a.sp_key()].append(a.id)
            self._by_spo[a.spo_key()].append(a.id)
        logger.info("TKG loaded: %d assertions from %s", len(data), self._persist_path)

    # ── Stats ─────────────────────────────────────────────────────────────────

    def stats(self) -> Dict[str, int]:
        all_a = list(self._by_id.values())
        return {
            "total": len(all_a),
            "active": sum(1 for a in all_a if a.status == "active"),
            "invalidated": sum(1 for a in all_a if "invalidated" in a.status),
            "expired": sum(1 for a in all_a if a.status == "expired"),
            "subjects": len(self._by_subject),
        }
