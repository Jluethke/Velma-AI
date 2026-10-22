# Field Solver Impedance Extraction

Run a 2D field solver on the designed cross-section to extract actual impedance, propagation delay, and coupling coefficients. Compare to closed-form estimates and iterate.

## Inputs

- `stackup-cross-section`: Designed layer stackup with all geometry
- `impedance-target`: Target impedance with tolerance
- `microstrip-geometry`: Outer layer geometry
- `stripline-geometry`: Inner layer geometry

## Outputs

- `extracted-impedance`: Field-solver-calculated impedance for each trace class (single-ended and differential)
- `propagation-delay`: Signal propagation delay per unit length for each layer
- `coupling-coefficients`: Near-end and far-end coupling between adjacent traces at minimum spacing
- `impedance-sensitivity`: How much impedance changes per mil of dielectric height variation and per mil of trace width variation

## Process

1. Model the exact cross-section in the field solver (Polar Si9000, Ansys 2D Extractor, or equivalent). Include the solder mask layer for outer traces because solder mask (Dk around 3.3 to 3.8) lowers microstrip impedance by 2 to 5 ohms.
2. Extract Z0 (single-ended), Zdiff (differential), propagation delay (ps/inch), and coupling coefficients (Kf, Kb) for adjacent traces at minimum spacing.
3. Compare field solver results to the closed-form estimates. If they differ by more than 5%, investigate: the closed-form ignores solder mask, trapezoidal etch profile, and frequency-dependent Dk. Trust the field solver.
4. Run a sensitivity sweep: vary dielectric height by +/- 10% (typical manufacturing tolerance) and trace width by +/- 0.5 mil (typical etch tolerance). If impedance falls outside the target tolerance at these extremes, the design has no manufacturing margin and the geometry must be adjusted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
