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
SkillChain Protocol Layer — Decentralized AI Skill-Sharing Network.

Modules:
    config      — Network configuration constants
    identity    — Node identity (Ed25519 keypair, wallet address)
    discovery   — Kademlia DHT for peer discovery
    messages    — Extended message types and wire format
    trust       — Network ALG trust computation
    consensus   — Trust-weighted BFT consensus
    blocks      — Block structure, chain storage, state root
    validation  — Network SkillShadower (sandboxed skill validation)
    sybil       — Sybil detection heuristics

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

from .config import *  # noqa: F401,F403
from .identity import NodeIdentity
from .messages import MessageType, SignedMessage
from .trust import NetworkTrustModule, TrustAttestation
from .consensus import TrustWeightedBFT, ValidatorInfo
from .blocks import Block, BlockHeader, Transaction, ChainStore
from .validation import NetworkSkillShadower, ValidationProof
from .sybil import SybilDetector

__all__ = [
    "NodeIdentity",
    "MessageType",
    "SignedMessage",
    "NetworkTrustModule",
    "TrustAttestation",
    "TrustWeightedBFT",
    "ValidatorInfo",
    "Block",
    "BlockHeader",
    "Transaction",
    "ChainStore",
    "NetworkSkillShadower",
    "ValidationProof",
    "SybilDetector",
]
