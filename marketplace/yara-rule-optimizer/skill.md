# Yara Rule Optimizer

Optimize the YARA rule to reduce false positives and improve detection rate.

## Inputs

- `fp-analysis`: False positive analysis with causes
- `missed-samples`: Missed malware samples with analysis

## Outputs

- `optimized-yara-rule`: Refined YARA rule with improved precision and recall
- `optimization-changelog`: Record of changes made and their impact on detection metrics

## Process

1. Tighten patterns that caused false positives by adding context or constraints
2. Add alternative patterns to catch missed variants without broadening too much
3. Re-test against both corpora to verify improvement
4. Document every change and its effect on detection rate and false positive rate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
