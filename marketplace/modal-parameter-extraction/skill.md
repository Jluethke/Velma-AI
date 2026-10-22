# Modal Parameter Extraction

Extract natural frequencies, damping ratios, and mode shapes from FRF data using appropriate curve-fitting algorithms.

## Inputs

- `frf-dataset`: Complete set of measured FRFs
- `driving-point-frf`: Validated driving point FRF
- `frequency-range-of-interest`: Target frequency band

## Outputs

- `modal-parameters`: Natural frequencies, damping ratios, and mode shapes for each identified mode
- `modal-complexity`: Assessment of mode complexity (real vs complex modes) indicating proportional vs nonproportional damping
- `stability-diagram`: Stabilization diagram showing stable poles across polynomial orders for mode count validation

## Process

1. Start with SDOF methods for well-separated modes: peak-picking gives natural frequency from FRF peak and damping from half-power bandwidth. Circle-fit in Nyquist plot gives frequency, damping, and residue for each mode. These serve as initial estimates and sanity checks.
2. For the full dataset, use MDOF methods. Polyreference least-squares complex frequency (PolyMAX or similar) fits all FRFs simultaneously. This handles closely spaced and repeated modes that SDOF methods miss.
3. Construct the stabilization diagram: increase the polynomial order from low to high and track which poles remain stable in frequency (within 1%), damping (within 5%), and mode shape (MAC above 0.95). Physical modes stabilize; computational modes do not.
4. Select the physical poles from the stabilization diagram. Count them against the expected mode count from the driving point FRF (number of peaks).
5. Assess mode complexity. Purely real mode shapes indicate proportional damping. Complex mode shapes (significant imaginary component) indicate nonproportional damping or measurement errors. Calculate the Modal Phase Collinearity (MPC) for each mode: values above 0.9 suggest a real (normal) mode.
6. Validate extracted modes: check that synthesized FRFs from the modal model closely match the measured FRFs. Large residuals at specific frequencies indicate missed modes or poor extraction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
