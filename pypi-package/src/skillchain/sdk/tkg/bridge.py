"""
bridge.py
=========
PromotionBridge — the seam between the communication layer and the TKG.

Flow:
  communication/runtime/promotion.py  →  maybe_promote_to_tkg()
      ↓ returns Dict or None
  PromotionBridge.promote(obj, provenance_store)
      ↓ builds TKGAssertion
  TemporalKnowledgeGraph.write(assertion)
      ↓ contradiction check + index + decay
  returns WriteResult

The bridge is the only place that crosses the boundary between
"agent said something" and "the graph knows it as fact."

Rules enforced here:
  1. Only Observation and Inference are TKG-eligible (type guard)
  2. Confidence must meet the threshold (default 0.8)
  3. At least one provenance node must be verified
  4. A TKGAssertion is constructed with full lineage before write
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .assertion import TKGAssertion
from .store import TemporalKnowledgeGraph
from ..communication.models.epistemic import EpistemicObject, TKG_ELIGIBLE
from ..communication.storage.provenance_store import ProvenanceStore
from ..communication.runtime.promotion import maybe_promote_to_tkg, DEFAULT_CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)


@dataclass
class BridgeResult:
    promoted: bool
    assertion_id: Optional[str] = None
    contradictions_resolved: List[str] = None  # type: ignore[assignment]
    rejection_reason: str = ""

    def __post_init__(self):
        if self.contradictions_resolved is None:
            self.contradictions_resolved = []


class PromotionBridge:
    """
    Connects the communication layer's epistemic objects to the TKG.

    Usage::

        bridge = PromotionBridge(tkg, provenance_store)
        result = bridge.promote(observation_obj)
        if result.promoted:
            print(f"Written as assertion {result.assertion_id}")
    """

    def __init__(
        self,
        tkg: TemporalKnowledgeGraph,
        provenance: ProvenanceStore,
        confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
    ):
        self.tkg = tkg
        self.provenance = provenance
        self.confidence_threshold = confidence_threshold

    def promote(
        self,
        obj: EpistemicObject,
        valid_from: Optional[datetime] = None,
        valid_to: Optional[datetime] = None,
    ) -> BridgeResult:
        """
        Attempt to promote an epistemic object into the TKG.

        Returns BridgeResult indicating success or the rejection reason.
        """
        # Gate 1: type eligibility
        obj_type = getattr(obj, "object_type", type(obj).__name__)
        if obj_type not in TKG_ELIGIBLE:
            return BridgeResult(
                promoted=False,
                rejection_reason=f"Type {obj_type!r} is not TKG-eligible",
            )

        # Gate 2: confidence
        if obj.confidence < self.confidence_threshold:
            return BridgeResult(
                promoted=False,
                rejection_reason=(
                    f"Confidence {obj.confidence:.2f} below threshold "
                    f"{self.confidence_threshold:.2f}"
                ),
            )

        # Gate 3: provenance verified
        if not self.provenance.is_tkg_eligible(obj.id):
            return BridgeResult(
                promoted=False,
                rejection_reason="No verified provenance node for this object",
            )

        # Build promotion dict
        promo = maybe_promote_to_tkg(obj, self.provenance, self.confidence_threshold)
        if promo is None:
            return BridgeResult(promoted=False, rejection_reason="Promotion check returned None")

        # Determine derivation kind from provenance
        prov_nodes = self.provenance.get_for_object(obj.id)
        derivation_kind = prov_nodes[0].derivation_kind if prov_nodes else "observed"
        source_agent = prov_nodes[0].asserted_by_agent if prov_nodes else ""
        source_msg_id = prov_nodes[0].source_message_id if prov_nodes else ""

        # Build assertion
        claim = getattr(obj, "claim", str(obj.id))
        assertion = TKGAssertion(
            subject=obj.id,
            predicate="asserts",
            object=claim,
            confidence=obj.confidence,
            confidence_basis=obj.confidence_basis,
            verifiability=obj.verifiability,
            valid_from=valid_from or datetime.now(timezone.utc),
            valid_to=valid_to,
            source_object_id=obj.id,
            source_agent=source_agent,
            derivation_kind=derivation_kind,
            metadata={
                "object_type": obj_type,
                "source_message_id": source_msg_id,
                "revision_trigger": obj.revision_trigger,
            },
        )

        write_result = self.tkg.write(assertion)

        if write_result["written"] is None:
            return BridgeResult(
                promoted=False,
                contradictions_resolved=write_result["contradictions_resolved"],
                rejection_reason="Existing assertion retained (higher confidence)",
            )

        logger.info(
            "Promoted %s(%s) → TKG assertion %s",
            obj_type, obj.id[:8], assertion.id[:8],
        )
        return BridgeResult(
            promoted=True,
            assertion_id=write_result["written"],
            contradictions_resolved=write_result["contradictions_resolved"],
        )

    def promote_batch(
        self,
        objects: List[EpistemicObject],
    ) -> Dict[str, Any]:
        """Promote a list of objects. Returns summary."""
        promoted = []
        rejected = []
        for obj in objects:
            result = self.promote(obj)
            if result.promoted:
                promoted.append({"id": obj.id, "assertion_id": result.assertion_id})
            else:
                rejected.append({"id": obj.id, "reason": result.rejection_reason})
        return {"promoted": promoted, "rejected": rejected}
