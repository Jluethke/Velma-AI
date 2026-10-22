# Trade Study Alternative Generation

Generate a broad set of candidate solutions using morphological analysis to ensure the trade study does not prematurely converge on a narrow set of options.

## Inputs

- `design-problem`: The design decision to be made, stated as a function to be achieved with specific performance requirements
- `constraints`: Hard constraints that any acceptable solution must satisfy: regulatory, physical, interface, cost ceiling

## Outputs

- `morphological-chart`: Function decomposition into sub-functions, with multiple implementation options for each sub-function. Combinations of options across sub-functions generate candidate architectures.
- `candidate-list`: 3 to 7 candidate solutions, each described at sufficient detail to evaluate against the criteria, with infeasible combinations eliminated
- `pugh-matrix-results`: Quick screening using a Pugh matrix (one candidate as baseline, others rated better/same/worse on each criterion) to reduce candidates to the most promising 3 to 5 for detailed evaluation

## Process

1. Decompose the design function into independent sub-functions. For a power supply: voltage conversion, regulation, protection, thermal management, monitoring. For each sub-function, list at least 3 implementation options independent of the others. This is the morphological chart.
2. Generate candidate solutions by selecting one option per sub-function. Not all combinations are feasible (e.g., a topology that requires magnetic isolation is incompatible with a non-isolated thermal management approach). Eliminate physically impossible combinations and retain 5 to 10 candidates.
3. Run a Pugh matrix as a quick screen. Select one candidate as the baseline (usually the most conventional option). Rate every other candidate against the baseline on each evaluation criterion as better (+), same (S), or worse (-). Candidates with mostly worse ratings are eliminated. This reduces the field to 3 to 5 for detailed analysis.
4. Resist the temptation to start the trade study with only 2 candidates. Two-candidate studies degenerate into advocacy battles. The morphological approach forces consideration of architectures the team would not otherwise conceive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
