"""
assertion.py
============
TKGAssertion — the atomic unit of the Temporal Knowledge Graph.

Every assertion is a (subject, predicate, object) triple with:
  - a temporal validity window  [valid_from, valid_to)
  - a confidence score
  - a provenance reference
  - an invalidation mechanism (contradiction, expiry, explicit retraction)

Design principle:
  Facts are NEVER deleted — they are invalidated.
  The invalidation chain is the history.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Any


AssertionStatus = Literal[
    "active",
    "invalidated_by_contradiction",
    "invalidated_by_retraction",
    "expired",
]


@dataclass
class TKGAssertion:
    """
    A temporally-scoped, provenance-linked knowledge assertion.

    subject   — the entity being described (agent_id, object_id, concept)
    predicate — the relationship  (e.g. "asserts", "has_state", "depends_on")
    object    — the value or target

    valid_from — when this assertion became true (defaults to now)
    valid_to   — when it stops being true (None = open-ended)
    """

    subject: str
    predicate: str
    object: str

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    confidence: float = 1.0
    confidence_basis: str = ""
    verifiability: str = "asserted"

    # Temporal window
    valid_from: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    valid_to: Optional[datetime] = None

    # Provenance
    source_object_id: str = ""         # epistemic object that produced this
    source_agent: str = ""
    derivation_kind: str = "observed"  # observed / inferred / consensus_validated

    # Lifecycle
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: AssertionStatus = "active"
    invalidated_by: Optional[str] = None    # assertion_id that supersedes this
    invalidation_reason: str = ""

    # Computed importance (updated by decay engine)
    importance: float = 1.0

    # Extension
    metadata: Dict[str, Any] = field(default_factory=dict)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def is_active(self) -> bool:
        if self.status != "active":
            return False
        now = datetime.now(timezone.utc)
        if self.valid_from > now:
            return False
        if self.valid_to is not None and self.valid_to <= now:
            return False
        return True

    def overlaps(self, other: TKGAssertion) -> bool:
        """True if this and other have overlapping validity windows."""
        a_end = self.valid_to or datetime.max.replace(tzinfo=timezone.utc)
        b_end = other.valid_to or datetime.max.replace(tzinfo=timezone.utc)
        return self.valid_from < b_end and other.valid_from < a_end

    def spo_key(self) -> str:
        return f"{self.subject}\x00{self.predicate}\x00{self.object}"

    def sp_key(self) -> str:
        return f"{self.subject}\x00{self.predicate}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "subject": self.subject,
            "predicate": self.predicate,
            "object": self.object,
            "confidence": self.confidence,
            "confidence_basis": self.confidence_basis,
            "verifiability": self.verifiability,
            "valid_from": self.valid_from.isoformat(),
            "valid_to": self.valid_to.isoformat() if self.valid_to else None,
            "source_object_id": self.source_object_id,
            "source_agent": self.source_agent,
            "derivation_kind": self.derivation_kind,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "invalidated_by": self.invalidated_by,
            "invalidation_reason": self.invalidation_reason,
            "importance": self.importance,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> TKGAssertion:
        d = dict(d)
        for ts in ("valid_from", "valid_to", "created_at"):
            if isinstance(d.get(ts), str):
                d[ts] = datetime.fromisoformat(d[ts])
        allowed = {f for f in cls.__dataclass_fields__}
        return cls(**{k: v for k, v in d.items() if k in allowed})
