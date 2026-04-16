"""
epistemic.py
============
Typed epistemic objects.

These are what agents *mean* — not just what they say.

Rule:
  Observation  → may be promoted to TKG (confidence ≥ 0.8)
  Inference    → may be promoted to TKG with provenance
  Hypothesis   → never promoted automatically
  Assumption   → never promoted — lives in AssumptionStore only
  Constraint   → lives in policy store
  Plan         → never promoted — lives in dialogue/commitment stores
  Commitment   → lives in CommitmentStore
  Risk         → metadata only
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional


# ── Base ──────────────────────────────────────────────────────────────────────

@dataclass
class EpistemicObject:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    confidence: float = 1.0
    confidence_basis: str = ""
    verifiability: Literal[
        "asserted", "checkable", "simulation_required",
        "consensus_required", "unverifiable"
    ] = "asserted"
    revision_trigger: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items()}


# ── Leaf types ────────────────────────────────────────────────────────────────

@dataclass
class Observation(EpistemicObject):
    """A directly perceived fact about the world."""
    claim: str = ""
    source: str = ""
    observed_at: str = ""
    evidence_refs: List[str] = field(default_factory=list)
    object_type: str = "Observation"


@dataclass
class Inference(EpistemicObject):
    """A claim derived from other objects."""
    claim: str = ""
    derived_from: List[str] = field(default_factory=list)
    method: str = ""            # e.g. "deductive", "abductive", "pattern_match"
    object_type: str = "Inference"


@dataclass
class Hypothesis(EpistemicObject):
    """An unverified conjecture — must not be auto-promoted to TKG."""
    claim: str = ""
    proposed_by: str = ""
    status: Literal["open", "testing", "supported", "refuted", "withdrawn"] = "open"
    object_type: str = "Hypothesis"


@dataclass
class Assumption(EpistemicObject):
    """
    A provisional belief held for planning purposes.
    Lives exclusively in AssumptionStore — never becomes a fact.
    """
    claim: str = ""
    scope: str = ""             # which plan/thread this assumption is scoped to
    asserted_by: str = ""
    expires_at: Optional[str] = None
    status: Literal["unverified", "active", "withdrawn"] = "unverified"
    object_type: str = "Assumption"


@dataclass
class Constraint(EpistemicObject):
    """
    A rule that execution MUST respect.
    Stored in policy store, not fact store.
    """
    rule: str = ""
    source: str = ""
    severity: Literal["soft", "hard"] = "hard"
    object_type: str = "Constraint"


@dataclass
class Goal(EpistemicObject):
    """A desired end-state for an agent or plan."""
    description: str = ""
    owner_id: str = ""
    success_criteria: List[str] = field(default_factory=list)
    deadline: Optional[str] = None
    status: Literal["active", "paused", "achieved", "abandoned"] = "active"
    object_type: str = "Goal"


@dataclass
class Plan(EpistemicObject):
    """
    A structured sequence of steps toward a goal.
    Never promoted to TKG — lives in dialogue/commitment stores.
    """
    goal_ref: str = ""
    steps: List[Dict[str, Any]] = field(default_factory=list)
    assumptions: List[str] = field(default_factory=list)  # Assumption IDs
    constraints: List[str] = field(default_factory=list)  # Constraint IDs
    risks: List[str] = field(default_factory=list)        # Risk IDs
    version: int = 1
    object_type: str = "Plan"


@dataclass
class Risk(EpistemicObject):
    """An identified hazard — stored as metadata, not fact."""
    claim: str = ""
    likelihood: float = 0.5         # 0–1
    impact: Literal["low", "medium", "high", "critical"] = "medium"
    mitigation: str = ""
    object_type: str = "Risk"


@dataclass
class Commitment(EpistemicObject):
    """
    A promise made by an agent — tracked in CommitmentStore.
    Can be used to drive accountability and auditing.
    """
    agent_id: str = ""
    action: str = ""
    preconditions: List[str] = field(default_factory=list)
    deadline: Optional[str] = None
    thread_id: str = ""
    plan_ref: Optional[str] = None
    status: Literal["pending", "active", "done", "failed", "cancelled"] = "pending"
    object_type: str = "Commitment"


@dataclass
class Policy(EpistemicObject):
    """A standing rule governing agent behavior."""
    rule: str = ""
    scope: str = "global"
    priority: int = 0
    object_type: str = "Policy"


@dataclass
class Counterevidence(EpistemicObject):
    """Evidence that challenges an existing claim."""
    challenges_id: str = ""      # ID of the object being challenged
    claim: str = ""
    source: str = ""
    evidence_refs: List[str] = field(default_factory=list)
    object_type: str = "Counterevidence"


# ── Registry ──────────────────────────────────────────────────────────────────

EPISTEMIC_TYPES = {
    "Observation": Observation,
    "Inference": Inference,
    "Hypothesis": Hypothesis,
    "Assumption": Assumption,
    "Constraint": Constraint,
    "Goal": Goal,
    "Plan": Plan,
    "Risk": Risk,
    "Commitment": Commitment,
    "Policy": Policy,
    "Counterevidence": Counterevidence,
}

# Only these types may be promoted to TKG
TKG_ELIGIBLE = {"Observation", "Inference"}


def from_dict(d: Dict[str, Any]) -> EpistemicObject:
    obj_type = d.get("object_type", "")
    cls = EPISTEMIC_TYPES.get(obj_type)
    if cls is None:
        raise ValueError(f"Unknown epistemic type: {obj_type!r}")
    fields = {k for k in cls.__dataclass_fields__}
    return cls(**{k: v for k, v in d.items() if k in fields})
