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
consensus.py — Trust-weighted BFT consensus for SkillChain.

Implements a Tendermint-style consensus protocol where voting power
is derived from network trust scores rather than stake:

    Block lifecycle: PROPOSE -> PREVOTE -> PRECOMMIT -> COMMIT

    - Leader selection: deterministic hash of (epoch_seed + slot) weighted by trust
    - Validator eligibility: 3+ epochs, 5+ skills, trust >= 0.40
    - Supermajority: 2/3 of trust weight required for prevote and precommit
    - Weight cap: no single validator can hold > 10% of total weight

Epochs contain BLOCKS_PER_EPOCH blocks (~6s each = ~100 minutes per epoch).

Patent Family B: Runtime governance of learning/adaptive systems.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import hashlib
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from . import config
from .trust import NetworkTrustModule

logger = logging.getLogger("skillchain.protocol.consensus")


class ConsensusPhase(str, Enum):
    """Phases of the BFT block lifecycle."""
    IDLE = "idle"
    PROPOSE = "propose"
    PREVOTE = "prevote"
    PRECOMMIT = "precommit"
    COMMIT = "commit"


@dataclass
class ValidatorInfo:
    """Information about a validator in the current epoch.

    Tracks the validator's trust-derived weight and participation
    statistics for the current epoch.
    """

    node_id: str
    trust: float
    weight: float                   # Normalized voting weight [0, 1]
    joined_epoch: int = 0
    published_skills: int = 0
    validated_skills: int = 0

    @property
    def is_eligible(self) -> bool:
        """Check if this validator meets minimum eligibility requirements."""
        return (
            self.trust >= config.PARTICIPANT_TRUST_THRESHOLD
            and self.published_skills + self.validated_skills >= config.MIN_VALIDATOR_SKILLS
        )


@dataclass
class _VoteRecord:
    """Internal record of a vote (prevote or precommit)."""
    voter_id: str
    block_hash: str
    weight: float
    timestamp: float = field(default_factory=time.time)


@dataclass
class SlotState:
    """State for a single consensus slot (one block)."""
    slot: int
    epoch: int
    phase: ConsensusPhase = ConsensusPhase.IDLE
    proposer_id: str = ""
    proposed_block_hash: str = ""
    prevotes: list[_VoteRecord] = field(default_factory=list)
    precommits: list[_VoteRecord] = field(default_factory=list)
    committed_block_hash: str = ""
    phase_start_time: float = field(default_factory=time.time)

    @property
    def is_committed(self) -> bool:
        return self.phase == ConsensusPhase.COMMIT and bool(self.committed_block_hash)


