# Confidence Level Selector

Choose your tolerance for two types of error: false positives (concluding there is a signal when there is not) and false negatives (missing a real signal). The standard defaults are 5% false positive rate and 20% false negative rate, but you should choose consciously, not by default.

## Inputs

- `minimum-detectable-effect`: The effect size you are trying to detect
- `effect-rationale`: Why this effect matters, to calibrate the cost of errors

## Outputs

- `alpha-level`: The false positive rate you will tolerate (probability of seeing a signal that is not real)
- `beta-level`: The false negative rate you will tolerate (probability of missing a real signal)

## Process

1. Ask: what is the cost of a false positive (acting on noise)? If the cost is high (launching a product, changing a medication, making an investment), use alpha = 0.01. If moderate, use 0.05. If low (trying a new workout routine), 0.10 is fine.
2. Ask: what is the cost of a false negative (missing a real change)? If the cost is high (missing a safety issue, ignoring a disease), use beta = 0.10. If moderate, use 0.20. If low, 0.30 is acceptable.
3. Record the chosen levels and the reasoning. This is a judgment call, not a formula, and future reviewers need to know why you chose these values.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
