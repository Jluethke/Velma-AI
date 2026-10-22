# Multi-Domain Model Identification

Identify separate models for each operating domain (mode, region, or condition) from observation data. Assemble a single switched model where a selection function chooses the active domain model based on input or state signals.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load boundary spec and observation data
REASON  --> Segment by domain, identify per-domain models
PLAN    --> Determine switching conditions, validate each domain
ACT     --> Output domain models and switching logic
```

## Inputs

- `boundary_specification`: object -- System inputs and outputs from system-boundary-definition
- `observation_data`: list[object] -- Time-series of all boundary signals across multiple operating conditions

## Outputs

- `domain_models`: list[object] -- A fitted model per domain with: structure, parameters, valid input range, and fit metrics
- `switching_logic`: object -- The conditions that select which domain model is active: signal thresholds, hysteresis bands, mode flags

---

## Execution

### OBSERVE: Detect Domains

1. Plot the input-output relationship across the full dataset. Look for discontinuities, slope changes, or clustering that indicates multiple operating modes.
2. Segment the data at detected boundaries. Each segment is a candidate domain.
3. Verify that each domain has enough data for identification (minimum 50 samples for a linear model, 200+ for nonlinear).

### REASON: Identify Per-Domain

1. For each domain, apply system identification:
   - Use the model-structure-selection and parameter-estimation flows for each domain independently
   - Each domain may have a different model structure (one domain linear, another nonlinear)
2. Identify the switching conditions:
   - What signal value triggers a transition from domain A to domain B?
   - Is there hysteresis (different thresholds for entering vs leaving a domain)?
   - Is the switch based on an input signal, an output signal, or an internal state?

### PLAN: Validate

1. Validate each domain model against held-out data from the same domain.
2. Test the switching logic: does it correctly select the right domain model at domain boundaries?
3. Test transitions: when the system switches domains, does the switched model produce a smooth (or correctly discontinuous) output?

### ACT: Deliver

1. Output domain models: one per operating domain with all parameters.
2. Output switching logic: conditions, thresholds, hysteresis, and the signal that controls switching.
3. Report any domains with insufficient data for reliable identification.

## Exit Criteria

1. Each detected domain has a fitted model
2. Switching conditions are defined
3. Per-domain validation passes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
