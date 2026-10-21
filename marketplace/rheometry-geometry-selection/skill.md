# Rheometry Geometry Selection

Select the appropriate measurement geometry (cone-plate, parallel plate, Couette) based on the material's viscosity range and sample constraints.

## Inputs

- `sample-description`: Material type, expected viscosity range, and available sample volume
- `instrument-capabilities`: Available geometries, torque range, and gap control

## Outputs

- `selected-geometry`: Chosen geometry with dimensions and gap setting
- `loading-protocol`: Sample loading and conditioning procedure

## Process

1. Assess the viscosity range to choose between cone-plate (low-medium), parallel plate (soft solids, gels), or Couette (low viscosity liquids)
2. Select the geometry dimensions based on sample volume and torque sensitivity requirements
3. Define the sample loading procedure including any pre-shear or rest time
4. Document the temperature control method and any solvent trap needed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
