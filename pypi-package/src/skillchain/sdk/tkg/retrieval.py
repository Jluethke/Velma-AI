"""
retrieval.py
============
Resonant retrieval — multi-factor scoring for TKG query results.

Score = w_confidence * confidence
      + w_importance * importance          (decay-adjusted)
      + w_recency    * recency_score       (newer = higher)
      + w_relevance  * relevance_score     (text similarity to query)

Callers can tune the weights or use the defaults.
Only active assertions are returned unless include_inactive=True.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .assertion import TKGAssertion


@dataclass
class RetrievalWeights:
    confidence: float = 0.35
    importance: float = 0.30
    recency: float = 0.20
    relevance: float = 0.15


@dataclass
class RetrievalResult:
    assertion: TKGAssertion
    score: float
    score_breakdown: Dict[str, float] = field(default_factory=dict)


def _recency_score(assertion: TKGAssertion, now: datetime) -> float:
    """Exponential recency: halves every 7 days."""
    elapsed = max(0.0, (now - assertion.valid_from).total_seconds()) / 86_400.0
    return math.exp(-elapsed / 7.0)


def _relevance_score(assertion: TKGAssertion, query: str) -> float:
    """
    Simple token overlap relevance.
    Replace with embedding similarity when a vector store is available.
    """
    if not query:
        return 1.0
    q_tokens = set(query.lower().split())
    a_tokens = set(
        (assertion.subject + " " + assertion.predicate + " " + assertion.object).lower().split()
    )
    if not q_tokens:
        return 0.0
    overlap = len(q_tokens & a_tokens) / len(q_tokens)
    return overlap


class ResonantRetrieval:
    """
    Multi-factor retrieval over a list of TKGAssertions.

    Usage::

        retrieval = ResonantRetrieval()
        results = retrieval.query(assertions, subject="agent_x", top_k=10)
    """

    def __init__(self, weights: Optional[RetrievalWeights] = None):
        self.weights = weights or RetrievalWeights()

    def score(self, assertion: TKGAssertion, query: str = "") -> RetrievalResult:
        now = datetime.now(timezone.utc)
        w = self.weights

        c_score = assertion.confidence
        i_score = assertion.importance
        r_score = _recency_score(assertion, now)
        q_score = _relevance_score(assertion, query)

        total = (
            w.confidence * c_score
            + w.importance * i_score
            + w.recency * r_score
            + w.relevance * q_score
        )

        return RetrievalResult(
            assertion=assertion,
            score=total,
            score_breakdown={
                "confidence": w.confidence * c_score,
                "importance": w.importance * i_score,
                "recency": w.recency * r_score,
                "relevance": w.relevance * q_score,
            },
        )

    def query(
        self,
        assertions: List[TKGAssertion],
        subject: Optional[str] = None,
        predicate: Optional[str] = None,
        query_text: str = "",
        top_k: int = 20,
        include_inactive: bool = False,
        min_confidence: float = 0.0,
    ) -> List[RetrievalResult]:
        candidates = assertions

        if not include_inactive:
            candidates = [a for a in candidates if a.is_active()]

        if subject:
            candidates = [a for a in candidates if a.subject == subject]

        if predicate:
            candidates = [a for a in candidates if a.predicate == predicate]

        if min_confidence > 0:
            candidates = [a for a in candidates if a.confidence >= min_confidence]

        scored = [self.score(a, query_text) for a in candidates]
        scored.sort(key=lambda r: r.score, reverse=True)
        return scored[:top_k]
