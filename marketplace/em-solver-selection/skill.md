# Em Solver Selection

Select the appropriate electromagnetic solver type for the structure being analyzed, based on the geometry, frequency range, and the quantities needed.

## Inputs

- `structure-description`: The RF structure to simulate: planar (PCB trace, antenna on substrate), 3D enclosed (cavity, waveguide), 3D open (antenna in free space), or periodic (array, FSS)
- `analysis-goals`: What needs to be extracted: S-parameters, radiation pattern, fields, coupling, or resonant frequencies

## Outputs

- `solver-selection`: Selected solver type (MoM, FEM, FDTD) with justification and expected simulation time and memory requirements
- `simulation-setup-plan`: Plan for model construction, meshing strategy, boundary conditions, and excitation type

## Process

1. Method of Moments (MoM): best for planar or layered structures (PCB, microstrip, planar antennas). Solves on the surface currents only, so it is efficient for structures with large free-space volumes. Frequency-domain (one frequency per solve). Good for S-parameter extraction and radiation patterns of planar antennas.
2. Finite Element Method (FEM): best for 3D structures with complex geometry (cavity filters, connectors, transitions between transmission lines, packaged ICs). Solves the fields throughout the volume. Handles arbitrary 3D shapes and material distributions. Frequency-domain with adaptive mesh refinement. HFSS is the most common FEM tool for RF.
3. Finite-Difference Time-Domain (FDTD): best for broadband problems and transient analysis. Solves in the time domain, so a single simulation gives the response across a wide frequency range (via FFT). Good for UWB antennas, EMC analysis, and structures where broadband response is needed. CST is the most common FDTD-based tool.
4. For periodic structures (infinite arrays, frequency-selective surfaces): use a single unit cell with periodic boundary conditions in MoM or FEM. This dramatically reduces the simulation size compared to modeling the full array.
5. Estimate the simulation size: the mesh must resolve the smallest feature (trace width, gap, via diameter) and the wavelength. For FEM: typically 6 to 10 tetrahedral elements per wavelength in each material. For FDTD: at least 10 to 20 cells per wavelength. Memory scales with the number of mesh elements; time scales with elements * frequency points (FEM) or elements * time steps (FDTD).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
