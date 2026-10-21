# Rock Stress Strain Importer

Import stress-strain data from uniaxial and triaxial compression tests on rock specimens.

## Inputs

- `test-data-files`: Load frame output: axial load, axial displacement, confining pressure, and lateral strain
- `specimen-log`: Specimen dimensions, lithology, depth, and test conditions

## Outputs

- `stress-strain-data`: Axial stress vs axial strain and lateral strain for each specimen at each confining pressure
- `specimen-metadata`: Specimen identity, dimensions, lithology, and test temperature

## Process

1. Parse load frame output and convert force and displacement to stress and strain
2. Apply area correction for barreling in unconfined tests if specimen aspect ratio is non-standard
3. Organize data by specimen and confining pressure level
4. Check for seating artifacts at low loads and trim if necessary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
