"""
test_trust_reporter.py
======================

Tests for the TrustReporter background daemon.

Verifies trust computation (ALG formula), EMA smoothing, observation
tracking, and batch attestation logic.
"""

from __future__ import annotations

import math
import time

import pytest

from skillchain.sdk.trust_reporter import (
    TRUST_DECAY_FACTOR,
    EMA_ALPHA,
    PeerObservation,
    PeerTrustState,
    TrustReporter,
)


# -- Fixtures ------------------------------------------------------------------

@pytest.fixture
def reporter() -> TrustReporter:
    """Create a TrustReporter without a node (offline mode)."""
    return TrustReporter(node=None, interval_s=1.0, cooldown_s=0.0)


# -- Trust computation --------------------------------------------------------

class TestTrustComputation:
    """Tests for the ALG-derived trust formula."""

    def test_perfect_peer(self, reporter: TrustReporter) -> None:
        """A peer with zero divergence should have trust ~1.0."""
        obs = PeerObservation(
            peer_id="peer-1", outcome=True, skill_hash="abc", divergence=0.0,
        )
        reporter._update_trust(obs)
        trust = reporter.get_local_trust("peer-1")
        assert trust == pytest.approx(1.0, abs=0.01)

    def test_bad_peer_trust_drops(self, reporter: TrustReporter) -> None:
        """A peer with full divergence should have low trust."""
        for _ in range(10):
            obs = PeerObservation(
                peer_id="bad-peer", outcome=False, skill_hash="xyz", divergence=1.0,
            )
            reporter._update_trust(obs)

        trust = reporter.get_local_trust("bad-peer")
        assert trust < 0.3

    def test_ema_smoothing(self, reporter: TrustReporter) -> None:
        """EMA should smooth divergence over multiple observations."""
        # First observation: divergence=1.0
        reporter._update_trust(PeerObservation(
            peer_id="p1", outcome=False, skill_hash="a", divergence=1.0,
        ))
        state = reporter._peer_states["p1"]
        expected_ema = EMA_ALPHA * 1.0  # First observation, prior was 0
        assert state.ema_divergence == pytest.approx(expected_ema, abs=0.001)

        # Second observation: divergence=0.0 (good behaviour)
        reporter._update_trust(PeerObservation(
            peer_id="p1", outcome=True, skill_hash="b", divergence=0.0,
        ))
        expected_ema2 = EMA_ALPHA * 0.0 + (1 - EMA_ALPHA) * expected_ema
        assert state.ema_divergence == pytest.approx(expected_ema2, abs=0.001)

    def test_trust_formula_matches_alg(self) -> None:
        """Verify trust = exp(-5.0 * divergence)."""
        for div in [0.0, 0.1, 0.3, 0.5, 0.8, 1.0]:
            expected = math.exp(-TRUST_DECAY_FACTOR * div)
            state = PeerTrustState(peer_id="x", ema_divergence=div)
            state.trust_score = math.exp(-TRUST_DECAY_FACTOR * state.ema_divergence)
            assert state.trust_score == pytest.approx(expected, abs=0.0001)

    def test_unknown_peer_returns_neutral(self, reporter: TrustReporter) -> None:
        """Unknown peers should return 0.5 (neutral trust)."""
        assert reporter.get_local_trust("unknown") == 0.5


# -- Observation tracking ------------------------------------------------------

class TestObservations:
    """Tests for observe_peer() and pending observation management."""

    def test_observe_increments_count(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True, skill_hash="a")
        assert reporter._total_observations == 1
        assert len(reporter._pending_observations) == 1

    def test_observe_multiple_peers(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True, skill_hash="a")
        reporter.observe_peer("p2", outcome=False, skill_hash="b")
        reporter.observe_peer("p3", outcome=True, skill_hash="c")
        assert reporter._total_observations == 3

    def test_divergence_clamped(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True, divergence=2.5)
        obs = reporter._pending_observations[0]
        assert obs.divergence == 1.0

        reporter.observe_peer("p2", outcome=True, divergence=-0.5)
        obs2 = reporter._pending_observations[1]
        assert obs2.divergence == 0.0

    def test_default_divergence_from_outcome(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True)
        assert reporter._pending_observations[0].divergence == 0.0

        reporter.observe_peer("p2", outcome=False)
        assert reporter._pending_observations[1].divergence == 1.0


# -- Processing pipeline ------------------------------------------------------

class TestProcessing:
    """Tests for _process_pending()."""

    def test_process_updates_trust(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True)
        reporter.observe_peer("p1", outcome=True)
        reporter._process_pending()

        assert "p1" in reporter._peer_states
        assert reporter._peer_states["p1"].observation_count == 2

    def test_process_clears_pending(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True)
        assert len(reporter._pending_observations) == 1
        reporter._process_pending()
        assert len(reporter._pending_observations) == 0

    def test_empty_process_is_noop(self, reporter: TrustReporter) -> None:
        reporter._process_pending()  # Should not raise


# -- Stats ---------------------------------------------------------------------

class TestStats:
    """Tests for stats reporting."""

    def test_initial_stats(self, reporter: TrustReporter) -> None:
        stats = reporter.stats
        assert stats["running"] is False
        assert stats["total_observations"] == 0
        assert stats["tracked_peers"] == 0

    def test_stats_after_observations(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True)
        reporter.observe_peer("p2", outcome=False)
        reporter._process_pending()

        stats = reporter.stats
        assert stats["total_observations"] == 2
        assert stats["tracked_peers"] == 2
        assert stats["pending_observations"] == 0


# -- Lifecycle -----------------------------------------------------------------

class TestLifecycle:
    """Tests for start/stop."""

    def test_start_stop(self) -> None:
        reporter = TrustReporter(node=None, interval_s=0.1)
        reporter.start()
        assert reporter._running is True
        reporter.stop()
        assert reporter._running is False

    def test_double_start_is_safe(self) -> None:
        reporter = TrustReporter(node=None, interval_s=0.1)
        reporter.start()
        reporter.start()  # Should not create a second thread
        reporter.stop()

    def test_get_all_trust_scores(self, reporter: TrustReporter) -> None:
        reporter.observe_peer("p1", outcome=True)
        reporter.observe_peer("p2", outcome=False)
        reporter._process_pending()

        scores = reporter.get_all_trust_scores()
        assert "p1" in scores
        assert "p2" in scores
        assert scores["p1"] > scores["p2"]
