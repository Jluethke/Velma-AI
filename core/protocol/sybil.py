# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
sybil.py — Sybil detection heuristics for SkillChain.

Detects coordinated Sybil attacks through:
- Attestation diversity analysis (same pair diminishing returns)
- Temporal clustering of attestations
- Collusion ring detection via graph analysis
- Age-based decay of attestation weight

Heuristics:
- Same pair attestations: 1st=100%, 2nd=50%, 3rd+=10%
- Age decay: >10 epochs = 50% weight, >50 epochs = 10%
- Temporal spread: attestations within MIN_TEMPORAL_SPREAD_S are suspicious
- Collusion rings: clusters of nodes that only attest each other

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

from . import config

logger = logging.getLogger("skillchain.protocol.sybil")


@dataclass
class AttestationRecord:
    """Record of an attestation for Sybil analysis."""
    attester_id: str
    subject_id: str
    epoch: int
    timestamp: float
    skill_hash: str = ""
    outcome: str = "pass"


@dataclass
class SybilAlert:
    """Alert raised by Sybil detection heuristics."""
    alert_type: str          # "diminishing_returns", "temporal_cluster", "collusion_ring", "age_decay"
    severity: float          # 0.0 (info) to 1.0 (critical)
    involved_nodes: list[str] = field(default_factory=list)
    description: str = ""
    timestamp: float = field(default_factory=time.time)


