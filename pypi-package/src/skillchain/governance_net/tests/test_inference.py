"""Tests for inference.py — runtime inference for SkillChain nodes."""

import tempfile
from pathlib import Path

import numpy as np
import pytest

from skillchain.governance_net.config import TrainingConfig
from skillchain.governance_net.features import NodeHistory
from skillchain.governance_net.inference import SkillChainGovernanceNet, TrustSignal
from skillchain.governance_net.synthetic_data import SyntheticDataGenerator
from skillchain.governance_net.trainer import GovernanceNetTrainer


@pytest.fixture(scope="module")
def trained_model_path():
    """Train a model once and save it for all tests in this module."""
    config = TrainingConfig(synthetic_samples=5000, seed=42)
    gen = SyntheticDataGenerator(config)
    features, labels = gen.generate()

    trainer = GovernanceNetTrainer(
        learning_rate=0.001,
        epochs=50,
        batch_size=32,
        config=config,
    )
    result = trainer.train(features, labels, verbose=False)

    tmpdir = tempfile.mkdtemp()
    json_path = Path(tmpdir) / "test_model.json"
    bin_path = Path(tmpdir) / "test_model.bin"

    trainer.save_weights_json(json_path, result.weights)
    trainer.save_weights(bin_path, result.weights)

    return json_path, bin_path, result


class TestSkillChainGovernanceNet:
    def test_load_json(self, trained_model_path):
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)
        assert net.is_loaded

    def test_load_velmagnv(self, trained_model_path):
        _, bin_path, _ = trained_model_path
        net = SkillChainGovernanceNet(bin_path)
        assert net.is_loaded

    def test_evaluate_returns_trust_signal(self, trained_model_path):
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)
        features = [0.9, 0.6, 0.05, 0.5, 0.9, 0.7, 0.05, 0.05, 0.5, 0.9, 0.02]
        result = net.evaluate(features)
        assert isinstance(result, TrustSignal)
        assert 0.0 <= result.trust_score <= 1.0

    def test_honest_node_high_trust(self, trained_model_path):
        """An honest node should get high trust and not be flagged."""
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)

        honest_features = [
            0.95,  # validation_accuracy
            0.65,  # skill_quality_trend (stable/improving)
            0.03,  # trust_volatility (low)
            0.5,   # transaction_velocity
            0.95,  # participation_consistency
            0.7,   # stake_activity_ratio
            0.02,  # attestation_disagreement
            0.03,  # trust_projection_error
            0.5,   # node_role_signal (validator)
            0.95,  # time_since_failure
            0.01,  # dispute_rate
        ]
        result = net.evaluate(honest_features)
        assert result.trust_score > 0.6, f"Honest node trust too low: {result.trust_score}"
        assert not result.is_unsafe, "Honest node flagged as unsafe"

    def test_malicious_node_low_trust(self, trained_model_path):
        """A malicious node should get low trust and be flagged."""
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)

        malicious_features = [
            0.15,  # validation_accuracy (low)
            0.1,   # skill_quality_trend (declining)
            0.7,   # trust_volatility (high)
            0.9,   # transaction_velocity (burst)
            0.15,  # participation_consistency (erratic)
            0.05,  # stake_activity_ratio (freeloading)
            0.8,   # attestation_disagreement (high)
            0.7,   # trust_projection_error (high)
            0.0,   # node_role_signal (consumer)
            0.05,  # time_since_failure (recent)
            0.6,   # dispute_rate (high)
        ]
        result = net.evaluate(malicious_features)
        assert result.trust_score < 0.4, f"Malicious node trust too high: {result.trust_score}"
        assert result.is_unsafe, "Malicious node NOT flagged as unsafe"

    def test_evaluate_node_from_history(self, trained_model_path):
        """evaluate_node() should work with a NodeHistory object."""
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)

        history = NodeHistory(
            validations_agreed=95,
            validations_total=100,
            skill_success_rates=[0.8, 0.82, 0.85, 0.87, 0.9],
            trust_scores=[0.8, 0.82, 0.81, 0.83, 0.82],
            transactions_this_epoch=40,
            epochs_active=9,
            epochs_total=10,
            stake_amount=500.0,
            activity_volume=800.0,
            attestations_disagreed=2,
            attestations_total=100,
            projected_trust=0.82,
            actual_trust=0.83,
            role="validator",
            epochs_since_last_failure=80,
            disputes=1,
            total_interactions=200,
        )
        result = net.evaluate_node(history)
        assert isinstance(result, TrustSignal)
        assert result.trust_score > 0.5

    def test_evaluate_batch(self, trained_model_path):
        """Batch evaluation should return correct number of results."""
        json_path, _, _ = trained_model_path
        net = SkillChainGovernanceNet(json_path)

        batch = np.random.rand(10, 11).astype(np.float32)
        results = net.evaluate_batch(batch)
        assert len(results) == 10
        for r in results:
            assert isinstance(r, TrustSignal)
            assert 0.0 <= r.trust_score <= 1.0

    def test_json_and_bin_produce_same_output(self, trained_model_path):
        """JSON and VELMAGNV formats should produce identical inference results."""
        json_path, bin_path, _ = trained_model_path
        net_json = SkillChainGovernanceNet(json_path)
        net_bin = SkillChainGovernanceNet(bin_path)

        test_input = [0.5, 0.5, 0.1, 0.3, 0.7, 0.5, 0.1, 0.1, 0.5, 0.8, 0.05]
        r_json = net_json.evaluate(test_input)
        r_bin = net_bin.evaluate(test_input)

        assert abs(r_json.trust_score - r_bin.trust_score) < 0.01, (
            f"JSON={r_json.trust_score:.4f} vs BIN={r_bin.trust_score:.4f}"
        )

    def test_not_loaded_raises(self):
        """Evaluation without loaded weights should raise."""
        net = SkillChainGovernanceNet()
        with pytest.raises(RuntimeError, match="not loaded"):
            net.evaluate([0.5] * 11)

    def test_nonexistent_path_returns_false(self):
        net = SkillChainGovernanceNet()
        result = net.load(Path("/nonexistent/weights.json"))
        assert result is False
        assert not net.is_loaded
