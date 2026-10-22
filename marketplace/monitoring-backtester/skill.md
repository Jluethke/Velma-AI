# Monitoring Backtester

Backtest the rules against historical data and tune to reduce false positives.

## Inputs

- `configured-rules`: Rules to test
- `threshold-documentation`: Current thresholds and basis

## Outputs

- `backtest-results`: Alert volumes, true positive rates, and false positive rates by rule
- `tuned-thresholds`: Adjusted thresholds based on backtest findings

## Process

1. Run each rule against 6 to 12 months of historical transaction data.
2. Measure the alert volume, true positive rate, and false positive rate.
3. Adjust thresholds to balance detection with manageable alert volumes.
4. Document the tuning rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
