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
trust.py — Network ALG trust computation for SkillChain.

Adapts the Velma ALG trust module (exp-decay + EMA) to a decentralized
network context with:
- Per-peer trust scores based on attestation outcomes
- Web of trust: trust in an attestation is weighted by trust in the attester
- Attestation cooldowns to prevent rapid-fire trust inflation
- Phase classification: validator >= 0.65, participant >= 0.40, probation >= 0.20

Trust function (identical to ALG):
    raw_trust = exp(-NETWORK_DECAY_GAIN * divergence)
    smoothed  = NETWORK_EMA_ALPHA * raw + (1 - NETWORK_EMA_ALPHA) * prev_ema

Patent Family B: Runtime governance of learning/adaptive systems.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import hashlib
import logging
import math
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Optional

from . import config

logger = logging.getLogger("skillchain.protocol.trust")


# ── Phase Classification ──

TRUST_PHASES = [
    ("validator", config.VALIDATOR_TRUST_THRESHOLD),
    ("participant", config.PARTICIPANT_TRUST_THRESHOLD),
    ("probation", config.PROBATION_TRUST_THRESHOLD),
]


def classify_trust_phase(trust_score: float) -> str:
    """Classify a trust score into a network phase.

    Parameters
    ----------
    trust_score : float
        Trust score in [0, 1].

    Returns
    -------
    str
        Phase name: "validator", "participant", "probation", or "excluded".
    """
    for name, threshold in TRUST_PHASES:
        if trust_score >= threshold:
            return name
    return "excluded"


# ── Trust Attestation ──

@dataclass
class TrustAttestation:
    """
    A signed attestation of a peer's skill validation outcome.

    Attester declares: "I validated skill_hash from subject_id, and
    the outcome was {outcome} with these shadow results."

    Attestations are the atomic trust signals in the network.
    """

    attester_id: str
    subject_id: str
    skill_hash: str
    outcome: str                     # "pass", "fail", "partial"
    shadow_results: list[float] = field(default_factory=list)
    epoch: int = 0
    timestamp: float = field(default_factory=time.time)
    signature: str = ""              # hex-encoded Ed25519 signature

    @property
    def is_positive(self) -> bool:
        return self.outcome == "pass"

    @property
    def divergence(self) -> float:
        """Compute divergence from shadow results.

        Divergence = 1.0 - average similarity. A perfect pass has
        divergence 0.0; a complete fail has divergence 1.0.
        """
        if not self.shadow_results:
            return 0.5 if self.outcome == "partial" else (0.0 if self.is_positive else 1.0)
        avg_sim = sum(self.shadow_results) / len(self.shadow_results)
        return max(0.0, 1.0 - avg_sim)

    def signable_bytes(self) -> bytes:
        """Canonical bytes for signing."""
        import json
        d = {
            "attester_id": self.attester_id,
            "subject_id": self.subject_id,
            "skill_hash": self.skill_hash,
            "outcome": self.outcome,
            "shadow_results": self.shadow_results,
            "epoch": self.epoch,
            "timestamp": self.timestamp,
        }
        return json.dumps(d, sort_keys=True, separators=(",", ":")).encode("utf-8")


@dataclass
class _PeerTrustState:
    """Internal mutable trust state for a single peer."""
    ema_trust: float = 0.5          # Start at neutral, not 1.0 (untrusted until proven)
    raw_history: deque = field(default_factory=lambda: deque(maxlen=200))
    attestation_count: int = 0
    positive_count: int = 0
    negative_count: int = 0
    last_attestation_epoch: int = -1
    joined_epoch: int = 0
    published_skills: int = 0
    validated_skills: int = 0


