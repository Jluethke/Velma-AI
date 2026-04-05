"""Tests for features.py — feature extraction from node behavior history."""

import pytest

from skillchain.core.governance_net.features import (
    SKILLCHAIN_FEATURE_ORDER,
    FEATURE_DIM,
    NodeHistory,
    extract_features,
)


class TestFeatureDefinitions:
    def test_feature_count(self):
        assert FEATURE_DIM == 11

    def test_feature_order_length(self):
        assert len(SKILLCHAIN_FEATURE_ORDER) == 11

    def test_feature_names_unique(self):
        assert len(set(SKILLCHAIN_FEATURE_ORDER)) == 11


class TestExtractFeatures:
    def test_output_length(self):
        h = NodeHistory()
        features = extract_features(h)
        assert len(features) == 11

    def test_all_values_in_range(self):
        """All features should be in [0, 1]."""
        h = NodeHistory(
            validations_agreed=80,
            validations_total=100,
            skill_success_rates=[0.7, 0.8, 0.85, 0.9],
            trust_scores=[0.6, 0.7, 0.65, 0.72],
            transactions_this_epoch=50,
            epochs_active=8,
            epochs_total=10,
            stake_amount=100.0,
            activity_volume=200.0,
            attestations_disagreed=5,
            attestations_total=100,
            projected_trust=0.75,
            actual_trust=0.80,
            role="validator",
            epochs_since_last_failure=30,
            disputes=3,
            total_interactions=100,
        )
        features = extract_features(h)
        for i, val in enumerate(features):
            assert 0.0 <= val <= 1.0, (
                f"Feature {SKILLCHAIN_FEATURE_ORDER[i]} = {val} out of [0,1]"
            )

    def test_empty_history_defaults(self):
        """Empty history should produce valid features with neutral defaults."""
        h = NodeHistory()
        features = extract_features(h)
        assert len(features) == 11
        for i, val in enumerate(features):
            assert 0.0 <= val <= 1.0, (
                f"Feature {SKILLCHAIN_FEATURE_ORDER[i]} = {val} out of [0,1]"
            )

    def test_single_observation(self):
        """Single observation should not crash."""
        h = NodeHistory(
            validations_agreed=1,
            validations_total=1,
            skill_success_rates=[0.5],
            trust_scores=[0.6],
            transactions_this_epoch=1,
            epochs_active=1,
            epochs_total=1,
        )
        features = extract_features(h)
        assert len(features) == 11
        for val in features:
            assert 0.0 <= val <= 1.0

    def test_validation_accuracy(self):
        h = NodeHistory(validations_agreed=90, validations_total=100)
        features = extract_features(h)
        assert abs(features[0] - 0.9) < 0.01

    def test_zero_validations_neutral(self):
        h = NodeHistory(validations_agreed=0, validations_total=0)
        features = extract_features(h)
        assert features[0] == 0.5  # neutral

    def test_role_encoding(self):
        for role, expected in [("consumer", 0.0), ("validator", 0.5), ("publisher", 1.0)]:
            h = NodeHistory(role=role)
            features = extract_features(h)
            assert features[8] == expected, f"Role {role}: expected {expected}, got {features[8]}"

    def test_skill_quality_trend_improving(self):
        """Improving quality should give trend > 0.5."""
        h = NodeHistory(skill_success_rates=[0.3, 0.4, 0.5, 0.6, 0.7, 0.8])
        features = extract_features(h)
        assert features[1] > 0.5

    def test_skill_quality_trend_declining(self):
        """Declining quality should give trend < 0.5."""
        h = NodeHistory(skill_success_rates=[0.8, 0.7, 0.6, 0.5, 0.4, 0.3])
        features = extract_features(h)
        assert features[1] < 0.5

    def test_trust_volatility_stable(self):
        """Constant trust should give zero volatility."""
        h = NodeHistory(trust_scores=[0.7, 0.7, 0.7, 0.7, 0.7])
        features = extract_features(h)
        assert features[2] < 0.01

    def test_trust_volatility_unstable(self):
        """Wildly varying trust should give high volatility."""
        h = NodeHistory(trust_scores=[0.0, 1.0, 0.0, 1.0, 0.0, 1.0])
        features = extract_features(h)
        assert features[2] > 0.4

    def test_dispute_rate(self):
        h = NodeHistory(disputes=10, total_interactions=100)
        features = extract_features(h)
        assert abs(features[10] - 0.1) < 0.01

    def test_extreme_values_clamped(self):
        """Values that would exceed [0,1] should be clamped."""
        h = NodeHistory(
            transactions_this_epoch=999,
            max_transactions_per_epoch=10,
            epochs_since_last_failure=999,
            max_failure_lookback=10,
        )
        features = extract_features(h)
        assert features[3] == 1.0  # clamped
        assert features[9] == 1.0  # clamped
