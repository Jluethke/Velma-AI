# Em Result Extraction Correlation

Extract the simulation results (S-parameters, fields, patterns), compare to analytical predictions and measurements, and iterate if they disagree.

## Inputs

- `converged-mesh`: Converged simulation mesh and settings
- `em-model`: The EM model
- `analysis-goals`: Quantities to extract and accuracy targets

## Outputs

- `simulation-results`: Extracted S-parameters (Touchstone file), radiation patterns, field plots, and any derived quantities (impedance, gain, coupling)
- `simulation-measurement-correlation`: Comparison of simulation to measurement (if available) or analytical prediction, with analysis of discrepancies and model corrections

## Process

1. Extract S-parameters and export in Touchstone format for use in circuit simulators. Check passivity (|S11|^2 + |S21|^2 <= 1 for a lossless two-port) and reciprocity (S12 = S21 for passive structures). Violations indicate a simulation error.
2. For antennas: extract the far-field radiation pattern (gain in dBi vs. theta and phi), input impedance, efficiency (ratio of radiated power to accepted power), and bandwidth (frequency range where |S11| < -10 dB).
3. Visualize the current or field distribution at key frequencies. This provides physical insight: where is the current flowing, where are the losses, where is the radiation coming from. This understanding is more valuable than the numbers alone for diagnosing problems and making design improvements.
4. Compare to analytical predictions. For a microstrip line, the simulated impedance should agree with the analytical formula to within 1 to 2%. For a patch antenna, the resonant frequency should agree with the cavity model to within 2 to 3%. Larger discrepancies suggest a modeling error.
5. Compare to measurement when available. Common sources of discrepancy: dielectric constant different from nominal (measure it or use a trim coupon), conductor surface roughness (increases loss at high frequencies, model with Huray or Hammerstad correction), connector and probe transition effects (de-embed or include in the model).
6. If simulation and measurement disagree by more than the expected uncertainty, systematically vary model parameters (dielectric constant, loss tangent, conductor conductivity, dimensions) to identify which parameter, when corrected, brings the simulation into agreement. This calibrated model is then reliable for design variations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
