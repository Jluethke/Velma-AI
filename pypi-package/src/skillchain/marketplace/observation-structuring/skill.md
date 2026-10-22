# Observation Structuring

Structure raw observations of an unknown function into input-output pairs with metadata: measurement uncertainty, operating region labels, and boundary vs interior classification. Translate physical constraints into mathematical form for constrained fitting.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load raw measurements and known constraints
REASON  --> Pair inputs/outputs, assign uncertainty, classify regions
PLAN    --> Translate constraints, assess coverage
ACT     --> Output structured pairs and constraint set
```

## Inputs

- `observations`: list[object] -- Raw measurements of inputs and outputs. Each: timestamp, input value(s), output value(s), measurement source.
- `known_constraints`: list[object] -- Physical or logical constraints: monotonicity, bounds, symmetry, conservation laws, known derivative signs.

## Outputs

- `structured_pairs`: list[object] -- Input-output pairs with: uncertainty bounds, region label (boundary/interior), operating mode label
- `constraint_set`: list[object] -- Mathematical constraints: inequalities, equalities, derivative bounds, each in a form suitable for constrained optimization

---

## Execution

### OBSERVE: Pair and Characterize

1. Match each input measurement with its corresponding output measurement by timestamp alignment.
2. Assign measurement uncertainty from sensor specifications. If specifications are unavailable, estimate from the standard deviation of repeated measurements at the same input.
3. Classify each pair as boundary (input within 10% of the observed min or max) or interior.
4. If the function has distinct operating modes (visible as clusters in the data), label each pair with its mode.

### REASON: Translate Constraints

1. **Monotonicity:** "output increases with input" becomes a derivative sign constraint: df/dx >= 0 for all x in the domain.
2. **Bounds:** "output never exceeds Y" becomes an inequality: f(x) <= Y for all x.
3. **Symmetry:** "output is the same for +x and -x" becomes an equality: f(x) = f(-x).
4. **Conservation:** "sum of outputs equals a constant" becomes an equality constraint across the output channels.
5. **Rate limits:** "output changes by at most R per unit input" becomes a derivative bound: |df/dx| <= R.

### PLAN: Assess Coverage

1. Is there data across the full operating range? Plot input coverage: are there gaps where no observations exist?
2. Are there enough observations per operating region to determine the function's behavior there? Minimum: 5 points per region for a linear fit, 10+ for nonlinear.
3. Are boundary observations present? Without them, the function's behavior at the edges is unconstrained.
4. Flag under-covered regions as areas where the reconstructed function will have low confidence.

### ACT: Deliver

1. Output structured pairs: each with input, output, uncertainty, region label, mode label.
2. Output constraint set: each constraint in mathematical form with the physical rationale.
3. Report coverage: regions covered, regions sparse, recommendations for additional observations.

## Exit Criteria

1. Every observation is paired, labeled, and has uncertainty bounds
2. All known constraints are translated to mathematical form
3. Coverage assessment identifies any gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
