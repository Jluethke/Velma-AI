# Eval Dataset Builder

Build the evaluation dataset with representative and adversarial examples.

## Inputs

- `task-description`: What the model does
- `metric-set`: Metrics to evaluate

## Outputs

- `eval-dataset`: Evaluation dataset with gold labels
- `dataset-spec`: Coverage report and sampling methodology

## Process

1. Sample representative examples from production data.
2. Add adversarial and edge-case examples.
3. Create gold-standard labels for each example.
4. Validate coverage across important subgroups.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
