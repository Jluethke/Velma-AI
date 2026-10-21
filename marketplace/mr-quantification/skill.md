# Mr Quantification

Quantify peak integrals (NMR) or region volumes (MRI) to extract concentrations, ratios, or sizes.

## Inputs

- `processed-spectrum-or-image`: Processed data
- `assignment-table`: Which peaks or regions to quantify

## Outputs

- `quantification-results`: Concentrations, molar ratios, or volumetric measurements
- `measurement-uncertainty`: Uncertainty estimates for each quantified value

## Process

1. For NMR: integrate assigned peaks and normalize to an internal standard or reference peak.
2. For MRI: compute volumes of segmented regions by voxel counting and correct for partial volume effects.
3. Calculate concentrations or molar ratios from integral ratios.
4. Estimate measurement uncertainty from signal-to-noise, integration limits, and segmentation variability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
