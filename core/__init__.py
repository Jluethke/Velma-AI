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
skillchain.core
===============

Foundational infrastructure for the SkillChain network.

Submodules
----------
protocol       P2P protocol layer — identity, trust, consensus, blocks, validation, sybil resistance.
governance_net ML-based governance — trust inference via neural network.
"""

from .protocol import (
    Block,
    BlockHeader,
    ChainStore,
    MessageType,
    NetworkSkillShadower,
    NetworkTrustModule,
    NodeIdentity,
    SignedMessage,
    SybilDetector,
    Transaction,
    TrustAttestation,
    TrustWeightedBFT,
    ValidationProof,
    ValidatorInfo,
)

__all__ = [
    # protocol
    "Block",
    "BlockHeader",
    "ChainStore",
    "MessageType",
    "NetworkSkillShadower",
    "NetworkTrustModule",
    "NodeIdentity",
    "SignedMessage",
    "SybilDetector",
    "Transaction",
    "TrustAttestation",
    "TrustWeightedBFT",
    "ValidationProof",
    "ValidatorInfo",
]
