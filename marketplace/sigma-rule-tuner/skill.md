# Sigma Rule Tuner

Tune the rule to reduce false positives while maintaining detection coverage.

## Inputs

- `test-results`: Detection rate and false positive rate
- `sample-matches`: Example matches from testing

## Outputs

- `tuned-sigma-rule`: Refined Sigma rule with improved precision
- `tuning-changelog`: Record of filter additions and their impact on metrics

## Process

1. Analyze false positive matches to identify common benign patterns
2. Add filter conditions to exclude the identified benign patterns
3. Re-test to verify false positives decreased without reducing true positive detection
4. Document each filter addition and its impact

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
