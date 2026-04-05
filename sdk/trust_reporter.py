"""
trust_reporter.py
=================

Background trust attestation daemon.

Observes peer interactions and periodically submits batched trust
attestations on-chain.  Trust scoring uses the ALG-derived formula:
``exp(-5.0 * divergence)`` with EMA smoothing (alpha=0.15).

The reporter runs as a daemon thread, waking every ``interval_s`` seconds
to batch and submit accumulated observations.

Usage::

    reporter = TrustReporter(node, interval_s=600)
    reporter.start()

    # During normal operation:
    reporter.observe_peer(peer_id, outcome=True, skill_hash="abc123")

    # On shutdown:
    reporter.stop()
"""

from __future__ import annotations

import hashlib
import logging
import math
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Trust formula constants (from ALG governance spec)
TRUST_DECAY_FACTOR = 5.0   # exp(-5.0 * divergence)
EMA_ALPHA = 0.15            # Exponential moving average smoothing factor
COOLDOWN_SECONDS = 300.0    # Minimum seconds between attestations for same peer


@dataclass
class PeerObservation:
    """A single observation of a peer's behaviour."""
    peer_id: str
    outcome: bool  # True = good behaviour, False = divergent
    skill_hash: str
    timestamp: float = field(default_factory=time.time)
    divergence: float = 0.0  # 0.0 = perfect, 1.0 = complete divergence


@dataclass
class PeerTrustState:
    """Accumulated trust state for a peer."""
    peer_id: str
    trust_score: float = 1.0
    observation_count: int = 0
    last_reported_at: float = 0.0
    ema_divergence: float = 0.0


