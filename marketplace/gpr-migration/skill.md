# Gpr Migration

Migrate the GPR profiles to collapse diffraction hyperbolas and position reflectors at their true subsurface locations.

## Inputs

- `processed-radargrams`: Gain-corrected and filtered radargrams
- `velocity-model`: Subsurface velocity estimates for migration

## Outputs

- `migrated-profiles`: Migrated GPR profiles with diffractions collapsed and dipping reflectors repositioned
- `migration-quality-check`: Comparison of pre- and post-migration images at key features

## Process

1. Select the migration algorithm (Kirchhoff, Stolt, or finite-difference) based on data quality and velocity complexity
2. Apply migration using the estimated velocity model
3. Compare pre- and post-migration images to verify diffraction collapse
4. Adjust the velocity model and re-migrate if diffractions are under- or over-collapsed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
