# Test Execution And Anomaly Resolution

Execute verification tests, handle anomalies through structured investigation, and determine retest scope after anomaly resolution.

## Inputs

- `test-procedures`: Approved test procedures
- `measurement-uncertainty-analysis`: Measurement uncertainty budgets
- `test-readiness-checklist`: Pre-test conditions

## Outputs

- `test-results`: Complete test data package with pass/fail status for each requirement, signed by the test engineer and witnessed by quality
- `anomaly-reports`: For each failure or anomaly: detailed description, conditions at time of occurrence, immediate containment action, root cause investigation results, corrective action, and retest plan
- `retest-scope`: After each anomaly resolution, the minimum set of tests that must be re-run to verify the fix without regressing other capabilities

## Process

1. Execute the test procedure step by step, recording all data in real time. Do not go back and fill in data from memory. If a step cannot be executed as written, stop and process a procedure deviation. Deviations may invalidate the test depending on their nature.
2. When a failure occurs, stop the test sequence and contain the anomaly. Record everything: what was measured, what was expected, the exact conditions (temperature, input stimulus, time into test), and any unusual observations (noise, smell, visual). Do not attempt to 'fix it and continue' without formal anomaly disposition.
3. Investigate the root cause using the 5-why method or fault tree analysis. The root cause must explain the observed failure completely. If the root cause is 'component X failed,' ask why it failed: was it overstressed, was it a manufacturing defect, was it a design margin issue? The corrective action must address the root cause, not the symptom.
4. Determine retest scope after the corrective action is implemented. If the fix changes only the failed function, retest only that function and any function that shares the changed hardware or software. If the fix changes a component that affects multiple functions (e.g., a power supply component), retest all functions that depend on that component. Err on the side of more retest rather than less.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
