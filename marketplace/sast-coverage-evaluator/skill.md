# Sast Coverage Evaluator

Evaluate static analysis coverage, rule sets, false positive rates, and developer adoption.

## Inputs

- `sdlc-security-map`: SDLC security map from integration review
- `sast-tool-config`: SAST tool configuration and scan history

## Outputs

- `sast-findings`: Gaps in SAST coverage and configuration
- `false-positive-rate`: Measured false positive rate and developer feedback

## Process

1. Inventory which repositories and languages are covered by SAST
2. Review rule sets enabled vs available for each language
3. Sample recent scan results and compute the false positive rate
4. Check whether SAST runs in CI and blocks merges on critical findings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