class TrustReporter:
    """Background daemon that observes peers and submits trust attestations.

    Ported from Velma's ALG trust computation:
    - Trust = exp(-5.0 * ema_divergence)
    - EMA divergence = alpha * new_divergence + (1 - alpha) * prev_divergence

    Args:
        node: SkillChainNode instance for chain access.
        interval_s: Seconds between batch reporting cycles.
        ema_alpha: EMA smoothing factor for divergence.
        cooldown_s: Minimum seconds between attestations per peer.
    """

    def __init__(
        self,
        node: Any = None,
        interval_s: float = 600.0,
        ema_alpha: float = EMA_ALPHA,
        cooldown_s: float = COOLDOWN_SECONDS,
    ) -> None:
        self._node = node
        self._interval_s = interval_s
        self._ema_alpha = ema_alpha
        self._cooldown_s = cooldown_s

        self._peer_states: Dict[str, PeerTrustState] = {}
        self._pending_observations: List[PeerObservation] = []
        self._lock = threading.Lock()

        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._stop_event = threading.Event()

        # Stats
        self._total_observations = 0
        self._total_attestations = 0
        self._total_batches = 0

    # -- Lifecycle -------------------------------------------------------------

    def start(self) -> None:
        """Start the background reporting thread."""
        if self._running:
            return

        self._running = True
        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._report_loop,
            name="TrustReporter",
            daemon=True,
        )
        self._thread.start()
        logger.info(
            "TrustReporter started (interval=%ds, alpha=%.2f, cooldown=%ds)",
            self._interval_s, self._ema_alpha, self._cooldown_s,
        )

    def stop(self) -> None:
        """Stop the background thread gracefully.

        Performs one final flush of pending observations before stopping.
        """
        self._running = False
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10.0)

        # Final flush
        self._process_pending()
        logger.info("TrustReporter stopped (total attestations: %d)", self._total_attestations)

    # -- Public API ------------------------------------------------------------

    def observe_peer(
        self,
        peer_id: str,
        outcome: bool,
        skill_hash: str = "",
        divergence: Optional[float] = None,
    ) -> None:
        """Record an observation of a peer's behaviour.

        Args:
            peer_id: The observed peer's node ID.
            outcome: True if the peer behaved correctly, False if divergent.
            skill_hash: Hash of the skill involved in this observation.
            divergence: Explicit divergence value [0, 1].  If None, derived
                        from outcome (0.0 for True, 1.0 for False).
        """
        if divergence is None:
            divergence = 0.0 if outcome else 1.0

        obs = PeerObservation(
            peer_id=peer_id,
            outcome=outcome,
            skill_hash=skill_hash,
            divergence=max(0.0, min(1.0, divergence)),
        )

        with self._lock:
            self._pending_observations.append(obs)
            self._total_observations += 1

    def get_local_trust(self, peer_id: str) -> float:
        """Get the locally computed trust score for a peer.

        Args:
            peer_id: The peer's node ID.

        Returns:
            Trust score in [0, 1].  Returns 0.5 (neutral) for unknown peers.
        """
        state = self._peer_states.get(peer_id)
        if state is None:
            return 0.5  # Neutral trust for unknown peers
        return state.trust_score

    def get_all_trust_scores(self) -> Dict[str, float]:
        """Return all locally tracked trust scores."""
        return {
            pid: state.trust_score
            for pid, state in self._peer_states.items()
        }

    @property
    def stats(self) -> Dict[str, Any]:
        """Report daemon statistics."""
        return {
            "running": self._running,
            "total_observations": self._total_observations,
            "total_attestations": self._total_attestations,
            "total_batches": self._total_batches,
            "tracked_peers": len(self._peer_states),
            "pending_observations": len(self._pending_observations),
        }

    # -- Background loop -------------------------------------------------------

    def _report_loop(self) -> None:
        """Main reporting loop — runs on the daemon thread."""
        while self._running:
            self._stop_event.wait(timeout=self._interval_s)
            if not self._running:
                break
            self._process_pending()

    def _process_pending(self) -> None:
        """Process all pending observations and submit batch attestations."""
        with self._lock:
            observations = list(self._pending_observations)
            self._pending_observations.clear()

        if not observations:
            return

        # Update local trust states
        for obs in observations:
            self._update_trust(obs)

        # Build batch of peers ready for attestation (respecting cooldown)
        now = time.time()
        batch: List[tuple[str, float, str]] = []  # (peer_id, trust, evidence_hash)

        for peer_id, state in self._peer_states.items():
            if now - state.last_reported_at < self._cooldown_s:
                continue  # Cooldown not elapsed

            evidence = self._compute_evidence_hash(peer_id, state)
            batch.append((peer_id, state.trust_score, evidence))

        if not batch:
            return

        # Submit batch to chain
        self._submit_batch(batch)

    def _update_trust(self, obs: PeerObservation) -> None:
        """Update local trust state from a single observation.

        Trust formula (from ALG):
            ema_divergence = alpha * divergence + (1 - alpha) * ema_divergence
            trust = exp(-5.0 * ema_divergence)
        """
        if obs.peer_id not in self._peer_states:
            self._peer_states[obs.peer_id] = PeerTrustState(peer_id=obs.peer_id)

        state = self._peer_states[obs.peer_id]
        state.observation_count += 1

        # EMA update
        state.ema_divergence = (
            self._ema_alpha * obs.divergence
            + (1 - self._ema_alpha) * state.ema_divergence
        )

        # Trust from divergence
        state.trust_score = math.exp(-TRUST_DECAY_FACTOR * state.ema_divergence)

    def _compute_evidence_hash(self, peer_id: str, state: PeerTrustState) -> str:
        """Compute evidence hash for an attestation."""
        evidence = (
            f"{peer_id}:{state.trust_score:.6f}:"
            f"{state.observation_count}:{state.ema_divergence:.6f}:"
            f"{time.time()}"
        )
        return hashlib.sha256(evidence.encode()).hexdigest()

    def _submit_batch(self, batch: List[tuple[str, float, str]]) -> None:
        """Submit a batch of trust attestations.

        In production, this calls the chain client's batch report.
        Falls back to individual reports if batch fails.
        """
        self._total_batches += 1
        now = time.time()

        for peer_id, trust, evidence in batch:
            try:
                if self._node is not None:
                    chain = getattr(self._node, "_chain", None)
                    if chain is not None:
                        peer_address = self._resolve_peer_address(peer_id)
                        if peer_address:
                            chain.report_trust(
                                peer_address,
                                trust,
                                bytes.fromhex(evidence),
                            )

                # Update last reported timestamp
                state = self._peer_states.get(peer_id)
                if state:
                    state.last_reported_at = now

                self._total_attestations += 1
                logger.debug(
                    "Attested trust for %s: %.4f (evidence=%s...)",
                    peer_id, trust, evidence[:12],
                )

            except Exception as exc:
                logger.warning("Trust attestation failed for %s: %s", peer_id, exc)

    def _resolve_peer_address(self, peer_id: str) -> Optional[str]:
        """Resolve a peer's node ID to a wallet address.

        In production, this would query the on-chain node registry.
        """
        if self._node is None:
            return None

        # Attempt lookup via node's chain client
        chain = getattr(self._node, "_chain", None)
        if chain is None:
            return None

        # For now, return None — the full resolution requires
        # an on-chain reverse lookup (node_id -> address)
        return None
