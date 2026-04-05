"""
governance_net -- GovernanceNet training pipeline for SkillChain trust inference.

Replaces vehicle dynamics features with network behavior features,
retrains the same 11->128->128->3 architecture (18,435 params).
"""

from .features import SKILLCHAIN_FEATURE_ORDER, FEATURE_DIM, extract_features
from .inference import SkillChainGovernanceNet, TrustSignal
from .config import TrainingConfig

__all__ = [
    "SKILLCHAIN_FEATURE_ORDER",
    "FEATURE_DIM",
    "extract_features",
    "SkillChainGovernanceNet",
    "TrustSignal",
    "TrainingConfig",
]