class SybilDetector:
    """
    Sybil detection engine for SkillChain.

    Analyzes attestation patterns to detect coordinated Sybil attacks
    where multiple fake identities boost each other's trust scores.

    Usage:
        detector = SybilDetector()

        # Record attestations
        detector.record_attestation(AttestationRecord(
            attester_id="node_a", subject_id="node_b",
            epoch=5, timestamp=time.time(),
        ))

        # Check for Sybil behavior
        weight = detector.effective_weight("node_a", "node_b", epoch=5)
        alerts = detector.check_node("node_a", current_epoch=10)
        rings = detector.detect_collusion_rings()
    """

    def __init__(self) -> None:
        # All attestations indexed by (attester, subject)
        self._pair_attestations: dict[tuple[str, str], list[AttestationRecord]] = defaultdict(list)
        # All attestations indexed by attester
        self._by_attester: dict[str, list[AttestationRecord]] = defaultdict(list)
        # All attestations indexed by subject
        self._by_subject: dict[str, list[AttestationRecord]] = defaultdict(list)
        # Node join epochs for age computation
        self._node_epochs: dict[str, int] = {}
        # Raised alerts
        self._alerts: list[SybilAlert] = []

    def register_node(self, node_id: str, join_epoch: int) -> None:
        """Register a node's join epoch for age-based analysis.

        Parameters
        ----------
        node_id : str
            The node's ID.
        join_epoch : int
            The epoch when the node joined the network.
        """
        self._node_epochs[node_id] = join_epoch

    def record_attestation(self, record: AttestationRecord) -> None:
        """Record an attestation for Sybil analysis.

        Parameters
        ----------
        record : AttestationRecord
            The attestation to record.
        """
        pair = (record.attester_id, record.subject_id)
        self._pair_attestations[pair].append(record)
        self._by_attester[record.attester_id].append(record)
        self._by_subject[record.subject_id].append(record)

    # ── Diminishing Returns ──

    def _pair_diminishing_factor(self, attester: str, subject: str) -> float:
        """Compute the diminishing returns factor for a pair.

        First attestation: 100% weight.
        Second attestation: 50% weight.
        Third and beyond: 10% weight.

        Parameters
        ----------
        attester : str
            Attester node ID.
        subject : str
            Subject node ID.

        Returns
        -------
        float
            Weight multiplier in [0.1, 1.0].
        """
        count = len(self._pair_attestations.get((attester, subject), []))
        if count <= 1:
            return 1.0
        elif count == 2:
            return 0.5
        else:
            return 0.1

    # ── Age Decay ──

    def _age_decay_factor(self, node_id: str, current_epoch: int) -> float:
        """Compute age-based decay factor for a node's attestation weight.

        Nodes that have been around for a long time without building
        organic trust see diminishing attestation weight.

        Parameters
        ----------
        node_id : str
            The node to check.
        current_epoch : int
            The current epoch.

        Returns
        -------
        float
            Weight multiplier: 1.0 (fresh), 0.5 (>10 epochs), 0.1 (>50 epochs).
        """
        join_epoch = self._node_epochs.get(node_id, current_epoch)
        age = current_epoch - join_epoch
        if age > 50:
            return 0.1
        elif age > 10:
            return 0.5
        return 1.0

    # ── Temporal Clustering ──

    def _temporal_cluster_score(self, attester: str) -> float:
        """Detect temporal clustering in a node's attestations.

        If many attestations happen within MIN_TEMPORAL_SPREAD_S,
        it suggests automated/coordinated behavior.

        Parameters
        ----------
        attester : str
            The attester node ID.

        Returns
        -------
        float
            Clustering score in [0, 1]. Higher = more suspicious.
        """
        attestations = self._by_attester.get(attester, [])
        if len(attestations) < 3:
            return 0.0

        timestamps = sorted(a.timestamp for a in attestations)
        min_spread = config.MIN_TEMPORAL_SPREAD_S

        # Count pairs within min_spread
        close_pairs = 0
        total_pairs = 0
        for i in range(len(timestamps)):
            for j in range(i + 1, min(i + 10, len(timestamps))):
                total_pairs += 1
                if timestamps[j] - timestamps[i] < min_spread:
                    close_pairs += 1

        if total_pairs == 0:
            return 0.0

        return close_pairs / total_pairs

    # ── Effective Weight ──

    def effective_weight(
        self,
        attester: str,
        subject: str,
        current_epoch: int,
    ) -> float:
        """Compute the effective weight of an attestation after Sybil adjustments.

        Combines diminishing returns, age decay, and temporal clustering
        penalties into a single multiplier.

        Parameters
        ----------
        attester : str
            The attester node ID.
        subject : str
            The subject node ID.
        current_epoch : int
            The current epoch.

        Returns
        -------
        float
            Effective weight multiplier in [0, 1].
        """
        dim = self._pair_diminishing_factor(attester, subject)
        age = self._age_decay_factor(attester, current_epoch)
        temporal = 1.0 - (0.5 * self._temporal_cluster_score(attester))

        return dim * age * temporal

    # ── Collusion Ring Detection ──

    def detect_collusion_rings(
        self, min_ring_size: int = 3,
    ) -> list[set[str]]:
        """Detect collusion rings in the attestation graph.

        A collusion ring is a cluster of nodes that predominantly
        attest each other. Uses a simple approach: find sets of nodes
        where each member has attested at least one other member,
        and the intra-cluster attestation ratio exceeds 50%.

        Parameters
        ----------
        min_ring_size : int
            Minimum number of nodes to form a ring.

        Returns
        -------
        list[set[str]]
            Detected collusion rings (sets of node IDs).
        """
        # Build adjacency: attester -> set of subjects
        adjacency: dict[str, set[str]] = defaultdict(set)
        for (attester, subject) in self._pair_attestations:
            adjacency[attester].add(subject)

        all_nodes = set(adjacency.keys())
        for subjects in adjacency.values():
            all_nodes.update(subjects)

        if len(all_nodes) < min_ring_size:
            return []

        # Find strongly connected components using iterative Tarjan-like approach
        # Simplified: look for mutual attestation clusters
        rings: list[set[str]] = []
        visited: set[str] = set()

        for node in all_nodes:
            if node in visited:
                continue

            # BFS to find connected component
            component: set[str] = set()
            queue = [node]
            while queue:
                current = queue.pop(0)
                if current in component:
                    continue
                component.add(current)

                # Forward edges
                for neighbor in adjacency.get(current, set()):
                    if neighbor not in component:
                        queue.append(neighbor)
                # Backward edges (someone attests current)
                for attester, subjects in adjacency.items():
                    if current in subjects and attester not in component:
                        queue.append(attester)

            if len(component) < min_ring_size:
                visited.update(component)
                continue

            # Check if this component is a collusion ring:
            # High ratio of intra-cluster attestations vs total
            intra_count = 0
            total_count = 0
            for member in component:
                member_subjects = adjacency.get(member, set())
                total_count += len(member_subjects)
                intra_count += len(member_subjects & component)

            if total_count > 0 and (intra_count / total_count) > 0.5:
                rings.append(component)
                self._alerts.append(SybilAlert(
                    alert_type="collusion_ring",
                    severity=min(1.0, intra_count / max(total_count, 1)),
                    involved_nodes=list(component),
                    description=(
                        f"Collusion ring detected: {len(component)} nodes, "
                        f"{intra_count}/{total_count} intra-cluster attestations"
                    ),
                ))

            visited.update(component)

        return rings

    # ── Node Check ──

    def check_node(self, node_id: str, current_epoch: int) -> list[SybilAlert]:
        """Run all Sybil heuristics on a specific node.

        Parameters
        ----------
        node_id : str
            The node to check.
        current_epoch : int
            The current epoch.

        Returns
        -------
        list[SybilAlert]
            Any alerts raised for this node.
        """
        alerts: list[SybilAlert] = []

        # Check temporal clustering
        temporal = self._temporal_cluster_score(node_id)
        if temporal > 0.5:
            alerts.append(SybilAlert(
                alert_type="temporal_cluster",
                severity=temporal,
                involved_nodes=[node_id],
                description=f"High temporal clustering: {temporal:.2f}",
            ))

        # Check diminishing returns patterns
        attestations = self._by_attester.get(node_id, [])
        subjects = set(a.subject_id for a in attestations)
        for subject in subjects:
            pair_count = len(self._pair_attestations.get((node_id, subject), []))
            if pair_count >= 3:
                alerts.append(SybilAlert(
                    alert_type="diminishing_returns",
                    severity=0.3 + min(0.7, pair_count * 0.1),
                    involved_nodes=[node_id, subject],
                    description=f"Excessive same-pair attestations: {pair_count}x to {subject[:12]}",
                ))

        # Check age decay
        age_factor = self._age_decay_factor(node_id, current_epoch)
        if age_factor < 0.5:
            alerts.append(SybilAlert(
                alert_type="age_decay",
                severity=1.0 - age_factor,
                involved_nodes=[node_id],
                description=f"Node age decay factor: {age_factor:.2f}",
            ))

        self._alerts.extend(alerts)
        return alerts

    def get_alerts(self, min_severity: float = 0.0) -> list[SybilAlert]:
        """Return all alerts above a severity threshold.

        Parameters
        ----------
        min_severity : float
            Minimum severity to include.

        Returns
        -------
        list[SybilAlert]
            Filtered alerts.
        """
        return [a for a in self._alerts if a.severity >= min_severity]

    def clear_alerts(self) -> None:
        """Clear all stored alerts."""
        self._alerts.clear()

    def stats(self) -> dict:
        """Return Sybil detector statistics."""
        return {
            "tracked_pairs": len(self._pair_attestations),
            "tracked_attesters": len(self._by_attester),
            "tracked_subjects": len(self._by_subject),
            "registered_nodes": len(self._node_epochs),
            "total_alerts": len(self._alerts),
        }
