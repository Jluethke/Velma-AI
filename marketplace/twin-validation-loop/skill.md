# Twin Validation Loop

Validate a digital twin against held-out observation data not used during identification. Compare predicted outputs to actual outputs per domain. Iterate on model structure for domains where prediction error exceeds measurement uncertainty.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load twin components and validation data
REASON  --> Predict on validation data, compute error per domain
PLAN    --> Diagnose weak domains, plan re-identification
ACT     --> Output validated twin or iterate
     \                                                /
      +--- Re-identify weak domains --- loop OBSERVE --+
```

## Inputs

- `domain_models`: list[object] -- Identified models per domain
- `switching_logic`: object -- Domain selection logic
- `validation_data`: list[object] -- Held-out observation data not used in identification

## Outputs

- `validated_twin`: object -- The digital twin with prediction accuracy metrics per domain and overall
- `remaining_gaps`: list[object] -- Operating conditions where prediction error exceeds tolerance, with the additional data or model changes needed to close them

---

## Execution

### OBSERVE: Prepare Validation Run

1. Feed the validation data's input channels to the twin.
2. Let the switching logic select the active domain model at each time step.
3. Record the twin's predicted outputs alongside the actual validation outputs.

### REASON: Score Accuracy

1. Per domain, compute:
   - Mean absolute error (MAE)
   - Root mean square error (RMSE)
   - Fit percentage: 100 * (1 - norm(error) / norm(actual - mean(actual)))
2. Compare each domain's error to the measurement uncertainty:
   - Error within uncertainty: the twin is as good as the measurement (accept)
   - Error exceeds uncertainty: the twin has a modeling deficiency (investigate)

### PLAN: Diagnose and Iterate

1. For each failing domain, diagnose the cause:
   - **Systematic bias** (error has a consistent sign): model structure is wrong or missing a term
   - **High variance** (error is random but large): model is underfit, needs more data or higher order
   - **Transition errors** (error spikes at domain boundaries): switching logic thresholds are wrong
2. If iteration is needed: adjust model structure in the weak domain, re-identify, and re-validate.
3. The loop terminates when all domains pass or no further improvement is possible with the available data.

### ACT: Deliver

1. Output the validated twin with accuracy metrics per domain and overall.
2. Output remaining gaps: domains that did not pass, with the specific data or structure change needed.

## Exit Criteria

1. Prediction error is within measurement uncertainty for all domains with sufficient data
2. Remaining gaps are documented with remediation plans
3. The twin's valid operating envelope is defined

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
