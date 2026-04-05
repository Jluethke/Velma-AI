"""
evaluator.py
============

Evaluate trained GovernanceNet on held-out test data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import numpy as np


@dataclass
class EvalResult:
    """Evaluation metrics for GovernanceNet."""
    trust_mse: float
    degraded_accuracy: float
    unsafe_accuracy: float

    # Confusion matrices: [[TN, FP], [FN, TP]]
    degraded_confusion: List[List[int]]
    unsafe_confusion: List[List[int]]

    # Critical rates
    false_positive_rate: float   # good nodes falsely labeled unsafe
    false_negative_rate: float   # malicious nodes missed

    # Per-archetype breakdown (optional)
    per_class_metrics: Dict[str, Dict[str, float]] = field(default_factory=dict)


class GovernanceNetEvaluator:
    """Evaluate trained GovernanceNet model accuracy."""

    def evaluate(
        self,
        forward_fn,
        test_features: np.ndarray,
        test_labels: np.ndarray,
    ) -> EvalResult:
        """
        Evaluate model on test data.

        Parameters
        ----------
        forward_fn : callable
            Function that takes (N, 11) features and returns dict with
            "trust", "degraded", "unsafe" keys each of shape (N, 1).
        test_features : np.ndarray of shape (N, 11)
        test_labels : np.ndarray of shape (N, 3)
            Columns: [trust_score, is_degraded, is_unsafe]

        Returns
        -------
        EvalResult with all metrics.
        """
        outputs = forward_fn(test_features)

        # Trust MSE
        trust_pred = outputs["trust"].flatten()
        trust_target = test_labels[:, 0]
        trust_mse = float(np.mean((trust_pred - trust_target) ** 2))

        # Degraded classification
        degraded_pred = (outputs["degraded"].flatten() > 0.5).astype(int)
        degraded_target = test_labels[:, 1].astype(int)
        degraded_acc = float(np.mean(degraded_pred == degraded_target))
        degraded_cm = self._confusion_matrix(degraded_target, degraded_pred)

        # Unsafe classification
        unsafe_pred = (outputs["unsafe"].flatten() > 0.5).astype(int)
        unsafe_target = test_labels[:, 2].astype(int)
        unsafe_acc = float(np.mean(unsafe_pred == unsafe_target))
        unsafe_cm = self._confusion_matrix(unsafe_target, unsafe_pred)

        # False positive rate: good nodes (unsafe=0) labeled as unsafe
        # FPR = FP / (FP + TN)
        tn, fp = unsafe_cm[0]
        fn, tp = unsafe_cm[1]
        fpr = fp / max(fp + tn, 1)

        # False negative rate: malicious (unsafe=1) labeled as safe
        # FNR = FN / (FN + TP)
        fnr = fn / max(fn + tp, 1)

        return EvalResult(
            trust_mse=trust_mse,
            degraded_accuracy=degraded_acc,
            unsafe_accuracy=unsafe_acc,
            degraded_confusion=degraded_cm,
            unsafe_confusion=unsafe_cm,
            false_positive_rate=fpr,
            false_negative_rate=fnr,
        )

    @staticmethod
    def _confusion_matrix(
        y_true: np.ndarray, y_pred: np.ndarray,
    ) -> List[List[int]]:
        """
        Compute 2x2 confusion matrix.

        Returns [[TN, FP], [FN, TP]].
        """
        tn = int(np.sum((y_true == 0) & (y_pred == 0)))
        fp = int(np.sum((y_true == 0) & (y_pred == 1)))
        fn = int(np.sum((y_true == 1) & (y_pred == 0)))
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        return [[tn, fp], [fn, tp]]
