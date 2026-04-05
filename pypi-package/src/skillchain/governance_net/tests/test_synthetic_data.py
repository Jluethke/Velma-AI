"""Tests for synthetic_data.py — synthetic training data generation."""

import numpy as np
import pytest

from skillchain.governance_net.config import TrainingConfig
from skillchain.governance_net.synthetic_data import SyntheticDataGenerator


class TestSyntheticDataGenerator:
    def setup_method(self):
        self.config = TrainingConfig(synthetic_samples=1000, seed=42)
        self.gen = SyntheticDataGenerator(self.config)

    def test_correct_sample_count(self):
        features, labels = self.gen.generate(1000)
        assert features.shape[0] == 1000
        assert labels.shape[0] == 1000

    def test_correct_dimensions(self):
        features, labels = self.gen.generate(500)
        assert features.shape == (500, 11)
        assert labels.shape == (500, 3)

    def test_features_normalized(self):
        """All features should be in [0, 1]."""
        features, _ = self.gen.generate(2000)
        assert np.all(features >= 0.0), "Features below 0 found"
        assert np.all(features <= 1.0), "Features above 1 found"

    def test_trust_labels_in_range(self):
        """Trust labels should be in [0, 1]."""
        _, labels = self.gen.generate(2000)
        trust = labels[:, 0]
        assert np.all(trust >= 0.0)
        assert np.all(trust <= 1.0)

    def test_binary_labels_valid(self):
        """Degraded and unsafe labels should be 0 or 1."""
        _, labels = self.gen.generate(2000)
        degraded = labels[:, 1]
        unsafe = labels[:, 2]
        assert set(np.unique(degraded)).issubset({0.0, 1.0})
        assert set(np.unique(unsafe)).issubset({0.0, 1.0})

    def test_distribution_matches_config(self):
        """Archetype distribution should approximately match config."""
        features, labels = self.gen.generate(10000)

        # Malicious: degraded=1, unsafe=1
        n_malicious = np.sum((labels[:, 1] == 1) & (labels[:, 2] == 1))
        # Declining: degraded=1, unsafe=0
        n_declining = np.sum((labels[:, 1] == 1) & (labels[:, 2] == 0))
        # Honest + New: degraded=0, unsafe=0
        n_good = np.sum((labels[:, 1] == 0) & (labels[:, 2] == 0))

        total = len(labels)
        assert abs(n_malicious / total - 0.15) < 0.05
        assert abs(n_declining / total - 0.20) < 0.05
        assert abs(n_good / total - 0.65) < 0.05  # honest + new

    def test_reproducibility(self):
        """Same seed should produce same data."""
        gen1 = SyntheticDataGenerator(TrainingConfig(seed=123))
        gen2 = SyntheticDataGenerator(TrainingConfig(seed=123))
        f1, l1 = gen1.generate(100)
        f2, l2 = gen2.generate(100)
        np.testing.assert_array_equal(f1, f2)
        np.testing.assert_array_equal(l1, l2)

    def test_different_seeds_differ(self):
        """Different seeds should produce different data."""
        gen1 = SyntheticDataGenerator(TrainingConfig(seed=1))
        gen2 = SyntheticDataGenerator(TrainingConfig(seed=2))
        f1, _ = gen1.generate(100)
        f2, _ = gen2.generate(100)
        assert not np.array_equal(f1, f2)

    def test_malicious_nodes_have_low_trust(self):
        """Malicious samples should have trust < 0.25."""
        _, labels = self.gen.generate(5000)
        malicious_mask = (labels[:, 1] == 1) & (labels[:, 2] == 1)
        malicious_trust = labels[malicious_mask, 0]
        assert np.all(malicious_trust <= 0.25), (
            f"Max malicious trust: {malicious_trust.max()}"
        )

    def test_honest_nodes_have_high_trust(self):
        """Honest/good samples (not degraded, not unsafe) should have trust > 0.35."""
        _, labels = self.gen.generate(5000)
        good_mask = (labels[:, 1] == 0) & (labels[:, 2] == 0)
        good_trust = labels[good_mask, 0]
        assert np.all(good_trust >= 0.45), (
            f"Min good trust: {good_trust.min()}"
        )
