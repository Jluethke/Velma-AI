# Particle Technique Selector

Select the particle size measurement technique based on the size range, material, and required information.

## Inputs

- `material-description`: What the particles are (powder, emulsion, suspension, aerosol)
- `expected-size-range`: Approximate particle size range (nm, um, mm)

## Outputs

- `selected-technique`: Chosen method (laser diffraction, sieving, DLS, imaging, sedimentation) with justification
- `measurement-protocol`: Sample preparation and instrument settings for the selected technique

## Process

1. Map the expected size range to candidate techniques (DLS for nm, laser diffraction for um, sieving for mm)
2. Consider the material properties (wet vs dry, fragile, aggregating, refractive index)
3. Select the technique that covers the expected range with appropriate resolution
4. Define the sample preparation steps and instrument parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
