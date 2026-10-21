# Vendor Control Evaluator

Evaluate collected responses and evidence against control expectations and record findings where controls fall short.

## Inputs

- `completed-responses`: Vendor answers with completion status.
- `submitted-evidence`: Supporting documents linked to each answer.

## Outputs

- `control-evaluation`: Per-control rating of met, partially met, or not met with the evidence that supports the rating.
- `finding-list`: Specific control shortfalls with a short description and the affected data or system.

## Process

1. Compare each answer and its evidence to the expected control outcome.
2. Rate each control as met, partially met, or not met and cite the evidence.
3. Record a finding for every control that is partially met or not met.
4. Note where missing evidence prevents a rating and mark it for follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
