"""
trainer.py
==========

Pure-numpy training for GovernanceNet (11->128->128->3 heads).

Implements forward pass, backpropagation, and Adam optimizer
without any PyTorch/TensorFlow dependency.

The trained weights are compatible with the existing GovernanceNet
inference code in governance/neuroprin/governance_net.py.
"""

from __future__ import annotations

import json
import struct
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np

from .config import TrainingConfig

logger = logging.getLogger(__name__)

VELMAGNV_MAGIC = b"VELMAGNV"
EXPECTED_PARAM_COUNT = 18_435


# ============================================================
# Training Result
# ============================================================

@dataclass
class TrainingResult:
    """Result of a training run."""
    final_loss: float
    trust_mse: float
    degraded_accuracy: float
    unsafe_accuracy: float
    epochs_run: int
    weights: Dict[str, np.ndarray]
    loss_history: list = field(default_factory=list)


# ============================================================
# Numpy Utilities
# ============================================================

def _sigmoid(x: np.ndarray) -> np.ndarray:
    """Numerically stable sigmoid."""
    pos = x >= 0
    result = np.empty_like(x)
    result[pos] = 1.0 / (1.0 + np.exp(-x[pos]))
    neg = ~pos
    ex = np.exp(x[neg])
    result[neg] = ex / (1.0 + ex)
    return result


def _sigmoid_deriv(sigmoid_output: np.ndarray) -> np.ndarray:
    """Derivative of sigmoid given its output."""
    return sigmoid_output * (1.0 - sigmoid_output)


def _relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0.0)


def _relu_deriv(x: np.ndarray) -> np.ndarray:
    return (x > 0).astype(np.float32)


def _bce_loss(pred: np.ndarray, target: np.ndarray) -> float:
    """Binary cross-entropy loss, numerically stable."""
    eps = 1e-7
    pred = np.clip(pred, eps, 1.0 - eps)
    return -np.mean(target * np.log(pred) + (1.0 - target) * np.log(1.0 - pred))


def _bce_grad(pred: np.ndarray, target: np.ndarray) -> np.ndarray:
    """Gradient of BCE with respect to pred (before sigmoid)."""
    eps = 1e-7
    pred = np.clip(pred, eps, 1.0 - eps)
    return (pred - target) / (pred * (1.0 - pred) + eps)


# ============================================================
# Adam Optimizer State
# ============================================================

class AdamState:
    """Per-parameter Adam optimizer state."""

    def __init__(self, shape: tuple, beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8):
        self.m = np.zeros(shape, dtype=np.float32)
        self.v = np.zeros(shape, dtype=np.float32)
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.t = 0

    def update(self, param: np.ndarray, grad: np.ndarray, lr: float) -> np.ndarray:
        self.t += 1
        self.m = self.beta1 * self.m + (1.0 - self.beta1) * grad
        self.v = self.beta2 * self.v + (1.0 - self.beta2) * (grad ** 2)
        m_hat = self.m / (1.0 - self.beta1 ** self.t)
        v_hat = self.v / (1.0 - self.beta2 ** self.t)
        return param - lr * m_hat / (np.sqrt(v_hat) + self.eps)


# ============================================================
# Trainer
# ============================================================

