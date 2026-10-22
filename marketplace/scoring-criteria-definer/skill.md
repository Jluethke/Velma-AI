# Scoring Criteria Definer

Define the scoring criteria and data inputs for the credit model.

## Inputs

- `target-population`: Borrower segment the model will score
- `available-data-fields`: Data fields available for scoring (bureau, application, behavioral)

## Outputs

- `scoring-criteria`: Selected criteria with definitions (payment history, utilization, length, mix, inquiries)
- `data-requirements`: Data sources and fields needed for each criterion

## Process

1. Select the criteria based on predictive power and data availability.
2. Define each criterion with measurement rules and data sources.
3. Document the exclusions and any criteria considered but rejected.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
