# Morphological Alternative Generator

Generate design alternatives systematically using morphological analysis, exploring the full parameter space and eliminating infeasible combinations.

## Inputs

- `design-parameters`: Independent design dimensions (e.g., power source, material, architecture type, cooling method)
- `constraints`: Hard constraints that eliminate certain parameter combinations

## Outputs

- `morphological-matrix`: Parameter matrix with options per parameter
- `feasible-alternatives`: Reduced set of alternatives after cross-consistency assessment eliminates infeasible combinations

## Process

1. Build the morphological matrix: rows are design parameters (independent dimensions of the solution space), columns are the possible options for each parameter. The total solution space is the product of options per parameter.
2. Perform cross-consistency assessment: for each pair of parameters, check whether each option combination is compatible. Mark incompatible pairs. Example: if power source = solar and location = underground, the combination is infeasible.
3. Eliminate all alternatives containing at least one infeasible pair. The remaining alternatives are the feasible set. Typically this reduces the solution space by 90% or more.
4. From the feasible set, select 3-7 representative alternatives for detailed evaluation. Include at least one low-risk/conventional option, one high-performance option, and one cost-optimized option. Avoid evaluating only similar alternatives.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
