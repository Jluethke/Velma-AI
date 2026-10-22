# Experiment Report Writer

Produce the experiment report with the decision recommendation.

## Inputs

- `statistical-results`: Statistical analysis results
- `segment-analysis`: Segment-level results

## Outputs

- `experiment-report`: Final experiment report with recommendation
- `ship-decision`: Ship, iterate, or kill recommendation with rationale

## Process

1. Summarize the treatment effect on primary and guardrail metrics.
2. Highlight any notable segment differences.
3. Make the ship/iterate/kill recommendation with supporting evidence.
4. Document lessons learned for future experiments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
