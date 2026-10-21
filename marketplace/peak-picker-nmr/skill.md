# Peak Picker Nmr

Pick peaks in the NMR spectrum: identify each resonance with its chemical shift, line width, and intensity.

## Inputs

- `processed-spectrum`: The frequency-domain NMR spectrum
- `picking-parameters`: Minimum intensity threshold, solvent peak regions to exclude

## Outputs

- `peak-list-nmr`: Each peak with chemical shift (ppm), intensity, and line width
- `solvent-exclusion-log`: Regions excluded (solvent, reference standard) and their positions

## Process

1. Set the minimum intensity threshold above the noise level.
2. Exclude known solvent peak regions (e.g., CDCl3 at 7.26 ppm for 1H).
3. Identify all peaks above the threshold with their chemical shift and intensity.
4. Group closely spaced peaks that belong to the same multiplet.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
