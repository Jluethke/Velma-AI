# Model Structure Selection

Select candidate model structures for system identification based on the system's observed characteristics. Test linearity, estimate order and delay, and rank candidate structures from simplest to most complex.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load conditioned data and system context
REASON  --> Test linearity, estimate order and delay
PLAN    --> Rank candidate structures
ACT     --> Output ranked candidates and order estimates
```

## Inputs

- `conditioned_data`: object -- Cleaned input-output data from response-data-conditioning
- `system_context`: object -- Known physical constraints, expected order, known nonlinearities, operating range

## Outputs

- `candidate_structures`: list[object] -- Ranked list of model structures with rationale. Each: structure name, expected order, delay estimate, linearity assessment, suitability score.
- `order_estimates`: object -- System order estimated from correlation analysis and singular value decomposition.

---

## Execution

### OBSERVE: Characterize the System

1. **Compute impulse response estimate.** Cross-correlate input and output channels. The impulse response shape reveals: system order (decay rate), delay (peak lag), and stability (bounded or divergent).
2. **Test linearity.** Compare output at amplitude A and 2A. If the output at 2A is approximately 2x the output at A, the system is linear in that range. Significant deviation indicates nonlinearity. Quantify with a linearity index: ratio of actual output to expected linear output.
3. **Estimate delay.** The lag at which cross-correlation peaks is the system's pure transport delay.

### REASON: Estimate Order

1. **Hankel matrix SVD.** Construct the Hankel matrix from impulse response samples. Compute singular values. The number of significant singular values (above noise floor) estimates the system order.
2. **Autocorrelation decay.** The rate at which the output autocorrelation decays indicates the system's memory length. Exponential decay = low order. Slow decay = high order or oscillatory modes.
3. **Check for oscillatory modes.** If the impulse response oscillates, the system has complex poles. State-space models handle these more naturally than ARX.

### PLAN: Rank Candidates

1. **Start simple.** Rank candidates from lowest to highest complexity:
   - ARX (linear, deterministic noise): good when noise is small and system is linear
   - ARMAX (linear, stochastic noise): good when measurement noise is significant
   - State-space (linear, multi-output): good for multi-variable systems and oscillatory modes
   - Nonlinear (Hammerstein, Wiener, neural): only when linearity test fails
2. **Match to observations.** Score each candidate by how well it matches the observed characteristics:
   - Linear + low order + no oscillation = ARX
   - Linear + oscillatory = state-space
   - Nonlinear + known saturation = Hammerstein or piecewise-linear
3. **Include the simplest candidate that COULD work and one step more complex as backup.**

### ACT: Deliver

1. Output ranked candidate list with rationale per candidate.
2. Output order estimates with SVD evidence.
3. Recommend starting with the simplest candidate and escalating only if residuals show structure.

## Exit Criteria

1. At least 2 candidate structures are ranked
2. System order is estimated with evidence
3. Linearity assessment is quantified

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
