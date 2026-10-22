# Design Verification Execution

Verify that design outputs meet design inputs through testing, analysis, and inspection. Each design input gets at least one verification activity with documented results.

## Inputs

- `design-input-specifications`: Requirements to verify against
- `design-output-package`: The device design to be verified
- `design-output-traceability`: Which outputs address which inputs

## Outputs

- `verification-test-reports`: Test reports for each verification activity with pass/fail results and raw data
- `verification-traceability`: Updated traceability matrix showing verification status for every design input

## Process

1. For each design input, select the verification method: test (measure against acceptance criteria), analysis (calculation or simulation with documented assumptions), or inspection (visual or dimensional check). Test is preferred when feasible.
2. Write test protocols before testing. Each protocol defines the test objective (which design input), test setup, sample size with statistical justification, procedure, acceptance criteria, and data recording forms.
3. Execute tests on design output samples that are representative of production. Document any deviations from the protocol. If a test fails, do not retest without root cause analysis and documented rationale.
4. For analysis-based verification, document the analysis method, assumptions, input data, calculations, and conclusion. If the analysis uses simulation (FEA, CFD), document the model validation.
5. Compile the verification traceability matrix. Every design input must show a completed verification activity with a pass/fail result. Any open item is a design gap that must be resolved before design transfer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
