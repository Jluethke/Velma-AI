"""
synthetic_data.py
=================

Generate labeled training data for GovernanceNet from simulated
node behavior archetypes.

Four archetypes:
  1. HONEST VALIDATOR   (40%) - high accuracy, stable, low disputes
  2. DECLINING NODE     (20%) - dropping quality, rising volatility
  3. MALICIOUS/SYBIL    (15%) - high disagreement, high disputes
  4. NEW/LEARNING NODE  (25%) - moderate accuracy, low participation
"""

from __future__ import annotations

from typing import List, Tuple, Dict

import numpy as np

from .config import TrainingConfig


class SyntheticDataGenerator:
    """Generate labeled training data for GovernanceNet."""

    def __init__(self, config: TrainingConfig | None = None):
        self.config = config or TrainingConfig()
        self.rng = np.random.RandomState(self.config.seed)

    def generate(
        self, num_samples: int | None = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate synthetic training data.

        Parameters
        ----------
        num_samples : int
            Total number of samples to generate.

        Returns
        -------
        features : np.ndarray of shape (N, 11)
        labels : np.ndarray of shape (N, 3)
            Columns: [trust_score, is_degraded, is_unsafe]
        """
        num_samples = num_samples or self.config.synthetic_samples
        dist = self.config.archetype_distribution

        counts = {
            "honest": int(num_samples * dist["honest"]),
            "declining": int(num_samples * dist["declining"]),
            "malicious": int(num_samples * dist["malicious"]),
        }
        counts["new"] = num_samples - sum(counts.values())

        all_features = []
        all_labels = []

        for archetype, count in counts.items():
            gen_fn = getattr(self, f"_generate_{archetype}")
            feats, labels = gen_fn(count)
            all_features.append(feats)
            all_labels.append(labels)

        features = np.vstack(all_features).astype(np.float32)
        labels = np.vstack(all_labels).astype(np.float32)

        # Shuffle
        idx = self.rng.permutation(len(features))
        return features[idx], labels[idx]

    # ================================================================
    # Archetype Generators
    # ================================================================

    def _generate_honest(self, n: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        HONEST VALIDATOR: high accuracy, stable trust, consistent participation.
        Label: trust=0.85-1.0, degraded=0, unsafe=0
        """
        features = np.zeros((n, 11), dtype=np.float32)

        # 0: validation_accuracy: 0.85-1.0
        features[:, 0] = self.rng.uniform(0.85, 1.0, n)
        # 1: skill_quality_trend: stable to improving (0.5-0.8)
        features[:, 1] = self.rng.uniform(0.5, 0.8, n)
        # 2: trust_volatility: low (0.0-0.1)
        features[:, 2] = self.rng.uniform(0.0, 0.1, n)
        # 3: transaction_velocity: moderate (0.3-0.8)
        features[:, 3] = self.rng.uniform(0.3, 0.8, n)
        # 4: participation_consistency: high (0.8-1.0)
        features[:, 4] = self.rng.uniform(0.8, 1.0, n)
        # 5: stake_activity_ratio: moderate-high (0.4-0.9)
        features[:, 5] = self.rng.uniform(0.4, 0.9, n)
        # 6: attestation_disagreement: low (0.0-0.1)
        features[:, 6] = self.rng.uniform(0.0, 0.1, n)
        # 7: trust_projection_error: low (0.0-0.1)
        features[:, 7] = self.rng.uniform(0.0, 0.1, n)
        # 8: node_role_signal: mostly validators (0.5) or publishers (1.0)
        features[:, 8] = self.rng.choice([0.5, 1.0], n, p=[0.6, 0.4])
        # 9: time_since_failure: long ago (0.7-1.0)
        features[:, 9] = self.rng.uniform(0.7, 1.0, n)
        # 10: dispute_rate: very low (0.0-0.05)
        features[:, 10] = self.rng.uniform(0.0, 0.05, n)

        # Add noise
        features += self.rng.normal(0, 0.05, features.shape).astype(np.float32)
        features = np.clip(features, 0.0, 1.0)

        # Labels
        labels = np.zeros((n, 3), dtype=np.float32)
        labels[:, 0] = self.rng.uniform(0.85, 1.0, n)  # trust
        labels[:, 1] = 0.0  # not degraded
        labels[:, 2] = 0.0  # not unsafe

        return features, labels

    def _generate_declining(self, n: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        DECLINING NODE: decreasing quality, rising volatility.
        Label: trust=0.4-0.7, degraded=1, unsafe=0
        """
        features = np.zeros((n, 11), dtype=np.float32)

        # 0: validation_accuracy: moderate-low (0.5-0.75)
        features[:, 0] = self.rng.uniform(0.5, 0.75, n)
        # 1: skill_quality_trend: declining (0.1-0.35)
        features[:, 1] = self.rng.uniform(0.1, 0.35, n)
        # 2: trust_volatility: moderate-high (0.2-0.5)
        features[:, 2] = self.rng.uniform(0.2, 0.5, n)
        # 3: transaction_velocity: inconsistent (0.1-0.5)
        features[:, 3] = self.rng.uniform(0.1, 0.5, n)
        # 4: participation_consistency: dropping (0.3-0.65)
        features[:, 4] = self.rng.uniform(0.3, 0.65, n)
        # 5: stake_activity_ratio: low-moderate (0.2-0.5)
        features[:, 5] = self.rng.uniform(0.2, 0.5, n)
        # 6: attestation_disagreement: moderate (0.15-0.35)
        features[:, 6] = self.rng.uniform(0.15, 0.35, n)
        # 7: trust_projection_error: moderate (0.15-0.4)
        features[:, 7] = self.rng.uniform(0.15, 0.4, n)
        # 8: node_role_signal: mixed
        features[:, 8] = self.rng.choice([0.0, 0.5, 1.0], n, p=[0.3, 0.5, 0.2])
        # 9: time_since_failure: recent (0.1-0.4)
        features[:, 9] = self.rng.uniform(0.1, 0.4, n)
        # 10: dispute_rate: moderate (0.1-0.3)
        features[:, 10] = self.rng.uniform(0.1, 0.3, n)

        # Add noise
        features += self.rng.normal(0, 0.08, features.shape).astype(np.float32)
        features = np.clip(features, 0.0, 1.0)

        # Labels
        labels = np.zeros((n, 3), dtype=np.float32)
        labels[:, 0] = self.rng.uniform(0.4, 0.7, n)  # trust
        labels[:, 1] = 1.0  # degraded
        labels[:, 2] = 0.0  # not unsafe

        return features, labels

    def _generate_malicious(self, n: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        MALICIOUS/SYBIL NODE: high disagreement, high disputes.
        Label: trust=0.0-0.2, degraded=1, unsafe=1
        """
        features = np.zeros((n, 11), dtype=np.float32)

        # 0: validation_accuracy: low (0.1-0.4)
        features[:, 0] = self.rng.uniform(0.1, 0.4, n)
        # 1: skill_quality_trend: declining or flat-low (0.0-0.25)
        features[:, 1] = self.rng.uniform(0.0, 0.25, n)
        # 2: trust_volatility: high (0.4-0.8)
        features[:, 2] = self.rng.uniform(0.4, 0.8, n)
        # 3: transaction_velocity: may be very high (sybil patterns) or very low
        features[:, 3] = np.where(
            self.rng.random(n) < 0.5,
            self.rng.uniform(0.8, 1.0, n),   # burst activity
            self.rng.uniform(0.0, 0.15, n),   # lurking
        )
        # 4: participation_consistency: erratic (0.1-0.4)
        features[:, 4] = self.rng.uniform(0.1, 0.4, n)
        # 5: stake_activity_ratio: very low (trying to freeload)
        features[:, 5] = self.rng.uniform(0.0, 0.15, n)
        # 6: attestation_disagreement: high (0.5-0.9)
        features[:, 6] = self.rng.uniform(0.5, 0.9, n)
        # 7: trust_projection_error: high (0.4-0.8)
        features[:, 7] = self.rng.uniform(0.4, 0.8, n)
        # 8: node_role_signal: mostly consumers (freeloading)
        features[:, 8] = self.rng.choice([0.0, 0.5], n, p=[0.8, 0.2])
        # 9: time_since_failure: very recent (0.0-0.15)
        features[:, 9] = self.rng.uniform(0.0, 0.15, n)
        # 10: dispute_rate: high (0.3-0.7)
        features[:, 10] = self.rng.uniform(0.3, 0.7, n)

        # Add noise
        features += self.rng.normal(0, 0.1, features.shape).astype(np.float32)
        features = np.clip(features, 0.0, 1.0)

        # Labels
        labels = np.zeros((n, 3), dtype=np.float32)
        labels[:, 0] = self.rng.uniform(0.0, 0.2, n)  # trust
        labels[:, 1] = 1.0  # degraded
        labels[:, 2] = 1.0  # unsafe

        return features, labels

    def _generate_new(self, n: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        NEW/LEARNING NODE: moderate accuracy, low participation, no disputes.
        Label: trust=0.5-0.7, degraded=0, unsafe=0
        """
        features = np.zeros((n, 11), dtype=np.float32)

        # 0: validation_accuracy: moderate (0.55-0.8)
        features[:, 0] = self.rng.uniform(0.55, 0.8, n)
        # 1: skill_quality_trend: improving (0.55-0.75)
        features[:, 1] = self.rng.uniform(0.55, 0.75, n)
        # 2: trust_volatility: moderate (0.05-0.25)
        features[:, 2] = self.rng.uniform(0.05, 0.25, n)
        # 3: transaction_velocity: low (0.05-0.3)
        features[:, 3] = self.rng.uniform(0.05, 0.3, n)
        # 4: participation_consistency: low (0.1-0.4) - new node
        features[:, 4] = self.rng.uniform(0.1, 0.4, n)
        # 5: stake_activity_ratio: moderate (0.3-0.6)
        features[:, 5] = self.rng.uniform(0.3, 0.6, n)
        # 6: attestation_disagreement: low (0.0-0.15)
        features[:, 6] = self.rng.uniform(0.0, 0.15, n)
        # 7: trust_projection_error: moderate (0.1-0.3)
        features[:, 7] = self.rng.uniform(0.1, 0.3, n)
        # 8: node_role_signal: mostly consumers
        features[:, 8] = self.rng.choice([0.0, 0.5], n, p=[0.7, 0.3])
        # 9: time_since_failure: n/a (high since no failures yet) (0.6-1.0)
        features[:, 9] = self.rng.uniform(0.6, 1.0, n)
        # 10: dispute_rate: none (0.0-0.02)
        features[:, 10] = self.rng.uniform(0.0, 0.02, n)

        # Add noise
        features += self.rng.normal(0, 0.06, features.shape).astype(np.float32)
        features = np.clip(features, 0.0, 1.0)

        # Labels
        labels = np.zeros((n, 3), dtype=np.float32)
        labels[:, 0] = self.rng.uniform(0.5, 0.7, n)  # trust
        labels[:, 1] = 0.0  # not degraded
        labels[:, 2] = 0.0  # not unsafe

        return features, labels
