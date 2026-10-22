# Sdm Experimental Correlation Mac

Correlate the analytical modes with measured modes using the modal assurance criterion and reconcile differences through model updating, so the model earns the right to predict untested conditions.

## Inputs

- `mode-shapes`: The analytical mode shapes to be correlated
- `natural-frequencies`: The analytical frequencies compared against test

## Outputs

- `correlation-matrix`: The modal assurance criterion matrix pairing analytical and test modes with frequency differences
- `model-update-actions`: The parameter adjustments that reconcile the model to test, with the physical justification for each

## Process

1. Compute the modal assurance criterion between each analytical mode and each test mode. MAC(a, x) = |phi_a^T*phi_x|^2 / ((phi_a^T*phi_a)*(phi_x^T*phi_x)), a number from 0 to 1 that measures the shape consistency between the analytical vector phi_a and the test vector phi_x at the measured degrees of freedom. A MAC above about 0.9 indicates well-correlated mode shapes and below about 0.1 indicates independent shapes.
2. Read the MAC matrix for pairing and problems. The ideal matrix is near-identity: each analytical mode pairs with one test mode at high MAC and is near zero elsewhere. Off-diagonal high values mean two modes are being confused (often from too few measurement points), and a low diagonal value means a mode shape the model gets wrong.
3. Compare paired frequencies alongside the MAC. For each well-paired mode report the frequency difference between analysis and test; shapes can correlate well (high MAC) while frequencies differ by several percent, which points to a stiffness or mass error rather than a shape error and tells you what to update.
4. Update the model against the test with physically meaningful parameters. Adjust uncertain joint stiffnesses, support compliances, or material moduli to bring frequencies and MAC into agreement, changing parameters that are genuinely uncertain rather than tuning arbitrary numbers to force a match; a model matched by non-physical adjustments predicts untested conditions no better than before.
5. Use operational deflection shapes when a controlled modal test is not possible. Measure the response under operating excitation to obtain the deflection shape at each frequency; unlike mode shapes these include the forcing and damping, so they show how the structure actually moves in service and can reveal a resonance that the forced-excitation test and the model both underweighted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
