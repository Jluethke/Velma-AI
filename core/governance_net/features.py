"""
features.py
===========

11-D network behavior feature vector for SkillChain GovernanceNet.

Replaces the vehicle dynamics features from the original NeuroPRIN
contracts with network trust/behavior features suitable for
decentralized skill-sharing network governance.

Each feature is normalized to [0, 1].
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


# ============================================================
# Feature Definitions
# ============================================================

SKILLCHAIN_FEATURE_ORDER = [
    "validation_accuracy",        # 0: ratio of validations that agreed with consensus (0-1)
    "skill_quality_trend",        # 1: slope of recent skill success rates, mapped to (0-1)
    "trust_volatility",           # 2: std dev of trust score over last N evaluations (0-1)
    "transaction_velocity",       # 3: normalized tx count per epoch (0-1)
    "participation_consistency",  # 4: ratio of epochs active vs total epochs (0-1)
    "stake_activity_ratio",       # 5: stake amount / activity volume, normalized (0-1)
    "attestation_disagreement",   # 6: ratio of attestations that disagree with majority (0-1)
    "trust_projection_error",     # 7: |projected_trust - actual_trust| from TrustHorizon (0-1)
    "node_role_signal",           # 8: encoded role (0=consumer, 0.5=validator, 1=publisher)
    "time_since_failure",         # 9: normalized time since last failed validation (0-1, 1=long ago)
    "dispute_rate",               # 10: disputes initiated or received / total interactions (0-1)
]

FEATURE_DIM = len(SKILLCHAIN_FEATURE_ORDER)  # = 11


# ============================================================
# Node History Data Contract
# ============================================================

@dataclass
class NodeHistory:
    """
    Behavioral history for a single SkillChain node.

    All fields are raw values; extract_features() normalizes them.
    """
    # Validation
    validations_agreed: int = 0
    validations_total: int = 0

    # Skill quality (list of recent success rates, newest last)
    skill_success_rates: List[float] = field(default_factory=list)

    # Trust history (list of recent trust scores)
    trust_scores: List[float] = field(default_factory=list)

    # Activity
    transactions_this_epoch: int = 0
    max_transactions_per_epoch: int = 100  # normalization ceiling
    epochs_active: int = 0
    epochs_total: int = 1

    # Staking
    stake_amount: float = 0.0
    activity_volume: float = 0.0

    # Attestations
    attestations_disagreed: int = 0
    attestations_total: int = 0

    # Trust projection
    projected_trust: float = 0.0
    actual_trust: float = 0.0

    # Role: "consumer", "validator", or "publisher"
    role: str = "consumer"

    # Failure
    epochs_since_last_failure: int = 0
    max_failure_lookback: int = 100  # normalization ceiling

    # Disputes
    disputes: int = 0
    total_interactions: int = 0


# ============================================================
# Feature Extraction
# ============================================================

def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp value to [lo, hi]."""
    return max(lo, min(hi, value))


def extract_features(node_history: NodeHistory) -> List[float]:
    """
    Extract 11-D feature vector from a node's behavior history.

    All features are normalized to [0, 1].

    Parameters
    ----------
    node_history : NodeHistory
        Raw behavioral data for a node.

    Returns
    -------
    list of 11 floats, in SKILLCHAIN_FEATURE_ORDER.
    """
    h = node_history

    # 0: validation_accuracy
    if h.validations_total > 0:
        validation_accuracy = h.validations_agreed / h.validations_total
    else:
        validation_accuracy = 0.5  # unknown -> neutral

    # 1: skill_quality_trend (slope of recent success rates, mapped from [-1,1] to [0,1])
    if len(h.skill_success_rates) >= 2:
        rates = h.skill_success_rates[-10:]  # last 10
        n = len(rates)
        x_mean = (n - 1) / 2.0
        y_mean = sum(rates) / n
        num = sum((i - x_mean) * (r - y_mean) for i, r in enumerate(rates))
        den = sum((i - x_mean) ** 2 for i in range(n))
        slope = num / den if den > 0 else 0.0
        # slope is roughly in [-1, 1]; map to [0, 1]
        skill_quality_trend = _clamp((slope + 1.0) / 2.0)
    else:
        skill_quality_trend = 0.5  # neutral

    # 2: trust_volatility (std dev of recent trust scores)
    if len(h.trust_scores) >= 2:
        scores = h.trust_scores[-20:]
        mean_t = sum(scores) / len(scores)
        var_t = sum((s - mean_t) ** 2 for s in scores) / len(scores)
        trust_volatility = _clamp(var_t ** 0.5)
    else:
        trust_volatility = 0.0

    # 3: transaction_velocity
    max_tx = max(h.max_transactions_per_epoch, 1)
    transaction_velocity = _clamp(h.transactions_this_epoch / max_tx)

    # 4: participation_consistency
    total_epochs = max(h.epochs_total, 1)
    participation_consistency = _clamp(h.epochs_active / total_epochs)

    # 5: stake_activity_ratio
    if h.activity_volume > 0:
        stake_activity_ratio = _clamp(h.stake_amount / h.activity_volume)
    else:
        stake_activity_ratio = 0.5 if h.stake_amount > 0 else 0.0

    # 6: attestation_disagreement
    if h.attestations_total > 0:
        attestation_disagreement = _clamp(h.attestations_disagreed / h.attestations_total)
    else:
        attestation_disagreement = 0.0

    # 7: trust_projection_error
    trust_projection_error = _clamp(abs(h.projected_trust - h.actual_trust))

    # 8: node_role_signal
    role_map = {"consumer": 0.0, "validator": 0.5, "publisher": 1.0}
    node_role_signal = role_map.get(h.role, 0.0)

    # 9: time_since_failure (normalized, 1 = long ago = good)
    max_lookback = max(h.max_failure_lookback, 1)
    time_since_failure = _clamp(h.epochs_since_last_failure / max_lookback)

    # 10: dispute_rate
    if h.total_interactions > 0:
        dispute_rate = _clamp(h.disputes / h.total_interactions)
    else:
        dispute_rate = 0.0

    return [
        validation_accuracy,
        skill_quality_trend,
        trust_volatility,
        transaction_velocity,
        participation_consistency,
        stake_activity_ratio,
        attestation_disagreement,
        trust_projection_error,
        node_role_signal,
        time_since_failure,
        dispute_rate,
    ]
