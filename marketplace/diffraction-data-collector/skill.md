# Diffraction Data Collector

Harvest crystals and collect X-ray diffraction data.

## Inputs

- `optimized-conditions`: Conditions producing the best crystals
- `hit-list`: Crystal descriptions including approximate size

## Outputs

- `diffraction-dataset`: Indexed diffraction images with processing statistics
- `data-collection-log`: Beamline, wavelength, oscillation, exposure, and cryoprotectant details

## Process

1. Harvest crystals into cryoprotectant solution and flash-cool in liquid nitrogen
2. Mount on the beamline and screen for diffraction quality
3. Collect a complete dataset with appropriate oscillation range and redundancy
4. Process images to extract intensities and determine the space group and unit cell

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
