# Em Model Setup And Excitation

Set up the electromagnetic model: geometry, materials, excitation, and boundary conditions.

## Inputs

- `solver-selection`: Chosen solver method
- `em-problem`: Physical scenario and design intent

## Outputs

- `em-model`: Complete model with geometry, material properties (permittivity, permeability, conductivity, loss tangent), excitation (port, plane wave, current source), and boundary conditions
- `excitation-specification`: Port definition, impedance normalization, and frequency/time parameters

## Process

1. Import or build geometry. Simplify features that are electrically small (much smaller than lambda/20): small fillets, thin coatings (replace with impedance boundary), and fine details far from the region of interest. These features increase mesh density without affecting the result.
2. Assign materials: conductors (copper: sigma = 5.8e7 S/m, treat as PEC if skin depth << wall thickness, otherwise use impedance boundary). Dielectrics: specify epsilon_r and loss tangent at the frequency of interest (FR-4: epsilon_r = 4.3, tan_delta = 0.02 at 1 GHz). Frequency-dependent materials require Debye or Drude models in FDTD.
3. Define excitation: waveguide port (for transmission lines and waveguides, the port mode pattern is computed and used to inject and absorb energy), lumped port (for small gaps, models a voltage source with impedance), or plane wave (for scattering problems and RCS). The port impedance normalization (typically 50 ohm) defines S-parameter reference.
4. Set boundary conditions: PEC (tangential E = 0) for metallic walls, PMC (tangential H = 0) for symmetry planes, radiation boundary or PML for open boundaries. PML must be at least lambda/4 from the nearest structure and at least 8 cells thick in FDTD.
5. For FDTD, define the time-domain pulse: Gaussian modulated sinusoid with bandwidth covering the frequency range of interest. The pulse duration determines the frequency resolution after FFT: delta_f = 1/T_total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
