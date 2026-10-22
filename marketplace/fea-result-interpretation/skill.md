# Fea Result Interpretation

Extract, post-process, and interpret FEA results to answer the engineering question with appropriate conservatism.

## Inputs

- `loaded-model`: Completed FEA analysis with results
- `analysis-requirements`: Design code or standard against which to evaluate results (ASME, Eurocode, FAR, etc.)

## Outputs

- `structural-assessment`: Pass/fail assessment against the applicable code, with factors of safety and identified critical locations
- `result-quality-check`: Element quality metrics, energy balance, stress discontinuity check, and identified modeling limitations

## Process

1. Check result quality first: element distortion warnings, negative Jacobians, and energy error norm. The energy balance (external work vs strain energy) should match within 1%. Large strain energy in a few elements indicates a singularity or poor element quality.
2. For stress evaluation per ASME BPVC Div 2: perform stress linearization through the section at the critical location. Decompose total stress into membrane (constant through thickness), bending (linear through thickness), and peak (remaining). Compare membrane to the allowable membrane stress, membrane+bending to the allowable membrane+bending stress.
3. For fatigue evaluation: extract the alternating stress at the critical location (peak stress including stress concentration). Apply the fatigue strength reduction factor if not already captured by the mesh (mesh must resolve the stress concentration to use FEA stress directly). Compare to the S-N curve for the material. Compute the usage factor if multiple load cycles are present (Miner's rule).
4. For buckling: linear buckling (eigenvalue) gives the upper-bound bifurcation load. Apply knockdown factors for imperfections (typically 0.65 to 0.80 for cylinders under axial compression). For accurate buckling prediction, run a nonlinear analysis with geometric imperfections seeded from the first buckling mode shape scaled to the manufacturing tolerance.
5. Document limitations: FEA stress at a singularity is mesh-dependent and physically meaningless. Stress below yield in a linear elastic analysis does not guarantee safety if the material is brittle or if fatigue is the failure mode. Static analysis does not capture dynamic amplification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
