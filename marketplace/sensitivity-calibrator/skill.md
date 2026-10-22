# Sensitivity Calibrator

Set the sensitivity: how many standard deviations from the baseline triggers an alert. Tighter thresholds catch more anomalies but generate more false positives. Looser thresholds miss subtle anomalies but avoid alert fatigue. The right sensitivity depends on the cost of missing an anomaly versus the cost of a false alarm.

## Inputs

- `threshold-type`: Static or dynamic
- `metric-to-monitor`: The metric, for context on the cost of errors

## Outputs

- `sensitivity-level`: The number of standard deviations for the alert threshold (e.g., 2.0, 2.5, 3.0)
- `expected-false-positive-rate`: How often the system will fire on normal data at this sensitivity

## Process

1. Assess the cost of a missed anomaly (false negative). For safety-critical metrics (medical, infrastructure), set tight thresholds (2 sigma, accepting 5% false positives). For business metrics, use moderate thresholds (2.5 sigma, about 1.2% false positives). For informational metrics, use loose thresholds (3 sigma, 0.3%).
2. Assess the cost of a false alarm. If each alert requires a human to investigate, false alarms are expensive and should be minimized. If alerts are logged for batch review, a higher false positive rate is tolerable.
3. Calculate the expected false positive rate: at 2 sigma, expect 1 false alarm per 20 measurements. At 3 sigma, expect 1 per 370 measurements. At the chosen sensitivity, compute the number of false alarms per week or month given the measurement frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
