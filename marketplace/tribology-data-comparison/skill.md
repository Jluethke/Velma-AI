# Tribology Data Comparison

Compare friction and wear results across material pairs and conditions.

## Inputs

- `friction-time-series`: Friction data from all tests
- `wear-measurements`: Wear rates from all tests

## Outputs

- `comparison-table`: Friction coefficient and wear rate for each material pair and condition
- `ranking`: Materials ranked by tribological performance

## Process

1. Extract steady-state friction coefficient from each test (excluding the run-in period).
2. Tabulate friction coefficient and specific wear rate with standard deviations across replicates.
3. Rank materials by the performance metric most relevant to the application.
4. Identify any friction transitions, seizure events, or unexpected behavior.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
