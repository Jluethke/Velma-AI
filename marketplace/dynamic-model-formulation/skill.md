# Dynamic Model Formulation

Formulate the equations of motion for the structure including mass, stiffness, and damping properties.

## Inputs

- `structure-properties`: Geometry, material properties, boundary conditions, and mass distribution of the structure
- `loading-description`: Description of dynamic loads: harmonic forces, random excitation PSD, shock transients, or base excitation

## Outputs

- `mass-stiffness-model`: Mass and stiffness matrices (or their continuous equivalents) defining the structural dynamics
- `natural-frequencies-and-modes`: Undamped natural frequencies and mode shapes from eigenvalue analysis
- `damping-model`: Damping matrix or modal damping ratios assigned from material data, test data, or published values

## Process

1. Classify the model type needed. Lumped parameter (discrete springs and masses) for simple systems. Continuous (beam, plate, shell theory) for uniform structures where closed-form solutions exist. FEA for complex geometry.
2. For FEA: extract natural frequencies and mode shapes from the eigenvalue problem [K - omega^2 * M]{phi} = 0. Include all modes up to at least 1.5 times the highest forcing frequency. Check modal effective mass: modes with significant effective mass participate in the response to base excitation.
3. Assign damping. For metals in assembled structures: 1-3% critical damping. For welded steel structures: 0.5-1%. For bolted joints: 2-5%. For composite structures: 1-2%. Use Rayleigh damping [C] = alpha*[M] + beta*[K] if proportional damping is assumed; fit alpha and beta to match target damping ratios at two frequencies.
4. Verify the model against known checks: static deflection under gravity, first natural frequency against closed-form estimate for simple geometry (beam: f1 = (pi/2L^2)*sqrt(EI/rho*A) for simply supported), total mass.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
