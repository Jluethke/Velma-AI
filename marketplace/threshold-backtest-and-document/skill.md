# Threshold Backtest And Document

Test the thresholds against historical data and produce the configuration document.

## Inputs

- `cooldown-config`: Cool-down and dedup configuration
- `grouping-rules`: Alert grouping rules

## Outputs

- `backtest-results`: Results of running the thresholds against historical data (fires, false positives, missed events)
- `threshold-configuration-document`: Final configuration document with all metrics, thresholds, channels, and cool-down settings

## Process

1. Run each threshold rule against the historical data to see how many times it would have fired.
2. Compare the fires against known incidents to calculate the true positive and false positive rates.
3. Adjust any thresholds that produce too many false positives or miss known incidents.
4. Compile the final configuration document with all settings, backtest results, and the tuning rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
