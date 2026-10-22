# Rca Analysis Executor

Apply root cause analysis tools to identify the root cause.

## Inputs

- `evidence-package`: Evidence and data
- `problem-definition`: Problem statement

## Outputs

- `cause-hypotheses`: Candidate root causes from analysis
- `analysis-artifacts`: Fishbone diagrams, fault trees, 5 Why chains

## Process

1. Build a fishbone (Ishikawa) diagram with all potential causes by category
2. Apply 5 Why analysis to drill down from each potential cause
3. Build a fault tree for complex failures with multiple contributing factors
4. Narrow to the most likely root causes based on evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
