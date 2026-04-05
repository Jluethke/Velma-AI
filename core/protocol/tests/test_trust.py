# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# Proprietary and Confidential.

"""Tests for skillchain.protocol.trust — Network ALG trust computation."""

from __future__ import annotations

import math

import pytest

from skillchain.core.protocol.trust import (
    NetworkTrustModule,
    TrustAttestation,
    classify_trust_phase,
)
from skillchain.core.protocol import config


class TestTrustPhaseClassification:
    """Test trust phase thresholds."""

    def test_high_trust_is_validator(self) -> None:
        assert classify_trust_phase(0.80) == "validator"
        assert classify_trust_phase(0.65) == "validator"

    def test_mid_trust_is_participant(self) -> None:
        assert classify_trust_phase(0.50) == "participant"
        assert classify_trust_phase(0.40) == "participant"

    def test_low_trust_is_probation(self) -> None:
        assert classify_trust_phase(0.30) == "probation"
        assert classify_trust_phase(0.20) == "probation"

    def test_very_low_trust_is_excluded(self) -> None:
        assert classify_trust_phase(0.10) == "excluded"
        assert classify_trust_phase(0.0) == "excluded"


class TestTrustAttestation:
    """Test TrustAttestation data class."""

    def test_positive_attestation(self) -> None:
        att = TrustAttestation(
            attester_id="a", subject_id="b",
            skill_hash="hash1", outcome="pass",
            shadow_results=[0.9, 0.85, 0.88],
        )
        assert att.is_positive
        assert att.divergence == pytest.approx(1.0 - 0.8766, abs=0.01)

    def test_negative_attestation(self) -> None:
        att = TrustAttestation(
            attester_id="a", subject_id="b",
            skill_hash="hash1", outcome="fail",
        )
        assert not att.is_positive
        assert att.divergence == 1.0

    def test_partial_attestation(self) -> None:
        att = TrustAttestation(
            attester_id="a", subject_id="b",
            skill_hash="hash1", outcome="partial",
        )
        assert att.divergence == 0.5

    def test_signable_bytes_deterministic(self) -> None:
        att = TrustAttestation(
            attester_id="a", subject_id="b",
            skill_hash="hash1", outcome="pass",
            shadow_results=[0.9], epoch=1, timestamp=1000.0,
        )
        assert att.signable_bytes() == att.signable_bytes()


class TestNetworkTrustModule:
    """Test the network trust module."""

    def test_register_peer(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("node_a", epoch=0)
        assert tm.get_trust("node_a") == pytest.approx(0.5)

    def test_unknown_peer_has_zero_trust(self) -> None:
        tm = NetworkTrustModule()
        assert tm.get_trust("unknown") == 0.0

    def test_positive_attestation_increases_trust(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("validator", epoch=0)
        tm.register_peer("subject", epoch=0)

        # Give validator high trust so its attestations carry weight
        tm._peers["validator"].ema_trust = 0.9

        initial = tm.get_trust("subject")
        att = TrustAttestation(
            attester_id="validator", subject_id="subject",
            skill_hash="h1", outcome="pass",
            shadow_results=[0.95, 0.90, 0.92], epoch=1,
        )
        tm.record_attestation(att)
        assert tm.get_trust("subject") > initial

    def test_negative_attestation_decreases_trust(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("validator", epoch=0)
        tm.register_peer("subject", epoch=0)
        tm._peers["validator"].ema_trust = 0.9
        tm._peers["subject"].ema_trust = 0.8

        initial = tm.get_trust("subject")
        att = TrustAttestation(
            attester_id="validator", subject_id="subject",
            skill_hash="h1", outcome="fail", epoch=1,
        )
        tm.record_attestation(att)
        assert tm.get_trust("subject") < initial

    def test_attestation_cooldown(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("v", epoch=0)
        tm.register_peer("s", epoch=0)
        tm._peers["v"].ema_trust = 0.9

        att1 = TrustAttestation(
            attester_id="v", subject_id="s",
            skill_hash="h1", outcome="pass", epoch=1,
        )
        tm.record_attestation(att1)
        trust_after_first = tm.get_trust("s")

        # Same epoch should be cooled down
        att2 = TrustAttestation(
            attester_id="v", subject_id="s",
            skill_hash="h2", outcome="pass", epoch=1,
        )
        tm.record_attestation(att2)
        assert tm.get_trust("s") == trust_after_first

    def test_web_of_trust_low_trust_attester_dampened(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("low_trust", epoch=0)
        tm.register_peer("high_trust", epoch=0)
        tm.register_peer("subject", epoch=0)

        tm._peers["low_trust"].ema_trust = 0.1
        tm._peers["high_trust"].ema_trust = 0.9

        initial = tm.get_trust("subject")

        # Attestation from low-trust node
        att_low = TrustAttestation(
            attester_id="low_trust", subject_id="subject",
            skill_hash="h1", outcome="pass",
            shadow_results=[0.95], epoch=1,
        )
        tm.record_attestation(att_low)
        change_from_low = abs(tm.get_trust("subject") - initial)

        # Reset and try from high-trust node
        tm._peers["subject"].ema_trust = initial
        att_high = TrustAttestation(
            attester_id="high_trust", subject_id="subject",
            skill_hash="h2", outcome="pass",
            shadow_results=[0.95], epoch=2,
        )
        tm.record_attestation(att_high)
        change_from_high = abs(tm.get_trust("subject") - initial)

        # High-trust attester should have more impact
        assert change_from_high > change_from_low

    def test_consensus_weight_cap(self) -> None:
        tm = NetworkTrustModule()
        # Create one dominant node and several others
        tm.register_peer("dominant", epoch=0)
        tm._peers["dominant"].ema_trust = 0.99

        for i in range(9):
            nid = f"peer_{i}"
            tm.register_peer(nid, epoch=0)
            tm._peers[nid].ema_trust = 0.50

        weight = tm.compute_consensus_weight("dominant")
        total = sum(tm.compute_consensus_weight(nid) for nid in tm.all_peer_ids())

        # Dominant node weight should be capped
        if total > 0:
            ratio = weight / total
            assert ratio <= config.MAX_VALIDATOR_WEIGHT_FRACTION + 0.01

    def test_get_validators(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("v1", epoch=0)
        tm.register_peer("v2", epoch=0)
        tm.register_peer("p1", epoch=0)
        tm._peers["v1"].ema_trust = 0.8
        tm._peers["v2"].ema_trust = 0.7
        tm._peers["p1"].ema_trust = 0.4

        validators = tm.get_validators()
        assert "v1" in validators
        assert "v2" in validators
        assert "p1" not in validators

    def test_compute_peer_trust_details(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("node", epoch=5)
        tm._peers["node"].ema_trust = 0.75
        tm._peers["node"].published_skills = 3
        tm.set_epoch(10)

        info = tm.compute_peer_trust("node")
        assert info["trust"] == 0.75
        assert info["phase"] == "validator"
        assert info["published_skills"] == 3
        assert info["epochs_active"] == 5

    def test_stats(self) -> None:
        tm = NetworkTrustModule()
        tm.register_peer("a", epoch=0)
        tm.register_peer("b", epoch=0)
        stats = tm.stats()
        assert stats["total_peers"] == 2
