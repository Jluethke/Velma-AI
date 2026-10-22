# Em Result Extraction And Validation

Extract electromagnetic quantities of interest and validate against measurements or analytical benchmarks.

## Inputs

- `em-model`: Complete simulation setup
- `em-problem`: Target quantities and validation data

## Outputs

- `em-results`: S-parameters, radiation patterns, field distributions, impedance, gain, efficiency, or shielding effectiveness as appropriate
- `em-validation-report`: Comparison to measurement or analytical solution, convergence check, and identified limitations

## Process

1. Extract S-parameters from port simulations: S11 (return loss, should be below -10dB at the operating frequency for antennas), S21 (insertion loss for transmission lines, coupling for filters). Plot on Smith chart for impedance matching analysis.
2. For antennas: compute the far-field radiation pattern from near-field to far-field transformation. Extract gain (directivity * efficiency), 3dB beamwidth, front-to-back ratio, and cross-polarization level. The radiation efficiency accounts for conductor loss, dielectric loss, and surface wave loss.
3. For EMC/shielding: compute shielding effectiveness SE = 20*log10(E_incident/E_transmitted) in dB at each frequency. Check at apertures and seams which are the primary leakage paths. A 1mm gap in a shield at 1 GHz (lambda = 30cm) provides essentially zero shielding once the gap length exceeds lambda/2.
4. Convergence check: for FEM, increase the mesh density (adaptive mesh refinement at high-field locations) until S-parameters change by less than 0.01 dB. For FDTD, run longer in time until the late-time energy decays by 30-40dB below the peak, ensuring the FFT captures all resonances.
5. Validate against known benchmarks: standard antenna geometries (dipole, patch) have well-known analytical or published experimental results. If the simulation reproduces these within 0.5dB gain and 2-degree beam pointing, the method and mesh are adequate for the design problem.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
