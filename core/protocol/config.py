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
config.py — Network configuration constants for SkillChain protocol.

All tunable parameters live here so they can be overridden in tests
or alternative network deployments without touching protocol logic.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

# ── Block Timing ──
BLOCK_TIME_S: float = 6.0
BLOCKS_PER_EPOCH: int = 1000

# ── Peer Networking ──
HEARTBEAT_INTERVAL_S: float = 30.0
PEER_TIMEOUT_S: float = 120.0

# ── Kademlia DHT ──
DHT_K: int = 20          # k-bucket size
DHT_ALPHA: int = 3       # parallel lookups

# ── Trust Parameters (mirrors ALG exp-decay + EMA) ──
NETWORK_DECAY_GAIN: float = 5.0
NETWORK_EMA_ALPHA: float = 0.15

# ── Trust Thresholds ──
VALIDATOR_TRUST_THRESHOLD: float = 0.65
PARTICIPANT_TRUST_THRESHOLD: float = 0.40
PROBATION_TRUST_THRESHOLD: float = 0.20

# ── Skill Validation (mirrors SkillShadower) ──
SHADOW_RUN_COUNT: int = 5
GRADUATION_THRESHOLD: float = 0.75

# ── Consensus Safety ──
MAX_VALIDATOR_WEIGHT_FRACTION: float = 0.10

# ── Sybil Detection ──
MIN_TEMPORAL_SPREAD_S: float = 300.0
ATTESTATION_COOLDOWN_EPOCHS: int = 1
SIMILARITY_JACCARD_WEIGHT: float = 0.6
SIMILARITY_BIGRAM_WEIGHT: float = 0.4

# ── Message Freshness ──
MESSAGE_FRESHNESS_S: float = 60.0

# ── Validator Eligibility ──
MIN_VALIDATOR_EPOCHS: int = 3
MIN_VALIDATOR_SKILLS: int = 5
