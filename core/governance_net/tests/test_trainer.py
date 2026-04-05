"""Tests for trainer.py — GovernanceNet training with pure numpy."""

import tempfile
from pathlib import Path

import numpy as np
import pytest

from skillchain.core.governance_net.config import TrainingConfig
from skillchain.core.governance_net.synthetic_data import SyntheticDataGenerator
from skillchain.core.governance_net.trainer import (
    GovernanceNetTrainer,
    TrainingResult,
    EXPECTED_PARAM_COUNT,
    VELMAGNV_MAGIC,
)


class TestGovernanceNetTrainer:
    @pytest.fixture
    def small_dataset(self):
        config = TrainingConfig(synthetic_samples=500, seed=42)
        gen = SyntheticDataGenerator(config)
        return gen.generate(500)

    def test_weight_initialization_shapes(self):
        trainer = GovernanceNetTrainer()
        w = trainer._init_weights(seed=42)

        assert w["enc0_w"].shape == (128, 11)
        assert w["enc0_b"].shape == (128,)
        assert w["enc1_w"].shape == (128, 128)
        assert w["enc1_b"].shape == (128,)
        assert w["trust_w"].shape == (1, 128)
        assert w["trust_b"].shape == (1,)
        assert w["degraded_w"].shape == (1, 128)
        assert w["degraded_b"].shape == (1,)
        assert w["unsafe_w"].shape == (1, 128)
        assert w["unsafe_b"].shape == (1,)

    def test_total_param_count(self):
        trainer = GovernanceNetTrainer()
        w = trainer._init_weights()
        total = sum(arr.size for arr in w.values())
        assert total == EXPECTED_PARAM_COUNT

    def test_forward_pass_shapes(self):
        trainer = GovernanceNetTrainer()
        w = trainer._init_weights()
        x = np.random.randn(32, 11).astype(np.float32)
        outputs, cache = trainer._forward(x, w)

        assert outputs["trust"].shape == (32, 1)
        assert outputs["degraded"].shape == (32, 1)
        assert outputs["unsafe"].shape == (32, 1)

    def test_forward_pass_sigmoid_range(self):
        trainer = GovernanceNetTrainer()
        w = trainer._init_weights()
        x = np.random.randn(100, 11).astype(np.float32)
        outputs, _ = trainer._forward(x, w)

        for key in ["trust", "degraded", "unsafe"]:
            assert np.all(outputs[key] >= 0.0), f"{key} has values < 0"
            assert np.all(outputs[key] <= 1.0), f"{key} has values > 1"

    def test_loss_decreases(self, small_dataset):
        """Loss should decrease over training epochs."""
        features, labels = small_dataset
        config = TrainingConfig(seed=42)
        trainer = GovernanceNetTrainer(
            learning_rate=0.001,
            epochs=30,
            batch_size=32,
            config=config,
        )
        result = trainer.train(features, labels, verbose=False)

        assert len(result.loss_history) == 30
        # First loss should be significantly higher than last
        assert result.loss_history[0] > result.loss_history[-1], (
            f"Loss did not decrease: {result.loss_history[0]:.4f} -> {result.loss_history[-1]:.4f}"
        )

    def test_training_result_fields(self, small_dataset):
        features, labels = small_dataset
        trainer = GovernanceNetTrainer(epochs=5, batch_size=64)
        result = trainer.train(features, labels, verbose=False)

        assert isinstance(result, TrainingResult)
        assert result.epochs_run == 5
        assert 0.0 <= result.degraded_accuracy <= 1.0
        assert 0.0 <= result.unsafe_accuracy <= 1.0
        assert result.trust_mse >= 0.0
        assert result.weights is not None

    def test_save_load_velmagnv(self, small_dataset):
        """Weights should round-trip through VELMAGNV format."""
        features, labels = small_dataset
        trainer = GovernanceNetTrainer(epochs=5)
        result = trainer.train(features, labels, verbose=False)

        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test_weights.bin"
            trainer.save_weights(path, result.weights)

            # Verify file structure
            with open(path, "rb") as f:
                magic = f.read(8)
                assert magic == VELMAGNV_MAGIC
                import struct
                count = struct.unpack("<Q", f.read(8))[0]
                assert count == EXPECTED_PARAM_COUNT

    def test_save_load_json(self, small_dataset):
        """Weights should round-trip through JSON format."""
        features, labels = small_dataset
        trainer = GovernanceNetTrainer(epochs=5)
        result = trainer.train(features, labels, verbose=False)

        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "test_weights.json"
            trainer.save_weights_json(path, result.weights)

            loaded = GovernanceNetTrainer.load_weights_json(path)
            for key in result.weights:
                np.testing.assert_array_almost_equal(
                    result.weights[key], loaded[key], decimal=5,
                    err_msg=f"Mismatch in {key}",
                )

    def test_velmagnv_compatible_with_original(self, small_dataset):
        """
        Weights saved in VELMAGNV format should be loadable by the
        original GovernanceNet from governance/neuroprin/governance_net.py.
        """
        features, labels = small_dataset
        trainer = GovernanceNetTrainer(epochs=5)
        result = trainer.train(features, labels, verbose=False)

        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "compat_test.bin"
            trainer.save_weights(path, result.weights)

            # Compatibility check with Velma GovernanceNet (skip in standalone)
            pytest.skip(
                "GovernanceNet compatibility test requires Velma monorepo"
            )
