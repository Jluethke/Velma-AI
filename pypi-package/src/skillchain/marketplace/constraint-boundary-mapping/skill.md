# Constraint Boundary Mapping

Map a system's operational constraints and saturation boundaries from observed data. Identify saturation limits, rate limits, conditional gates, and fault boundaries. Produce a constraint map and the safe operating envelope where the linear model is valid.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load data including excursions to limits
REASON  --> Detect saturation, rate limits, gates, fault boundaries
PLAN    --> Compile constraint map, define operating envelope
ACT     --> Output constraint map and operating envelope
```

## Inputs

- `conditioned_data`: object -- Full input-output data including excursions to system limits
- `selected_model`: object -- Identified linear model for the nominal operating region

## Outputs

- `constraint_map`: list[object] -- Every identified constraint: type (saturation, rate limit, conditional gate, fault boundary), threshold value, evidence (number of observations, data source)
- `operating_envelope`: object -- The safe operating region where the model is valid and no constraints are active. Defined as input ranges per channel.

---

## Execution

### OBSERVE: Identify Limit Regions

1. Compare the model's linear predictions to the actual outputs across the full dataset.
2. Regions where the model predicts well (residual within noise) are inside the operating envelope.
3. Regions where the model's prediction diverges systematically from the actual output are at a constraint boundary.

### REASON: Classify Constraints

1. **Saturation.** Regions where the output stops changing despite increasing input. The output holds a constant value (the saturation limit) while the input continues to increase. Evidence: output derivative near zero while input derivative is nonzero.

2. **Rate limits.** Regions where the output rate of change is constant despite a large step input. The output follows a ramp (constant slope) instead of the model's predicted response. Evidence: output derivative is constant and independent of input magnitude.

3. **Conditional gates.** Regions where the output goes to zero (or a default value) regardless of input, conditioned on a third signal. Example: a command is accepted only when speed exceeds a threshold. Evidence: output tracks input when the gate signal is in one range, output is zero when the gate signal is in another range.

4. **Fault boundaries.** Input values beyond which the system enters a fault state and stops responding normally. Evidence: after exceeding the boundary, the output enters a distinct pattern (oscillation, zero, error code) and does not immediately return to normal.

### PLAN: Define the Envelope

1. Compile all identified constraints into a table: constraint type, affected signal, threshold, direction (upper/lower), evidence count.
2. The operating envelope is the intersection of all constraint-free regions: the input range where no constraint is active.
3. For each constraint, note whether it is reversible (system recovers when input returns below threshold) or latching (system stays in fault until reset).

### ACT: Deliver

1. Output the constraint map with all identified limits.
2. Output the operating envelope as a set of input ranges: min/max per channel for safe operation.
3. Flag any constraints that were observed only once (low confidence) vs multiple times (high confidence).

## Exit Criteria

1. Every region where model prediction diverges from actual data is explained by a constraint
2. The operating envelope is defined with input ranges
3. Constraint types are classified with evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
