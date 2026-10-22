# Prompt Benchmarker

Benchmark the final prompt against the baseline and produce the report.

## Inputs

- `guarded-prompt`: Final prompt with guardrails
- `test-results`: Earlier test results as baseline

## Outputs

- `benchmark-report`: Comparison of final prompt vs baseline
- `prompt-package`: Final prompt with all documentation

## Process

1. Run the final prompt against the full evaluation set.
2. Compare metrics to the baseline results.
3. Document the improvement on each scoring dimension.
4. Package the prompt with its rationale, rubric, and benchmark data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
