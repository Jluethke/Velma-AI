"""
config.py
=========

Training and inference configuration for the SkillChain GovernanceNet.
"""

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class TrainingConfig:
    """All hyperparameters for GovernanceNet training."""

    # Architecture (must match governance_net.py)
    input_dim: int = 11
    hidden_dim: int = 128
    num_heads: int = 3  # trust, degraded, unsafe

    # Training
    learning_rate: float = 0.001
    epochs: int = 100
    batch_size: int = 32
    train_split: float = 0.8

    # Synthetic data
    synthetic_samples: int = 10_000

    # Adam optimizer
    adam_beta1: float = 0.9
    adam_beta2: float = 0.999
    adam_epsilon: float = 1e-8

    # Loss weighting
    trust_loss_weight: float = 1.0
    degraded_loss_weight: float = 1.0
    unsafe_loss_weight: float = 1.0

    # Archetype distribution for synthetic data
    archetype_distribution: Dict[str, float] = field(default_factory=lambda: {
        "honest": 0.40,
        "declining": 0.20,
        "malicious": 0.15,
        "new": 0.25,
    })

    # Random seed for reproducibility
    seed: int = 42
