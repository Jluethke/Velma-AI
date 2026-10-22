# Am Build Parameter Development

Develop and validate the build parameters (laser/beam power, scan speed, layer thickness, scan strategy) for the selected material and process to achieve target density and microstructure.

## Inputs

- `selected-process`: AM process and machine platform
- `material-feedstock`: Powder or wire specification

## Outputs

- `validated-parameters`: Locked build parameter set (power, speed, hatch, layer thickness, scan strategy) with density and microstructure verification data
- `process-window`: Map of the energy density parameter space showing the boundaries for keyhole porosity, lack-of-fusion porosity, and balling, with the operating point margin

## Process

1. Start from the volumetric energy density (VED = P / (v * h * t)) where P is laser power, v is scan speed, h is hatch spacing, t is layer thickness. For SLM of Ti-6Al-4V, the typical VED range for full density is 50-120 J/mm^3. For IN718, 60-100 J/mm^3. For AlSi10Mg, 50-80 J/mm^3. These are starting points; the actual window depends on the specific machine and powder lot.
2. Build a single-track experiment matrix varying power and speed. Evaluate track width, continuity, and penetration depth from cross-sections. A stable track must penetrate at least one layer thickness into the previous layer for good interlayer bonding without excessive keyholing (porosity from vapor depression collapse).
3. Build density cubes (typically 10x10x10mm) at multiple parameter sets within the single-track window. Measure density by Archimedes method (precision to 0.01 g/cm^3) and cross-section image analysis. Target: above 99.5% relative density for structural applications. Characterize the porosity type (spherical = gas/keyhole, irregular = lack of fusion) to diagnose the process window position.
4. Select the scan strategy. Stripe or checkerboard patterns with 67-degree rotation between layers to distribute residual stress. Island scanning for large cross-sections to limit heat accumulation. Contour scans with reduced power for surface quality. Verify that the scan strategy does not create systematic defect patterns at scan boundaries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
