# Modal Test Planning

Plan the modal test: select excitation method, define measurement grid, and place accelerometers based on pre-test FEA analysis.

## Inputs

- `structure-description`: Physical description of the test article including geometry, materials, and boundary conditions
- `frequency-range-of-interest`: Target frequency band for modal extraction (e.g., 0-500 Hz)
- `pre-test-fea-modes`: Predicted mode shapes and frequencies from FEA model, if available

## Outputs

- `excitation-method`: Selected excitation approach (impact hammer, electrodynamic shaker, or multiple-reference) with rationale
- `measurement-grid`: Sensor locations and directions defined to capture target mode shapes without spatial aliasing
- `test-configuration`: Complete test setup including boundary conditions, suspension method for free-free, channel assignments, and cabling diagram

## Process

1. Review the structure geometry and identify expected mode shapes from pre-test FEA or engineering judgment. Count the modes expected in the frequency range.
2. Select excitation method: impact hammer for small to medium structures with good frequency content from tip hardness selection; shaker for large structures or when controlled input spectrum is needed; multiple-reference for structures with repeated roots or closely spaced modes.
3. Define the measurement grid. Place points at locations of maximum modal displacement from pre-test analysis. Ensure enough spatial resolution to distinguish the highest-order mode shape in the band (at least 2 points per half-wavelength of the highest bending mode).
4. Select accelerometers: mass loading must be less than 1% of local effective mass. Choose sensitivity to cover expected amplitude range. Mount with stud for best frequency response; wax or adhesive if stud mount is not possible, noting the reduced usable frequency range.
5. Define driving point location where the excitation is applied and the response is measured at the same DOF. This FRF must show alternating resonance-antiresonance pattern as a quality check.
6. Document channel assignments, reference DOF, roving DOF sequence, and expected measurement count. Estimate total test time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
