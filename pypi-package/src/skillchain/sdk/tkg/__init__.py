"""
tkg/
====
Temporal Knowledge Graph — the durable fact store.

Quick start::

    from skillchain.sdk.tkg import TemporalKnowledgeGraph, PromotionBridge
    from skillchain.sdk.communication import (
        Observation, ProvenanceStore, ProvenanceNode
    )

    tkg = TemporalKnowledgeGraph()
    provenance = ProvenanceStore()

    # Record a verified observation
    obs = Observation(claim="agent_x is healthy", source="health_check",
                      confidence=0.95)
    obs.verifiability = "checkable"
    node = ProvenanceNode(
        object_id=obs.id, object_type="Observation",
        asserted_by_agent="monitor", source_message_id="msg-1",
        derivation_kind="observed",
    )
    provenance.record(node)
    provenance.mark_verified(obs.id)

    bridge = PromotionBridge(tkg, provenance)
    result = bridge.promote(obs)
    # result.promoted == True

    # Query
    results = tkg.query(query_text="agent_x healthy", top_k=5)
"""

from .assertion import TKGAssertion, AssertionStatus
from .store import TemporalKnowledgeGraph
from .contradiction import ContradictionDetector, ContradictionResult, ResolutionStrategy
from .decay import ImportanceDecay, compute_importance
from .retrieval import ResonantRetrieval, RetrievalResult, RetrievalWeights
from .bridge import PromotionBridge, BridgeResult

__all__ = [
    "TKGAssertion", "AssertionStatus",
    "TemporalKnowledgeGraph",
    "ContradictionDetector", "ContradictionResult", "ResolutionStrategy",
    "ImportanceDecay", "compute_importance",
    "ResonantRetrieval", "RetrievalResult", "RetrievalWeights",
    "PromotionBridge", "BridgeResult",
]
