# Discrepancy Classifier

Classify each discrepancy by its likely cause and severity: rounding, random seed, software version, undocumented step, or error.

## Inputs

- `discrepancy-list`: mismatched results with magnitudes
- `execution-log`: re-execution log with warnings and seed info
- `provenance-gaps`: undocumented pipeline steps

## Outputs

- `classified-discrepancies`: each discrepancy with cause category, severity (trivial/minor/major/critical), and confidence in classification
- `severity-summary`: count and distribution of discrepancies by severity

## Process

1. For each discrepancy, check whether it is explained by rounding differences or floating-point variation
2. Check whether a different random seed or software version explains it
3. Check whether an undocumented step in the provenance chain explains it
4. Classify the severity: trivial (rounding), minor (seed-dependent), major (unexplained but does not change conclusions), critical (changes a reported conclusion)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
