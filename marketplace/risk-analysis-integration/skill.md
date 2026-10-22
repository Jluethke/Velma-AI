# Risk Analysis Integration

Perform risk analysis per ISO 14971: identify hazards, estimate risk, evaluate acceptability, and define risk control measures that feed back into design inputs and verification requirements.

## Inputs

- `design-input-specifications`: Measurable requirements from design inputs
- `intended-use-statement`: Device intended use and use environment

## Outputs

- `risk-management-file`: Hazard analysis, risk estimation, risk evaluation, and risk control measures per ISO 14971
- `risk-derived-design-inputs`: New design inputs generated from risk control measures that must be added to the specification
- `residual-risk-assessment`: Assessment of residual risk after controls, with overall risk-benefit determination

## Process

1. Identify hazards systematically using the device's intended use and foreseeable misuse. Walk through each use scenario: unpacking, setup, normal use, cleaning, maintenance, disposal. For each, ask what can go wrong.
2. For each hazard, identify the hazardous situation (exposure pathway) and the harm. Estimate severity from clinical consequence (negligible, minor, serious, critical, catastrophic) and probability from the causal chain (not just frequency of the hazard but likelihood it reaches the patient).
3. Plot each risk on the risk acceptability matrix. Risks in the unacceptable region require risk control. Risks in the ALARP region require documented justification that further reduction is not practicable.
4. Design risk controls in priority order: inherent safety by design first (eliminate the hazard), then protective measures in the device (guards, alarms, interlocks), then information for safety (warnings, instructions) last.
5. For each risk control measure, create a new design input or modify an existing one. The control measure is not real until it appears in the design specification with a verification method.
6. After all controls are defined, estimate residual risk. Verify no new hazards were introduced by the controls. Document the overall residual risk and the risk-benefit analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
