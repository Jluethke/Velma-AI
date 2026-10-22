# Real Gas Computational Approach

Select and configure the right computational method for the flow regime: DSMC for rarefied, Navier-Stokes with chemical kinetics for continuum, and bridging methods for the transitional regime.

## Inputs

- `flight-conditions`: Velocity, altitude, and trajectory profile
- `vehicle-geometry`: Characteristic length scale of the vehicle

## Outputs

- `computational-approach-selection`: Which solver to use at each trajectory point with justification
- `chemistry-model-selection`: Which chemical reaction set and thermal model to use
- `grid-resolution-requirements`: Mesh requirements for the selected approach

## Process

1. Calculate the Knudsen number at each trajectory point: Kn = lambda/L where lambda is the mean free path (lambda = 1/(sqrt(2)*n*sigma) with n = number density, sigma = collision cross section) and L is the vehicle characteristic length.
2. Select solver regime: Kn < 0.001 is continuum (Navier-Stokes valid); 0.001 < Kn < 0.1 is slip flow (Navier-Stokes with slip boundary conditions); 0.1 < Kn < 10 is transitional (DSMC or hybrid); Kn > 10 is free molecular (DSMC or analytical).
3. For continuum regime, select the chemical kinetics model: 5-species air (N2, O2, NO, N, O) for temperatures below 9000K; 11-species air (add N2+, O2+, NO+, N+, O+, e-) for ionizing conditions above 9000K. Select thermal model: Park two-temperature model (translational-rotational T and vibrational-electronic Tv) for nonequilibrium.
4. For DSMC, select collision model (Variable Hard Sphere or Variable Soft Sphere), chemistry model (TCE or QK), and determine cell size requirements (cell size < local mean free path / 3, time step < mean collision time / 5, particles per cell > 20).
5. For the transitional regime, consider hybrid DSMC-NS methods: use a breakdown parameter (e.g., Bird's parameter P = max(|dQ/dx| * lambda / Q) > 0.05 flags continuum breakdown) to determine where to switch from NS to DSMC within the flow domain.
6. Estimate computational cost: DSMC scales with the cube of 1/Kn for 3D problems, making low-altitude DSMC prohibitively expensive. Navier-Stokes is cheaper but invalid in rarefied regions. Document the coverage gaps and whether engineering correlations must bridge them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
