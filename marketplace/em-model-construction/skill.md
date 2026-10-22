# Em Model Construction

Build the 3D model in the EM simulator with correct material properties, port definitions, and boundary conditions.

## Inputs

- `solver-selection`: Chosen solver and simulation approach
- `structure-description`: Physical structure details: dimensions, materials, layer stackup

## Outputs

- `em-model`: The constructed EM model with all geometric features, material assignments, port definitions, and boundary conditions documented
- `model-simplifications`: Any simplifications made to the model (removed features, symmetry planes) with justification for why they do not affect the result

## Process

1. Import or construct the 3D geometry. For PCB structures, import from the layout tool (Gerber, ODB++, or STEP). Remove features that are electrically insignificant at the frequency of interest (silkscreen, solder mask if far from the signal, small mounting holes away from the signal path).
2. Assign material properties: conductor conductivity (copper = 5.8e7 S/m, gold = 4.1e7 S/m), dielectric constant and loss tangent (FR-4: er = 4.3, tan_d = 0.02 at 1 GHz; Rogers 4350B: er = 3.66, tan_d = 0.004). Use frequency-dependent material models if available, especially for lossy dielectrics.
3. Define ports: waveports for waveguide or coaxial excitation (specify the mode to excite). Lumped ports for small structures or internal connections. The port defines the reference plane for S-parameter extraction.
4. Set boundary conditions: radiation boundary for open structures (place at least lambda/4 from the nearest radiating element). PEC boundary for symmetry planes (cuts simulation time in half for each symmetry plane). Periodic boundary for array unit cells.
5. Use symmetry wherever possible: a structure with a plane of symmetry can be cut in half, reducing memory by 2x and time by 2 to 4x. Electric symmetry (PEC) for even-mode excitation, magnetic symmetry (PMC) for odd-mode.
6. Document every simplification. If a feature was removed, justify why (e.g., mounting hole 10 mm from the trace with diameter < lambda/20 has negligible effect on S21). These simplifications are the most common source of simulation-measurement disagreement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
