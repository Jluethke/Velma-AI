# Fea Correlation And Updating

Correlate extracted experimental modes with FEA predictions using MAC and frequency comparison, then update the FEA model to match test data.

## Inputs

- `modal-parameters`: Experimentally extracted natural frequencies, damping ratios, and mode shapes
- `pre-test-fea-modes`: FEA-predicted mode shapes and frequencies
- `structure-description`: Physical description of the test article

## Outputs

- `correlation-report`: MAC matrix, frequency comparison table, and cross-orthogonality check between test and FEA modes
- `updated-fea-model`: FEA model with parameters adjusted to match test data within acceptance criteria
- `validated-modal-model`: Final validated modal model suitable for design decisions and forced response prediction

## Process

1. Compute the Modal Assurance Criterion (MAC) matrix between experimental and FEA mode shapes. MAC values above 0.9 indicate good correlation for a mode pair. Off-diagonal MAC values above 0.1 suggest mode shape confusion or a model problem.
2. Compare natural frequencies: plot experimental vs FEA frequency for each paired mode. Compute percentage error. Acceptance criteria depend on application but typically 5% or better for the first several modes.
3. Compute cross-orthogonality if a mass matrix is available from FEA. Diagonal terms above 0.9 and off-diagonal terms below 0.1 indicate acceptable correlation. This is a stricter check than MAC because it accounts for mass distribution.
4. Identify discrepancies: modes with poor MAC or large frequency error point to specific model deficiencies. Low-frequency errors often indicate boundary condition or joint stiffness problems. High-frequency errors often indicate local stiffness or mass distribution issues.
5. Update the FEA model: adjust uncertain parameters (joint stiffness, material properties, boundary conditions) to improve correlation. Use sensitivity analysis to identify which parameters most affect the discrepant modes. Automated model updating via optimization (minimizing frequency and MAC error) can be used but requires physical constraints to avoid non-physical parameter values.
6. Recheck all modes after updating. Improving one mode must not degrade others. Document the final correlation metrics and the parameter changes made.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
