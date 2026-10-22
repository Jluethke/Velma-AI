# Em Problem Classification And Solver

Classify the electromagnetic problem and select the solver method that matches the physics and frequency range.

## Inputs

- `em-problem`: Physical scenario: frequency range, geometry size relative to wavelength, materials, and the quantity to predict (radiation pattern, S-parameters, field distribution, shielding effectiveness)
- `accuracy-requirements`: Required accuracy and computational budget

## Outputs

- `solver-selection`: FEM (frequency domain, arbitrary materials, enclosed boundaries), FDTD (time domain, broadband, large open problems), or MoM (surface currents, antennas in free space)
- `frequency-mesh-estimate`: Required mesh density (elements per wavelength) and estimated problem size

## Process

1. Classify by electrical size: if the structure is small compared to wavelength (L < lambda/10), use quasi-static or lumped-element analysis (no full-wave needed). If L is comparable to lambda, full-wave simulation is needed. If L >> lambda, ray tracing or asymptotic methods may be more efficient.
2. FEM (frequency-domain): best for problems with complex materials (anisotropic, inhomogeneous, lossy), enclosed or partially enclosed domains (waveguides, cavities, microstrip), and when the field at a single frequency is needed. Frequency sweep requires solving at each frequency point. Mesh with at least 6 elements per wavelength (10 for accuracy near resonances).
3. FDTD (time-domain): best for broadband analysis (one run gives all frequencies via FFT of the time-domain response), large open problems (antennas in free space), and transient problems (pulse propagation, time-domain reflectometry). Mesh is a regular grid (Yee cell); mesh density at least 10 cells per wavelength at the highest frequency. PML (perfectly matched layer) absorbing boundaries terminate the domain.
4. MoM (integral equation): best for antennas and scatterers in free space (no volume discretization of the background). Solves for surface currents on conductors. Matrix size is N_surface^2 which is much smaller than volume methods for open problems. Does not handle inhomogeneous dielectrics well.
5. Estimate problem size: N_FEM = (L/lambda)^3 * elements_per_wavelength^3. N_FDTD = (L/lambda + N_PML)^3 * cells_per_wavelength^3 * time_steps. N_MoM = (L/lambda)^2 * elements_per_wavelength^2. A problem that fits in memory with one method may not with another.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
