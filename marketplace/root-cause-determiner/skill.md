# Root Cause Determiner

Determine the root cause by combining the failure mode, material condition, and service history.

## Inputs

- `failure-mode`: Classified failure mode with evidence
- `specification-compliance`: Whether the material met its specification
- `service-history-summary`: Operating conditions and maintenance history

## Outputs

- `root-cause`: The root cause of the failure with the causal chain
- `contributing-factors`: Additional factors that contributed to or accelerated the failure

## Process

1. Construct the causal chain from root cause through contributing factors to failure
2. Distinguish between material deficiency, design deficiency, manufacturing defect, and service abuse
3. Evaluate whether the failure was predictable given the conditions
4. State the root cause with the supporting evidence from each analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