class GovernanceNetTrainer:
    """
    Train GovernanceNet using backpropagation in pure numpy.

    Architecture: 11 -> 128 (ReLU) -> 128 (ReLU) -> 3 heads (sigmoid each)
    Loss: MSE for trust head, BCE for degraded/unsafe heads.
    Optimizer: Adam.
    """

    def __init__(
        self,
        learning_rate: float = 0.001,
        epochs: int = 100,
        batch_size: int = 32,
        config: TrainingConfig | None = None,
    ):
        self.config = config or TrainingConfig()
        self.lr = learning_rate
        self.epochs = epochs
        self.batch_size = batch_size
        self._weights: Optional[Dict[str, np.ndarray]] = None

    def _init_weights(self, seed: int = 42) -> Dict[str, np.ndarray]:
        """He initialization for ReLU layers, Xavier for output heads."""
        rng = np.random.RandomState(seed)

        w = {}
        # Encoder layer 0: (128, 11)
        w["enc0_w"] = (rng.randn(128, 11) * np.sqrt(2.0 / 11)).astype(np.float32)
        w["enc0_b"] = np.zeros(128, dtype=np.float32)

        # Encoder layer 1: (128, 128)
        w["enc1_w"] = (rng.randn(128, 128) * np.sqrt(2.0 / 128)).astype(np.float32)
        w["enc1_b"] = np.zeros(128, dtype=np.float32)

        # Trust head: (1, 128)
        w["trust_w"] = (rng.randn(1, 128) * np.sqrt(1.0 / 128)).astype(np.float32)
        w["trust_b"] = np.zeros(1, dtype=np.float32)

        # Degraded head: (1, 128)
        w["degraded_w"] = (rng.randn(1, 128) * np.sqrt(1.0 / 128)).astype(np.float32)
        w["degraded_b"] = np.zeros(1, dtype=np.float32)

        # Unsafe head: (1, 128)
        w["unsafe_w"] = (rng.randn(1, 128) * np.sqrt(1.0 / 128)).astype(np.float32)
        w["unsafe_b"] = np.zeros(1, dtype=np.float32)

        return w

    def _forward(
        self, x: np.ndarray, w: Dict[str, np.ndarray],
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """
        Forward pass. Returns (outputs, cache) for backprop.

        x shape: (batch, 11)
        """
        cache = {}

        # Layer 0: (batch, 11) @ (11, 128) + (128,) -> (batch, 128)
        z0 = x @ w["enc0_w"].T + w["enc0_b"]
        a0 = _relu(z0)
        cache["x_input"] = x
        cache["z0"] = z0
        cache["a0"] = a0

        # Layer 1: (batch, 128) @ (128, 128) + (128,) -> (batch, 128)
        z1 = a0 @ w["enc1_w"].T + w["enc1_b"]
        a1 = _relu(z1)
        cache["z1"] = z1
        cache["a1"] = a1

        # Trust head: (batch, 128) @ (128, 1) + (1,) -> (batch, 1)
        z_trust = a1 @ w["trust_w"].T + w["trust_b"]
        out_trust = _sigmoid(z_trust)
        cache["z_trust"] = z_trust
        cache["out_trust"] = out_trust

        # Degraded head
        z_degraded = a1 @ w["degraded_w"].T + w["degraded_b"]
        out_degraded = _sigmoid(z_degraded)
        cache["z_degraded"] = z_degraded
        cache["out_degraded"] = out_degraded

        # Unsafe head
        z_unsafe = a1 @ w["unsafe_w"].T + w["unsafe_b"]
        out_unsafe = _sigmoid(z_unsafe)
        cache["z_unsafe"] = z_unsafe
        cache["out_unsafe"] = out_unsafe

        outputs = {
            "trust": out_trust,
            "degraded": out_degraded,
            "unsafe": out_unsafe,
        }
        return outputs, cache

    def _compute_loss(
        self,
        outputs: Dict[str, np.ndarray],
        labels: np.ndarray,
    ) -> Tuple[float, Dict[str, float]]:
        """
        Compute combined loss.

        labels shape: (batch, 3) -> [trust, degraded, unsafe]
        """
        trust_target = labels[:, 0:1]
        degraded_target = labels[:, 1:2]
        unsafe_target = labels[:, 2:3]

        # MSE for trust
        trust_mse = np.mean((outputs["trust"] - trust_target) ** 2)

        # BCE for degraded and unsafe
        degraded_bce = _bce_loss(outputs["degraded"], degraded_target)
        unsafe_bce = _bce_loss(outputs["unsafe"], unsafe_target)

        total = (
            self.config.trust_loss_weight * trust_mse
            + self.config.degraded_loss_weight * degraded_bce
            + self.config.unsafe_loss_weight * unsafe_bce
        )

        return total, {
            "trust_mse": float(trust_mse),
            "degraded_bce": float(degraded_bce),
            "unsafe_bce": float(unsafe_bce),
        }

    def _backward(
        self,
        outputs: Dict[str, np.ndarray],
        cache: Dict[str, np.ndarray],
        labels: np.ndarray,
        w: Dict[str, np.ndarray],
    ) -> Dict[str, np.ndarray]:
        """Compute gradients via backpropagation."""
        batch_size = labels.shape[0]
        grads = {}

        trust_target = labels[:, 0:1]
        degraded_target = labels[:, 1:2]
        unsafe_target = labels[:, 2:3]

        a1 = cache["a1"]

        # --- Trust head gradient (MSE loss with sigmoid output) ---
        # d(MSE)/d(z) = d(MSE)/d(out) * d(out)/d(z)
        # d(MSE)/d(out) = 2/N * (out - target)
        # d(out)/d(z) = sigmoid_deriv
        d_trust_out = (2.0 / batch_size) * (outputs["trust"] - trust_target)
        d_trust_z = d_trust_out * _sigmoid_deriv(outputs["trust"])
        grads["trust_w"] = (d_trust_z.T @ a1) / batch_size
        grads["trust_b"] = np.mean(d_trust_z, axis=0)

        # --- Degraded head gradient (BCE loss) ---
        # For BCE with sigmoid: d(loss)/d(z) = (sigmoid(z) - target) / N
        d_degraded_z = (outputs["degraded"] - degraded_target) / batch_size
        grads["degraded_w"] = (d_degraded_z.T @ a1) / batch_size
        grads["degraded_b"] = np.mean(d_degraded_z, axis=0)

        # --- Unsafe head gradient (BCE loss) ---
        d_unsafe_z = (outputs["unsafe"] - unsafe_target) / batch_size
        grads["unsafe_w"] = (d_unsafe_z.T @ a1) / batch_size
        grads["unsafe_b"] = np.mean(d_unsafe_z, axis=0)

        # --- Backprop through encoder layer 1 ---
        # Gradient from all three heads into a1
        d_a1 = (
            d_trust_z @ w["trust_w"]
            + d_degraded_z @ w["degraded_w"]
            + d_unsafe_z @ w["unsafe_w"]
        )
        d_z1 = d_a1 * _relu_deriv(cache["z1"])
        grads["enc1_w"] = (d_z1.T @ cache["a0"]) / batch_size
        grads["enc1_b"] = np.mean(d_z1, axis=0)

        # --- Backprop through encoder layer 0 ---
        d_a0 = d_z1 @ w["enc1_w"]
        d_z0 = d_a0 * _relu_deriv(cache["z0"])
        grads["enc0_w"] = (d_z0.T @ cache["x_input"]) / batch_size
        grads["enc0_b"] = np.mean(d_z0, axis=0)

        return grads

    def train(
        self,
        features: np.ndarray,
        labels: np.ndarray,
        verbose: bool = True,
    ) -> TrainingResult:
        """
        Train the 11->128->128->3 network.

        Parameters
        ----------
        features : np.ndarray of shape (N, 11)
        labels : np.ndarray of shape (N, 3)
            Columns: [trust_score, is_degraded, is_unsafe]
        verbose : bool
            Print progress every 10 epochs.

        Returns
        -------
        TrainingResult with final metrics and trained weights.
        """
        features = features.astype(np.float32)
        labels = labels.astype(np.float32)

        w = self._init_weights(self.config.seed)

        # Initialize Adam states for each parameter
        adam_states = {
            key: AdamState(
                w[key].shape,
                beta1=self.config.adam_beta1,
                beta2=self.config.adam_beta2,
                eps=self.config.adam_epsilon,
            )
            for key in w
        }

        n_samples = len(features)
        loss_history = []
        rng = np.random.RandomState(self.config.seed + 1)

        for epoch in range(self.epochs):
            # Shuffle
            idx = rng.permutation(n_samples)
            features_shuffled = features[idx]
            labels_shuffled = labels[idx]

            epoch_loss = 0.0
            n_batches = 0

            for start in range(0, n_samples, self.batch_size):
                end = min(start + self.batch_size, n_samples)
                x_batch = features_shuffled[start:end]
                y_batch = labels_shuffled[start:end]

                # Forward
                outputs, cache = self._forward(x_batch, w)

                # Loss
                loss, _ = self._compute_loss(outputs, y_batch)
                epoch_loss += loss
                n_batches += 1

                # Backward
                grads = self._backward(outputs, cache, y_batch, w)

                # Adam update
                for key in w:
                    w[key] = adam_states[key].update(w[key], grads[key], self.lr)

            avg_loss = epoch_loss / max(n_batches, 1)
            loss_history.append(avg_loss)

            if verbose and ((epoch + 1) % 10 == 0 or epoch == 0):
                # Compute metrics on full dataset
                outputs_full, _ = self._forward(features, w)
                _, metrics = self._compute_loss(outputs_full, labels)

                degraded_pred = (outputs_full["degraded"] > 0.5).astype(float)
                degraded_acc = np.mean(degraded_pred == labels[:, 1:2]) * 100

                unsafe_pred = (outputs_full["unsafe"] > 0.5).astype(float)
                unsafe_acc = np.mean(unsafe_pred == labels[:, 2:3]) * 100

                logger.info(
                    "Epoch %d/%d: loss=%.4f, trust_mse=%.4f, degraded_acc=%.1f%%, unsafe_acc=%.1f%%",
                    epoch + 1, self.epochs, avg_loss,
                    metrics["trust_mse"], degraded_acc, unsafe_acc,
                )

        # Final metrics
        outputs_final, _ = self._forward(features, w)
        _, final_metrics = self._compute_loss(outputs_final, labels)

        degraded_pred = (outputs_final["degraded"] > 0.5).astype(float)
        degraded_acc = float(np.mean(degraded_pred == labels[:, 1:2]))

        unsafe_pred = (outputs_final["unsafe"] > 0.5).astype(float)
        unsafe_acc = float(np.mean(unsafe_pred == labels[:, 2:3]))

        self._weights = w

        return TrainingResult(
            final_loss=float(loss_history[-1]) if loss_history else 0.0,
            trust_mse=final_metrics["trust_mse"],
            degraded_accuracy=degraded_acc,
            unsafe_accuracy=unsafe_acc,
            epochs_run=self.epochs,
            weights=w,
            loss_history=loss_history,
        )

    # ================================================================
    # Weight Serialization
    # ================================================================

    def save_weights(self, path: Path, weights: Dict[str, np.ndarray]) -> None:
        """
        Save in VELMAGNV binary format (compatible with existing inference code).

        Layout matches governance_net.py exactly:
          - enc0_w (128*11), enc0_b (128)
          - enc1_w (128*128), enc1_b (128)
          - output heads stacked [trust, degraded, unsafe] with 0.5x scaling:
            out_w (3*128), out_b (3)
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        params = []
        params.append(weights["enc0_w"].flatten())
        params.append(weights["enc0_b"].flatten())
        params.append(weights["enc1_w"].flatten())
        params.append(weights["enc1_b"].flatten())

        # Stack output heads with 0.5x scaling (convention)
        out_w = np.vstack([
            weights["trust_w"],
            weights["degraded_w"],
            weights["unsafe_w"],
        ]) * 0.5
        out_b = np.concatenate([
            weights["trust_b"],
            weights["degraded_b"],
            weights["unsafe_b"],
        ]) * 0.5

        params.append(out_w.flatten())
        params.append(out_b.flatten())

        all_params = np.concatenate(params).astype(np.float32)

        assert len(all_params) == EXPECTED_PARAM_COUNT, (
            f"Expected {EXPECTED_PARAM_COUNT} params, got {len(all_params)}"
        )

        with open(path, "wb") as f:
            f.write(VELMAGNV_MAGIC)
            f.write(struct.pack("<Q", len(all_params)))
            f.write(all_params.tobytes())

        logger.info("Weights saved to VELMAGNV: %s (%d params)", path, len(all_params))

    def save_weights_json(self, path: Path, weights: Dict[str, np.ndarray]) -> None:
        """Save as JSON for easy inspection and loading."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        serializable = {}
        for key, arr in weights.items():
            serializable[key] = {
                "shape": list(arr.shape),
                "data": arr.flatten().tolist(),
            }

        with open(path, "w") as f:
            json.dump(serializable, f, indent=2)

        logger.info("Weights saved to JSON: %s", path)

    @staticmethod
    def load_weights_json(path: Path) -> Dict[str, np.ndarray]:
        """Load weights from JSON format."""
        with open(path) as f:
            data = json.load(f)

        weights = {}
        for key, val in data.items():
            weights[key] = np.array(val["data"], dtype=np.float32).reshape(val["shape"])

        return weights
