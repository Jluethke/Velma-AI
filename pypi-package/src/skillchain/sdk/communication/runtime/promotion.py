"""
promotion.py
============
Rules for promoting epistemic objects into the TKG (Temporal Knowledge Graph).

Only Observations and Inferences with sufficient confidence may be promoted.
Everything else stays in its dedicated store.

Rule table:
  Observation      → eligible if confidence ≥ threshold AND provenance verified
  Inference        → eligible with provenance + derivation chain
  Hypothesis       → never
  Assumption       → never
  Plan             → never
  Constraint       → policy store only
  Commitment       → commitment store only
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..models.epistemic import EpistemicObject, TKG_ELIGIBLE
from ..storage.provenance_store import ProvenanceStore

DEFAULT_CONFIDENCE_THRESHOLD = 0.80


def maybe_promote_to_tkg(
    obj: EpistemicObject,
    provenance: ProvenanceStore,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> Optional[Dict[str, Any]]:
    """
    Return a TKG-ready assertion dict if the object qualifies, else None.

    The caller is responsible for actually writing to the TKG.
    """
    obj_type = getattr(obj, "object_type", type(obj).__name__)

    if obj_type not in TKG_ELIGIBLE:
        return None

    if obj.confidence < confidence_threshold:
        return None

    # Provenance check: at least one node must be verified
    if not provenance.is_tkg_eligible(obj.id):
        return None

    claim = getattr(obj, "claim", str(obj.id))
    return {
        "subject": obj.id,
        "predicate": "asserts",
        "object": claim,
        "confidence": obj.confidence,
        "object_type": obj_type,
        "verifiability": obj.verifiability,
        "confidence_basis": obj.confidence_basis,
    }


def promotion_summary(
    objects: list,
    provenance: ProvenanceStore,
    threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> Dict[str, Any]:
    """Batch promotion check. Returns promoted + rejected lists."""
    promoted = []
    rejected = []
    for obj in objects:
        result = maybe_promote_to_tkg(obj, provenance, threshold)
        if result:
            promoted.append(result)
        else:
            rejected.append({
                "id": obj.id,
                "type": getattr(obj, "object_type", "unknown"),
                "confidence": obj.confidence,
                "reason": _rejection_reason(obj, provenance, threshold),
            })
    return {"promoted": promoted, "rejected": rejected}


def _rejection_reason(
    obj: EpistemicObject,
    provenance: ProvenanceStore,
    threshold: float,
) -> str:
    obj_type = getattr(obj, "object_type", type(obj).__name__)
    if obj_type not in TKG_ELIGIBLE:
        return f"type={obj_type!r} is not TKG-eligible"
    if obj.confidence < threshold:
        return f"confidence={obj.confidence:.2f} below threshold={threshold:.2f}"
    return "provenance not verified"