class TrustWeightedBFT:
    """
    Trust-weighted Byzantine Fault Tolerant consensus engine.

    Uses Tendermint-style round-based consensus with trust scores
    as voting power instead of economic stake.

    Usage:
        trust_module = NetworkTrustModule()
        bft = TrustWeightedBFT(trust_module)

        # Start epoch
        validators = bft.select_validators_for_epoch(epoch=1)

        # For each slot
        leader = bft.get_slot_leader(epoch=1, slot=0)
        bft.start_slot(epoch=1, slot=0)

        # Propose
        bft.receive_proposal(epoch=1, slot=0, proposer="node_a", block_hash="abc...")

        # Prevote
        bft.receive_prevote(epoch=1, slot=0, voter="node_b", block_hash="abc...")
        # ... collect 2/3 weight ...

        # Precommit
        bft.receive_precommit(epoch=1, slot=0, voter="node_b", block_hash="abc...")
        # ... collect 2/3 weight ...

        # Check commitment
        if bft.is_committed(epoch=1, slot=0):
            committed_hash = bft.get_committed_hash(epoch=1, slot=0)
    """

    SUPERMAJORITY_FRACTION: float = 2.0 / 3.0

    def __init__(self, trust_module: NetworkTrustModule) -> None:
        self._trust = trust_module
        # Epoch -> list of ValidatorInfo
        self._epoch_validators: dict[int, list[ValidatorInfo]] = {}
        # (epoch, slot) -> SlotState
        self._slots: dict[tuple[int, int], SlotState] = {}
        # Epoch seeds for deterministic leader selection
        self._epoch_seeds: dict[int, bytes] = {}

    # ── Validator Selection ──

    def select_validators_for_epoch(self, epoch: int) -> list[ValidatorInfo]:
        """Select and weight validators for an epoch.

        Eligibility requirements:
        - Trust >= PARTICIPANT_TRUST_THRESHOLD (0.40)
        - Active for >= MIN_VALIDATOR_EPOCHS (3) epochs
        - Published + validated >= MIN_VALIDATOR_SKILLS (5) skills

        Weight is the peer's consensus weight capped at MAX_VALIDATOR_WEIGHT_FRACTION.

        Parameters
        ----------
        epoch : int
            The epoch to select validators for.

        Returns
        -------
        list[ValidatorInfo]
            Sorted list of eligible validators with normalized weights.
        """
        self._trust.set_epoch(epoch)

        candidates: list[ValidatorInfo] = []
        for node_id in self._trust.all_peer_ids():
            info = self._trust.compute_peer_trust(node_id)
            trust_score = info["trust"]

            if trust_score < config.PARTICIPANT_TRUST_THRESHOLD:
                continue
            if info.get("epochs_active", 0) < config.MIN_VALIDATOR_EPOCHS:
                continue
            skills = info.get("published_skills", 0) + info.get("validated_skills", 0)
            if skills < config.MIN_VALIDATOR_SKILLS:
                continue

            candidates.append(ValidatorInfo(
                node_id=node_id,
                trust=trust_score,
                weight=self._trust.compute_consensus_weight(node_id),
                joined_epoch=info.get("joined_epoch", 0),
                published_skills=info.get("published_skills", 0),
                validated_skills=info.get("validated_skills", 0),
            ))

        # Normalize weights
        total_weight = sum(v.weight for v in candidates)
        if total_weight > 0:
            for v in candidates:
                v.weight = v.weight / total_weight

        # Sort by weight descending
        candidates.sort(key=lambda v: v.weight, reverse=True)

        self._epoch_validators[epoch] = candidates

        # Generate epoch seed
        seed_input = f"epoch:{epoch}:" + ":".join(v.node_id for v in candidates)
        self._epoch_seeds[epoch] = hashlib.sha256(seed_input.encode()).digest()

        logger.info(
            "Epoch %d: %d validators selected, total_weight=%.3f",
            epoch, len(candidates), total_weight,
        )

        return candidates

    def get_validators(self, epoch: int) -> list[ValidatorInfo]:
        """Get the validator set for a given epoch.

        Parameters
        ----------
        epoch : int
            The epoch to query.

        Returns
        -------
        list[ValidatorInfo]
            Validators for this epoch (empty if not yet selected).
        """
        return self._epoch_validators.get(epoch, [])

    # ── Leader Selection ──

    def get_slot_leader(self, epoch: int, slot: int) -> Optional[str]:
        """Deterministically select the block proposer for a slot.

        Uses hash(epoch_seed + slot) to index into the validator set,
        weighted by trust-derived voting power.

        Parameters
        ----------
        epoch : int
            The current epoch.
        slot : int
            The slot within the epoch.

        Returns
        -------
        str or None
            The node_id of the selected leader, or None if no validators.
        """
        validators = self._epoch_validators.get(epoch, [])
        if not validators:
            return None

        seed = self._epoch_seeds.get(epoch, b"")
        slot_hash = hashlib.sha256(seed + slot.to_bytes(8, "big")).digest()
        selection_value = int.from_bytes(slot_hash[:8], "big")

        # Weighted selection: accumulate weights until we pass the selection point
        total_weight = sum(v.weight for v in validators)
        if total_weight <= 0:
            return validators[0].node_id

        target = (selection_value % 10000) / 10000.0 * total_weight
        cumulative = 0.0
        for v in validators:
            cumulative += v.weight
            if cumulative >= target:
                return v.node_id

        return validators[-1].node_id

    # ── Slot Lifecycle ──

    def start_slot(self, epoch: int, slot: int) -> SlotState:
        """Initialize a new consensus slot.

        Parameters
        ----------
        epoch : int
            The current epoch.
        slot : int
            The slot number within the epoch.

        Returns
        -------
        SlotState
            The initialized slot state.
        """
        key = (epoch, slot)
        leader = self.get_slot_leader(epoch, slot)
        state = SlotState(
            slot=slot,
            epoch=epoch,
            phase=ConsensusPhase.PROPOSE,
            proposer_id=leader or "",
        )
        self._slots[key] = state
        return state

    def receive_proposal(
        self, epoch: int, slot: int, proposer: str, block_hash: str,
    ) -> bool:
        """Receive a block proposal from the slot leader.

        Parameters
        ----------
        epoch : int
            The current epoch.
        slot : int
            The slot number.
        proposer : str
            The proposer's node_id.
        block_hash : str
            Hash of the proposed block.

        Returns
        -------
        bool
            True if the proposal was accepted (valid leader, correct phase).
        """
        key = (epoch, slot)
        state = self._slots.get(key)
        if state is None:
            state = self.start_slot(epoch, slot)

        if state.phase != ConsensusPhase.PROPOSE:
            logger.debug("Proposal rejected: slot %d not in PROPOSE phase", slot)
            return False

        if proposer != state.proposer_id:
            logger.debug(
                "Proposal rejected: %s is not leader (expected %s)",
                proposer[:8], state.proposer_id[:8],
            )
            return False

        state.proposed_block_hash = block_hash
        state.phase = ConsensusPhase.PREVOTE
        state.phase_start_time = time.time()

        logger.debug("Slot %d/%d: proposal accepted from %s", epoch, slot, proposer[:8])
        return True

    def receive_prevote(
        self, epoch: int, slot: int, voter: str, block_hash: str,
    ) -> bool:
        """Receive a prevote for a proposed block.

        When prevotes reach 2/3 of total weight, the slot advances
        to the PRECOMMIT phase.

        Parameters
        ----------
        epoch : int
            The current epoch.
        slot : int
            The slot number.
        voter : str
            The voter's node_id.
        block_hash : str
            The block hash being voted for.

        Returns
        -------
        bool
            True if the prevote was accepted and potentially triggered phase advance.
        """
        key = (epoch, slot)
        state = self._slots.get(key)
        if state is None or state.phase != ConsensusPhase.PREVOTE:
            return False

        # Check voter is a validator
        weight = self._get_voter_weight(epoch, voter)
        if weight <= 0:
            return False

        # Check for duplicate vote
        if any(v.voter_id == voter for v in state.prevotes):
            return False

        state.prevotes.append(_VoteRecord(
            voter_id=voter,
            block_hash=block_hash,
            weight=weight,
        ))

        # Check supermajority
        agreeing_weight = sum(
            v.weight for v in state.prevotes if v.block_hash == block_hash
        )
        if agreeing_weight >= self.SUPERMAJORITY_FRACTION:
            state.phase = ConsensusPhase.PRECOMMIT
            state.phase_start_time = time.time()
            logger.debug(
                "Slot %d/%d: prevote supermajority (%.3f >= %.3f)",
                epoch, slot, agreeing_weight, self.SUPERMAJORITY_FRACTION,
            )

        return True

    def receive_precommit(
        self, epoch: int, slot: int, voter: str, block_hash: str,
    ) -> bool:
        """Receive a precommit for a proposed block.

        When precommits reach 2/3 of total weight, the block is committed.

        Parameters
        ----------
        epoch : int
            The current epoch.
        slot : int
            The slot number.
        voter : str
            The voter's node_id.
        block_hash : str
            The block hash being committed.

        Returns
        -------
        bool
            True if the precommit was accepted and potentially triggered commit.
        """
        key = (epoch, slot)
        state = self._slots.get(key)
        if state is None or state.phase != ConsensusPhase.PRECOMMIT:
            return False

        weight = self._get_voter_weight(epoch, voter)
        if weight <= 0:
            return False

        # Check for duplicate
        if any(v.voter_id == voter for v in state.precommits):
            return False

        state.precommits.append(_VoteRecord(
            voter_id=voter,
            block_hash=block_hash,
            weight=weight,
        ))

        # Check supermajority
        agreeing_weight = sum(
            v.weight for v in state.precommits if v.block_hash == block_hash
        )
        if agreeing_weight >= self.SUPERMAJORITY_FRACTION:
            state.committed_block_hash = block_hash
            state.phase = ConsensusPhase.COMMIT
            state.phase_start_time = time.time()
            logger.info(
                "Slot %d/%d: COMMITTED block %s (weight %.3f)",
                epoch, slot, block_hash[:16], agreeing_weight,
            )

        return True

    def is_committed(self, epoch: int, slot: int) -> bool:
        """Check if a slot has been committed."""
        key = (epoch, slot)
        state = self._slots.get(key)
        return state is not None and state.is_committed

    def get_committed_hash(self, epoch: int, slot: int) -> Optional[str]:
        """Get the committed block hash for a slot, if any."""
        key = (epoch, slot)
        state = self._slots.get(key)
        if state and state.is_committed:
            return state.committed_block_hash
        return None

    def get_slot_state(self, epoch: int, slot: int) -> Optional[SlotState]:
        """Get the full state of a consensus slot."""
        return self._slots.get((epoch, slot))

    # ── Helpers ──

    def _get_voter_weight(self, epoch: int, voter_id: str) -> float:
        """Get a voter's normalized weight for an epoch.

        Returns 0.0 if the voter is not a validator in this epoch.
        """
        validators = self._epoch_validators.get(epoch, [])
        for v in validators:
            if v.node_id == voter_id:
                return v.weight
        return 0.0

    def stats(self, epoch: int) -> dict:
        """Return consensus statistics for an epoch."""
        validators = self._epoch_validators.get(epoch, [])
        slots = {
            k: v for k, v in self._slots.items() if k[0] == epoch
        }
        committed = sum(1 for s in slots.values() if s.is_committed)
        return {
            "epoch": epoch,
            "validators": len(validators),
            "total_slots": len(slots),
            "committed_slots": committed,
            "top_validators": [
                {"node_id": v.node_id[:12], "weight": v.weight, "trust": v.trust}
                for v in validators[:5]
            ],
        }
