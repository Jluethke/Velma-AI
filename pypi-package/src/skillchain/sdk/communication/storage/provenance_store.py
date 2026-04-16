"""
provenance_store.py
===================
Claim-level provenance graph.

Every epistemic object should know HOW it came to exist:
observed, inferred, assumed, quoted, or simulated.

Stored as adjacency lists. Used for:
  - challenge generation (show your work)
  - evidence inspection
  - trust aggregation
  - TKG promotion decisions
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional


DerivationKind = Literal[
    "observed",
    "inferred",
    "assumed",
    "quoted",
    "simulated",
    "consensus_validated",
]

VerificationStatus = Literal["unverified", "checked", "consensus_validated"]


@dataclass
class ProvenanceNode:
    object_id: str
    object_type: str
    asserted_by_agent: str
    source_message_id: str
    derivation_kind: DerivationKind
    evidence_refs: List[str] = field(default_factory=list)
    parent_ids: List[str] = field(default_factory=list)
    verification_status: VerificationStatus = "unverified"
    node_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> Dict:
        return self.__dict__.copy()


class ProvenanceStore:
    """
    Adjacency-list provenance graph.

    Can reconstruct the full derivation chain for any object.
    """

    def __init__(self) -> None:
        self._nodes: Dict[str, ProvenanceNode] = {}
        # object_id → list of node_ids that produced it
        self._by_object: Dict[str, List[str]] = {}

    def record(self, node: ProvenanceNode) -> None:
        self._nodes[node.node_id] = node
        self._by_object.setdefault(node.object_id, []).append(node.node_id)

    def get_for_object(self, object_id: str) -> List[ProvenanceNode]:
        return [self._nodes[nid] for nid in self._by_object.get(object_id, []) if nid in self._nodes]

    def derivation_chain(self, object_id: str, depth: int = 5) -> List[ProvenanceNode]:
        """BFS up the parent chain."""
        result: List[ProvenanceNode] = []
        queue = [object_id]
        seen: set = set()
        for _ in range(depth):
            next_queue = []
            for oid in queue:
                if oid in seen:
                    continue
                seen.add(oid)
                nodes = self.get_for_object(oid)
                result.extend(nodes)
                for n in nodes:
                    next_queue.extend(n.parent_ids)
            queue = next_queue
            if not queue:
                break
        return result

    def mark_verified(self, object_id: str) -> None:
        for node in self.get_for_object(object_id):
            node.verification_status = "checked"

    def mark_consensus_validated(self, object_id: str) -> None:
        for node in self.get_for_object(object_id):
            node.verification_status = "consensus_validated"

    def is_tkg_eligible(self, object_id: str) -> bool:
        """
        An object is TKG-eligible if:
        1. It is Observation or Inference (caller checks type)
        2. At least one provenance node is verified or consensus_validated
        """
        nodes = self.get_for_object(object_id)
        return any(n.verification_status in ("checked", "consensus_validated") for n in nodes)
