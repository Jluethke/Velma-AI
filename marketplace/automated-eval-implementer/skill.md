# Automated Eval Implementer

Implement automated evaluation pipelines.

## Inputs

- `metric-set`: Metrics to compute
- `eval-dataset`: Evaluation dataset

## Outputs

- `eval-pipeline`: Automated evaluation code and configuration
- `automated-results`: Baseline automated evaluation results

## Process

1. Implement each automatic metric as a scorer.
2. Build the evaluation pipeline to run all scorers.
3. Run the pipeline on the evaluation dataset.
4. Store baseline results for comparison.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
