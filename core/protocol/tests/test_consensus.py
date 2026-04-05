# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# Proprietary and Confidential.

"""Tests for skillchain.protocol.consensus — Trust-weighted BFT."""

from __future__ import annotations

import pytest

from skillchain.core.protocol.consensus import (
    ConsensusPhase,
    TrustWeightedBFT,
    ValidatorInfo,
)
from skillchain.core.protocol.trust import NetworkTrustModule
from skillchain.core.protocol import config


def _setup_trust_module(num_validators: int = 5) -> tuple[NetworkTrustModule, list[str]]:
    """Create a trust module with pre-registered validators."""
    tm = NetworkTrustModule()
    node_ids = []
    for i in range(num_validators):
        nid = f"node_{i:04d}" + "0" * 56  # Pad to 64 chars
        tm.register_peer(nid, epoch=0)
        state = tm._peers[nid]
        state.ema_trust = 0.7 + (i * 0.02)
        state.published_skills = 3
        state.validated_skills = 3
        node_ids.append(nid)
    return tm, node_ids


class TestValidatorSelection:
    """Test validator selection for epochs."""

    def test_select_validators_returns_eligible(self) -> None:
        tm, node_ids = _setup_trust_module(5)
        tm.set_epoch(5)  # Need 3+ epochs active

        bft = TrustWeightedBFT(tm)
        validators = bft.select_validators_for_epoch(epoch=5)

        assert len(validators) == 5
        for v in validators:
            assert v.trust >= config.PARTICIPANT_TRUST_THRESHOLD

    def test_low_trust_excluded(self) -> None:
        tm, node_ids = _setup_trust_module(3)
        tm.register_peer("low_node" + "0" * 56, epoch=0)
        tm._peers["low_node" + "0" * 56].ema_trust = 0.2
        tm._peers["low_node" + "0" * 56].published_skills = 10

        bft = TrustWeightedBFT(tm)
        validators = bft.select_validators_for_epoch(epoch=5)

        validator_ids = [v.node_id for v in validators]
        assert "low_node" + "0" * 56 not in validator_ids

    def test_insufficient_skills_excluded(self) -> None:
        tm, _ = _setup_trust_module(3)
        nid = "new_node_" + "0" * 55
        tm.register_peer(nid, epoch=0)
        tm._peers[nid].ema_trust = 0.8
        tm._peers[nid].published_skills = 1
        tm._peers[nid].validated_skills = 1

        bft = TrustWeightedBFT(tm)
        validators = bft.select_validators_for_epoch(epoch=5)

        validator_ids = [v.node_id for v in validators]
        assert nid not in validator_ids

    def test_weights_sum_to_one(self) -> None:
        tm, _ = _setup_trust_module(5)
        bft = TrustWeightedBFT(tm)
        validators = bft.select_validators_for_epoch(epoch=5)

        total_weight = sum(v.weight for v in validators)
        assert total_weight == pytest.approx(1.0, abs=0.001)


class TestLeaderSelection:
    """Test deterministic leader selection."""

    def test_leader_is_deterministic(self) -> None:
        tm, _ = _setup_trust_module(5)
        bft = TrustWeightedBFT(tm)
        bft.select_validators_for_epoch(epoch=5)

        leader1 = bft.get_slot_leader(epoch=5, slot=0)
        leader2 = bft.get_slot_leader(epoch=5, slot=0)
        assert leader1 == leader2

    def test_different_slots_can_have_different_leaders(self) -> None:
        tm, _ = _setup_trust_module(10)
        bft = TrustWeightedBFT(tm)
        bft.select_validators_for_epoch(epoch=5)

        leaders = set()
        for slot in range(50):
            leader = bft.get_slot_leader(epoch=5, slot=slot)
            if leader:
                leaders.add(leader)

        # With 10 validators over 50 slots, we should see multiple leaders
        assert len(leaders) > 1

    def test_no_validators_returns_none(self) -> None:
        tm = NetworkTrustModule()
        bft = TrustWeightedBFT(tm)
        bft.select_validators_for_epoch(epoch=5)
        assert bft.get_slot_leader(epoch=5, slot=0) is None


class TestConsensusLifecycle:
    """Test the full block lifecycle: propose -> prevote -> precommit -> commit."""

    def _setup_bft(self) -> tuple[TrustWeightedBFT, list[str]]:
        tm, node_ids = _setup_trust_module(5)
        bft = TrustWeightedBFT(tm)
        bft.select_validators_for_epoch(epoch=5)
        return bft, node_ids

    def test_proposal_accepted_from_leader(self) -> None:
        bft, node_ids = self._setup_bft()
        leader = bft.get_slot_leader(epoch=5, slot=0)
        bft.start_slot(epoch=5, slot=0)

        result = bft.receive_proposal(epoch=5, slot=0, proposer=leader, block_hash="block_abc")
        assert result is True

    def test_proposal_rejected_from_non_leader(self) -> None:
        bft, node_ids = self._setup_bft()
        leader = bft.get_slot_leader(epoch=5, slot=0)
        non_leader = [n for n in node_ids if n != leader][0]

        bft.start_slot(epoch=5, slot=0)
        result = bft.receive_proposal(epoch=5, slot=0, proposer=non_leader, block_hash="block_abc")
        assert result is False

    def test_full_commit_cycle(self) -> None:
        bft, node_ids = self._setup_bft()
        leader = bft.get_slot_leader(epoch=5, slot=0)
        bft.start_slot(epoch=5, slot=0)

        # Propose
        bft.receive_proposal(epoch=5, slot=0, proposer=leader, block_hash="block_123")

        # Prevote from all validators
        for nid in node_ids:
            bft.receive_prevote(epoch=5, slot=0, voter=nid, block_hash="block_123")

        # Precommit from all validators
        for nid in node_ids:
            bft.receive_precommit(epoch=5, slot=0, voter=nid, block_hash="block_123")

        assert bft.is_committed(epoch=5, slot=0)
        assert bft.get_committed_hash(epoch=5, slot=0) == "block_123"

    def test_supermajority_required(self) -> None:
        bft, node_ids = self._setup_bft()
        leader = bft.get_slot_leader(epoch=5, slot=0)
        bft.start_slot(epoch=5, slot=0)
        bft.receive_proposal(epoch=5, slot=0, proposer=leader, block_hash="block_x")

        # Only 1 prevote — should not advance
        bft.receive_prevote(epoch=5, slot=0, voter=node_ids[0], block_hash="block_x")

        state = bft.get_slot_state(epoch=5, slot=0)
        assert state.phase == ConsensusPhase.PREVOTE  # Still in prevote

    def test_duplicate_vote_rejected(self) -> None:
        bft, node_ids = self._setup_bft()
        leader = bft.get_slot_leader(epoch=5, slot=0)
        bft.start_slot(epoch=5, slot=0)
        bft.receive_proposal(epoch=5, slot=0, proposer=leader, block_hash="block_y")

        bft.receive_prevote(epoch=5, slot=0, voter=node_ids[0], block_hash="block_y")
        result = bft.receive_prevote(epoch=5, slot=0, voter=node_ids[0], block_hash="block_y")
        assert result is False

    def test_non_committed_slot(self) -> None:
        bft, _ = self._setup_bft()
        assert not bft.is_committed(epoch=5, slot=99)
        assert bft.get_committed_hash(epoch=5, slot=99) is None

    def test_stats(self) -> None:
        bft, _ = self._setup_bft()
        stats = bft.stats(epoch=5)
        assert stats["epoch"] == 5
        assert stats["validators"] == 5
