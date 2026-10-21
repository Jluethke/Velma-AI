# Model Parameter Identifier

Catalog all model parameters, their physical meaning, nominal values, and plausible ranges.

## Inputs

- `model-description`: Documentation or code of the model to analyze
- `domain-knowledge`: Literature or expert input on parameter bounds

## Outputs

- `parameter-catalog`: Table of all parameters with name, nominal value, unit, and plausible range
- `parameter-count`: Total number of parameters and their grouping by subsystem

## Process

1. List every adjustable parameter in the model.
2. Record the nominal (baseline) value and physical unit for each.
3. Assign plausible minimum and maximum values from literature or expert judgment.
4. Group parameters by model subsystem for organized reporting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