class NetworkTrustModule:
    """
    Network-wide trust computation using ALG exp-decay + EMA.

    Each peer has an independent trust score that evolves based on
    attestations from other peers. Trust in attestations is weighted
    by the trust score of the attester (web of trust).

    Usage:
        trust = NetworkTrustModule()
        trust.register_peer("node_abc...", epoch=0)

        # Record attestation
        att = TrustAttestation(
            attester_id="node_xyz...",
            subject_id="node_abc...",
            skill_hash="sha256...",
            outcome="pass",
            shadow_results=[0.85, 0.90, 0.88],
            epoch=1,
        )
        trust.record_attestation(att)

        # Query trust
        score = trust.get_trust("node_abc...")
        phase = trust.get_phase("node_abc...")
        weight = trust.compute_consensus_weight("node_abc...")
    """

    def __init__(
        self,
        decay_gain: float = config.NETWORK_DECAY_GAIN,
        ema_alpha: float = config.NETWORK_EMA_ALPHA,
    ) -> None:
        self._decay_gain = decay_gain
        self._ema_alpha = ema_alpha
        self._peers: dict[str, _PeerTrustState] = {}
        # Attestation tracking: (attester, subject) -> list of epochs
        self._attestation_log: dict[tuple[str, str], list[int]] = defaultdict(list)
        self._current_epoch: int = 0

    def register_peer(self, node_id: str, epoch: int = 0) -> None:
        """Register a new peer with initial neutral trust.

        Parameters
        ----------
        node_id : str
            The peer's node ID.
        epoch : int
            The epoch when the peer joined.
        """
        if node_id not in self._peers:
            self._peers[node_id] = _PeerTrustState(joined_epoch=epoch)
            logger.debug("Registered peer %s...%s at epoch %d", node_id[:8], node_id[-4:], epoch)

    def set_epoch(self, epoch: int) -> None:
        """Advance the current epoch counter."""
        self._current_epoch = epoch

    def record_attestation(self, attestation: TrustAttestation) -> float:
        """Record a trust attestation and update the subject's trust.

        The attestation's impact on trust is weighted by the attester's
        own trust score (web of trust). Attestations from untrusted
        peers have less effect.

        Parameters
        ----------
        attestation : TrustAttestation
            The signed attestation to record.

        Returns
        -------
        float
            The subject's updated trust score.
        """
        subject = attestation.subject_id
        attester = attestation.attester_id

        # Ensure both peers are registered
        self.register_peer(subject, epoch=self._current_epoch)
        self.register_peer(attester, epoch=self._current_epoch)

        # Check attestation cooldown
        pair_key = (attester, subject)
        pair_epochs = self._attestation_log[pair_key]
        if pair_epochs and (attestation.epoch - pair_epochs[-1]) < config.ATTESTATION_COOLDOWN_EPOCHS:
            logger.debug(
                "Attestation cooldown: %s->%s (epoch %d, last %d)",
                attester[:8], subject[:8], attestation.epoch, pair_epochs[-1],
            )
            return self.get_trust(subject)

        pair_epochs.append(attestation.epoch)

        # Web of trust: weight by attester's trust
        attester_trust = self.get_trust(attester)
        divergence = attestation.divergence

        # Raw trust from exp-decay
        raw = math.exp(-self._decay_gain * divergence)

        # Weight the raw trust signal by attester credibility
        # If attester has low trust, the signal is dampened toward 0.5 (neutral)
        weighted_raw = attester_trust * raw + (1.0 - attester_trust) * 0.5

        # EMA update
        state = self._peers[subject]
        state.ema_trust = self._ema_alpha * weighted_raw + (1.0 - self._ema_alpha) * state.ema_trust
        state.ema_trust = max(0.0, min(1.0, state.ema_trust))

        # Bookkeeping
        state.attestation_count += 1
        state.raw_history.append(weighted_raw)
        state.last_attestation_epoch = attestation.epoch

        if attestation.is_positive:
            state.positive_count += 1
        else:
            state.negative_count += 1

        logger.debug(
            "Attestation: %s->%s outcome=%s div=%.3f raw=%.3f weighted=%.3f ema=%.3f",
            attester[:8], subject[:8], attestation.outcome,
            divergence, raw, weighted_raw, state.ema_trust,
        )

        return state.ema_trust

    def record_skill_published(self, node_id: str) -> None:
        """Record that a peer published a skill."""
        self.register_peer(node_id, epoch=self._current_epoch)
        self._peers[node_id].published_skills += 1

    def record_skill_validated(self, node_id: str) -> None:
        """Record that a peer validated a skill (as validator)."""
        self.register_peer(node_id, epoch=self._current_epoch)
        self._peers[node_id].validated_skills += 1

    def get_trust(self, node_id: str) -> float:
        """Get the current trust score for a peer.

        Parameters
        ----------
        node_id : str
            The peer's node ID.

        Returns
        -------
        float
            Trust score in [0, 1]. Returns 0.0 for unknown peers.
        """
        state = self._peers.get(node_id)
        if state is None:
            return 0.0
        return state.ema_trust

    def get_phase(self, node_id: str) -> str:
        """Get the trust phase classification for a peer.

        Returns
        -------
        str
            "validator", "participant", "probation", or "excluded".
        """
        return classify_trust_phase(self.get_trust(node_id))

    def compute_consensus_weight(self, node_id: str) -> float:
        """Compute BFT voting weight for a peer.

        Weight is the trust score capped at MAX_VALIDATOR_WEIGHT_FRACTION
        of the total trust in the network. This prevents any single
        validator from dominating consensus.

        Parameters
        ----------
        node_id : str
            The peer's node ID.

        Returns
        -------
        float
            Voting weight in [0, 1].
        """
        trust = self.get_trust(node_id)
        if trust < config.PARTICIPANT_TRUST_THRESHOLD:
            return 0.0

        # Cap individual weight at MAX_VALIDATOR_WEIGHT_FRACTION of total
        total_trust = sum(
            s.ema_trust for s in self._peers.values()
            if s.ema_trust >= config.PARTICIPANT_TRUST_THRESHOLD
        )
        if total_trust <= 0:
            return 0.0

        max_weight = config.MAX_VALIDATOR_WEIGHT_FRACTION * total_trust
        return min(trust, max_weight)

    def compute_peer_trust(self, node_id: str) -> dict:
        """Compute detailed trust information for a peer.

        Returns a dict with trust score, phase, attestation stats,
        and eligibility information.

        Parameters
        ----------
        node_id : str
            The peer's node ID.

        Returns
        -------
        dict
            Detailed trust breakdown.
        """
        state = self._peers.get(node_id)
        if state is None:
            return {
                "node_id": node_id,
                "trust": 0.0,
                "phase": "excluded",
                "attestations": 0,
                "positive": 0,
                "negative": 0,
                "consensus_weight": 0.0,
            }

        return {
            "node_id": node_id,
            "trust": state.ema_trust,
            "phase": classify_trust_phase(state.ema_trust),
            "attestations": state.attestation_count,
            "positive": state.positive_count,
            "negative": state.negative_count,
            "published_skills": state.published_skills,
            "validated_skills": state.validated_skills,
            "joined_epoch": state.joined_epoch,
            "epochs_active": max(0, self._current_epoch - state.joined_epoch),
            "consensus_weight": self.compute_consensus_weight(node_id),
        }

    def get_validators(self) -> list[str]:
        """Return node IDs of all peers in the validator phase."""
        return [
            nid for nid, state in self._peers.items()
            if state.ema_trust >= config.VALIDATOR_TRUST_THRESHOLD
        ]

    def get_participants(self) -> list[str]:
        """Return node IDs of all peers in participant phase or higher."""
        return [
            nid for nid, state in self._peers.items()
            if state.ema_trust >= config.PARTICIPANT_TRUST_THRESHOLD
        ]

    def reset_peer(self, node_id: str) -> None:
        """Reset a peer's trust to neutral."""
        if node_id in self._peers:
            self._peers[node_id] = _PeerTrustState(
                joined_epoch=self._peers[node_id].joined_epoch,
            )

    def all_peer_ids(self) -> list[str]:
        """Return all registered peer IDs."""
        return list(self._peers.keys())

    def stats(self) -> dict:
        """Return aggregate trust statistics."""
        validators = self.get_validators()
        participants = self.get_participants()
        all_trusts = [s.ema_trust for s in self._peers.values()]
        return {
            "total_peers": len(self._peers),
            "validators": len(validators),
            "participants": len(participants),
            "avg_trust": sum(all_trusts) / len(all_trusts) if all_trusts else 0.0,
            "min_trust": min(all_trusts) if all_trusts else 0.0,
            "max_trust": max(all_trusts) if all_trusts else 0.0,
            "current_epoch": self._current_epoch,
        }
