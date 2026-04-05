"""
inference.py
============

Runtime inference for SkillChain trust evaluation using the
retrained GovernanceNet.

Drop-in replacement for analytical trust computation.
Can run alongside analytical trust with most-restrictive-wins merge.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

from .features import SKILLCHAIN_FEATURE_ORDER, FEATURE_DIM, NodeHistory, extract_features
from .trainer import GovernanceNetTrainer

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TrustSignal:
    """Trust evaluation output from GovernanceNet."""
    trust_score: float      # [0, 1] -- higher is more trusted
    is_degraded: bool       # True if node is in degraded state
    is_unsafe: bool         # True if node should be excluded/quarantined


class SkillChainGovernanceNet:
    """
    Runtime inference using the retrained GovernanceNet.

    Uses the same 11->128->128->3 architecture as the original
    GovernanceNet from governance/neuroprin/governance_net.py,
    but with weights trained on network behavior features instead
    of vehicle dynamics features.
    """

    def __init__(self, weights_path: Optional[Path] = None):
        """
        Load trained weights.

        Parameters
        ----------
        weights_path : Path or None
            Path to weights file. Supports:
            - .json: JSON format from trainer.save_weights_json()
            - .bin: VELMAGNV binary format
            If None, attempts to load from default location.
        """
        self._weights: Optional[Dict[str, np.ndarray]] = None
        self._loaded = False

        if weights_path is not None:
            self.load(weights_path)

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def load(self, path: Path) -> bool:
        """Load weights from file."""
        path = Path(path)

        if not path.exists():
            logger.error("Weights file not found: %s", path)
            return False

        try:
            if path.suffix == ".json":
                self._weights = GovernanceNetTrainer.load_weights_json(path)
            elif path.suffix == ".bin":
                self._weights = self._load_velmagnv(path)
            else:
                logger.error("Unsupported weights format: %s", path.suffix)
                return False

            self._loaded = True
            logger.info("SkillChainGovernanceNet loaded from %s", path)
            return True

        except Exception as e:
            logger.error("Failed to load weights: %s", e)
            return False

    def _load_velmagnv(self, path: Path) -> Dict[str, np.ndarray]:
        """Load from VELMAGNV binary format."""
        import struct

        with open(path, "rb") as f:
            magic = f.read(8)
            if magic != b"VELMAGNV":
                raise ValueError(f"Invalid VELMAGNV magic: {magic}")

            count = struct.unpack("<Q", f.read(8))[0]
            raw = f.read(count * 4)
            params = np.frombuffer(raw, dtype=np.float32).copy()

        w = {}
        offset = 0

        # Encoder layer 0
        n = 128 * 11
        w["enc0_w"] = params[offset:offset + n].reshape(128, 11)
        offset += n
        w["enc0_b"] = params[offset:offset + 128].copy()
        offset += 128

        # Encoder layer 1
        n = 128 * 128
        w["enc1_w"] = params[offset:offset + n].reshape(128, 128)
        offset += n
        w["enc1_b"] = params[offset:offset + 128].copy()
        offset += 128

        # Output heads (undo 0.5x scaling)
        out_w = params[offset:offset + 3 * 128].reshape(3, 128) * 2.0
        offset += 3 * 128
        out_b = params[offset:offset + 3].copy() * 2.0
        offset += 3

        w["trust_w"] = out_w[0:1, :]
        w["degraded_w"] = out_w[1:2, :]
        w["unsafe_w"] = out_w[2:3, :]
        w["trust_b"] = out_b[0:1]
        w["degraded_b"] = out_b[1:2]
        w["unsafe_b"] = out_b[2:3]

        return w

    def _forward(self, features: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Forward pass through the network.

        Parameters
        ----------
        features : np.ndarray of shape (11,) or (N, 11)

        Returns
        -------
        dict with "trust", "degraded", "unsafe" arrays.
        """
        if not self._loaded or self._weights is None:
            raise RuntimeError("Model weights not loaded")

        w = self._weights
        x = np.atleast_2d(features).astype(np.float32)

        # Encoder layer 0: ReLU
        x = x @ w["enc0_w"].T + w["enc0_b"]
        x = np.maximum(x, 0.0)

        # Encoder layer 1: ReLU
        x = x @ w["enc1_w"].T + w["enc1_b"]
        x = np.maximum(x, 0.0)

        # Output heads with sigmoid
        def _sigmoid(z):
            pos = z >= 0
            result = np.empty_like(z)
            result[pos] = 1.0 / (1.0 + np.exp(-z[pos]))
            neg = ~pos
            ex = np.exp(z[neg])
            result[neg] = ex / (1.0 + ex)
            return result

        trust = _sigmoid(x @ w["trust_w"].T + w["trust_b"])
        degraded = _sigmoid(x @ w["degraded_w"].T + w["degraded_b"])
        unsafe = _sigmoid(x @ w["unsafe_w"].T + w["unsafe_b"])

        return {"trust": trust, "degraded": degraded, "unsafe": unsafe}

    def evaluate(self, features: List[float]) -> TrustSignal:
        """
        Evaluate a single 11-D feature vector.

        Parameters
        ----------
        features : list of 11 floats
            Network behavior feature vector in SKILLCHAIN_FEATURE_ORDER.

        Returns
        -------
        TrustSignal with trust_score, is_degraded, is_unsafe.
        """
        outputs = self._forward(np.array(features, dtype=np.float32))

        trust_score = float(outputs["trust"].item())
        is_degraded = bool(outputs["degraded"].item() > 0.5)
        is_unsafe = bool(outputs["unsafe"].item() > 0.5)

        return TrustSignal(
            trust_score=trust_score,
            is_degraded=is_degraded,
            is_unsafe=is_unsafe,
        )

    def evaluate_node(self, node_history: NodeHistory) -> TrustSignal:
        """
        Convenience: extract features from history, then evaluate.

        Parameters
        ----------
        node_history : NodeHistory
            Raw behavioral data for a node.

        Returns
        -------
        TrustSignal
        """
        features = extract_features(node_history)
        return self.evaluate(features)

    def evaluate_batch(self, features_batch: np.ndarray) -> List[TrustSignal]:
        """
        Evaluate a batch of feature vectors.

        Parameters
        ----------
        features_batch : np.ndarray of shape (N, 11)

        Returns
        -------
        List of N TrustSignal objects.
        """
        outputs = self._forward(features_batch)

        results = []
        for i in range(len(features_batch)):
            results.append(TrustSignal(
                trust_score=float(outputs["trust"][i, 0]),
                is_degraded=bool(outputs["degraded"][i, 0] > 0.5),
                is_unsafe=bool(outputs["unsafe"][i, 0] > 0.5),
            ))
        return results
