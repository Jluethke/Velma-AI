# Noisy Rule Tuner

Tune high-noise rules to reduce false positives without losing true positive detection.

## Inputs

- `noisy-rules`: Rules identified as high false-positive
- `rule-effectiveness-matrix`: Effectiveness data for comparison

## Outputs

- `tuned-rule-configs`: Updated rule configurations with changes documented
- `expected-noise-reduction`: Projected false positive reduction per tuned rule

## Process

1. For each noisy rule, analyze the false positive triggers to find common patterns
2. Adjust thresholds, add exclusions, or refine conditions to filter out false positives
3. Validate that the tuned rule still detects the original true positive scenarios
4. Document each change with before and after expected alert volumes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
