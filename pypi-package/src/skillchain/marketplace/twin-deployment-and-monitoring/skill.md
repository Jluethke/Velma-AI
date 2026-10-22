# Twin Deployment and Monitoring

Deploy a validated digital twin and set up accuracy monitoring against live data. Define the accuracy contract, drift detection, and re-identification triggers so the twin stays current.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load validated twin and deployment context
REASON  --> Define accuracy contract, interface specification
PLAN    --> Set up drift detection, define re-identification triggers
ACT     --> Output deployment package and monitoring plan
```

## Inputs

- `validated_twin`: object -- The accepted digital twin with accuracy metrics per domain
- `deployment_context`: string -- How the twin will be used: offline simulation, real-time shadow mode, or predictive testing

## Outputs

- `deployment_package`: object -- The twin as a callable model with: input/output interface specification, accuracy contract, valid operating envelope, and usage instructions
- `drift_detection_plan`: object -- How to monitor accuracy over time: comparison method, frequency, threshold for re-identification, data collection requirements

---

## Execution

### OBSERVE: Package the Twin

1. Define the input/output interface: what signals go in, what signals come out, at what rate, in what format.
2. Define the accuracy contract: the maximum allowable prediction error per output, derived from validation results.
3. Define the valid operating envelope: the input ranges where the twin is validated.

### REASON: Define Monitoring

1. The twin is only as current as its last validation. Physical systems change over time (wear, calibration drift, component aging). The twin must be monitored for drift.
2. Define the comparison method: periodically feed live data to the twin and compare predictions to actual outputs.
3. Define the comparison frequency: depends on how fast the system changes. Weekly for stable systems, daily for systems under active development.

### PLAN: Re-identification Triggers

1. **Prediction error exceeds the accuracy contract** for 3 consecutive comparison periods: collect new data and re-identify the affected domain model.
2. **New operating condition observed** (input values outside the validated envelope): the twin is extrapolating. Collect data in the new condition and extend the model.
3. **Physical change to the system** (component replaced, firmware updated, calibration changed): invalidates the entire twin. Full re-identification required.

### ACT: Deliver

1. Output the deployment package with interface spec, accuracy contract, and usage instructions.
2. Output the drift detection plan with comparison schedule, thresholds, and re-identification procedures.
3. Note: the twin is a living model, not a static artifact. It requires maintenance proportional to how fast the real system changes.

## Exit Criteria

1. The twin is packaged with a defined interface
2. The accuracy contract is documented
3. The drift detection plan is in place

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
