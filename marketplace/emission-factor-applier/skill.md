# Emission Factor Applier

Apply emission factors to activity data to calculate greenhouse gas emissions.

## Inputs

- `activity-data-set`: Collected activity data by scope and category
- `data-gaps`: Data gaps and estimation methods

## Outputs

- `emissions-by-scope`: Calculated emissions in CO2e for each scope and category
- `methodology-notes`: Documentation of emission factors and calculation methods used

## Process

1. Select the appropriate emission factor database (EPA, DEFRA, IEA, or custom factors).
2. Apply emission factors to each activity data point, converting to CO2 equivalent.
3. Sum emissions by scope (1, 2, 3) and by category within each scope.
4. Document the emission factors, global warming potentials, and any assumptions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
