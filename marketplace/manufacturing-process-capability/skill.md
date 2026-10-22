# Manufacturing Process Capability

Assess whether the chosen processes can hold the required tolerances repeatably, using capability indices and measurement-system checks.

## Inputs

- `tolerance-allocation`: The required tolerances per feature from the stackup
- `process-data`: Process variation data: historical or trial-run measurements of the features on the intended process

## Outputs

- `capability-assessment`: The capability index per critical feature against its tolerance, identifying features the process cannot hold
- `process-controls`: The controls needed where capability is marginal: tighter process, inspection, or a tolerance change

## Process

1. Compute the capability indices for each critical feature. Cp compares the tolerance width to the process spread (tolerance divided by six standard deviations); Cpk adds centering (the distance from the process mean to the nearer limit over three standard deviations). Cp tells you if the process is precise enough; Cpk tells you if it is also centered.
2. Judge against a capability target, not just greater than one. A Cpk of 1.0 implies roughly 2700 defects per million at the limits, which is usually not acceptable; common targets are Cpk of 1.33 (about 63 defects per million) for important features and 1.67 for critical ones. Set the target by the feature's consequence.
3. Verify the measurement system before trusting the capability number. Run a gauge repeatability and reproducibility (gauge R&R) study; if measurement variation consumes more than about 10 to 30% of the tolerance, the capability numbers are measuring the gauge, not the process. A bad gauge can make a good process look incapable or hide a bad one.
4. Separate the two fixes for an incapable feature. Low Cp means the process is too variable: change the process, tooling, or fixturing to shrink the spread. Low Cpk with adequate Cp means the process is off-center: re-center the setpoint. The corrective action differs, so diagnose which before acting.
5. Plan controls where capability stays marginal. Where a feature cannot reach the target economically, add in-process control (SPC charting), 100% inspection or a go/no-go gauge, or negotiate a tolerance change through the stackup. Carry these controls into the production plan rather than discovering them in first-article.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
