# Lithography Process Design

Design the lithography process step for pattern definition including resist selection, exposure conditions, and resolution enhancement techniques.

## Inputs

- `design-rules`: Minimum feature size (critical dimension), pitch, and overlay requirements for the layer being patterned
- `available-equipment`: Lithography platform (ArF immersion 193nm, EUV 13.5nm, i-line 365nm) and its optical parameters (NA, partial coherence)

## Outputs

- `lithography-recipe`: Complete lithography recipe: resist type and thickness, soft bake, exposure dose and focus, PEB, develop time, and any resolution enhancement techniques
- `process-window`: Exposure-defocus (ED) window showing the common depth of focus across the critical features, with the process margin for dose and focus variation

## Process

1. Calculate the resolution limit: R = k1 * lambda / NA, where lambda is the wavelength, NA is the numerical aperture, and k1 is the process factor (theoretical minimum 0.25 for single exposure, practical minimum 0.3-0.4). For 193nm immersion with NA = 1.35: minimum half-pitch approximately 38nm at k1 = 0.27 (requires multiple patterning). For EUV at 13.5nm with NA = 0.33: minimum half-pitch approximately 13nm at k1 = 0.32.
2. Select the resist. For advanced nodes: chemically amplified resist (CAR) for ArF, metal oxide or CAR for EUV. Resist thickness follows the aspect ratio limit (height / width < 3:1 to avoid pattern collapse). For fine features, thinner resist (50-100nm for sub-50nm features) with hard mask underneath. Characterize the resist contrast curve (remaining thickness vs log dose) to determine the optimal exposure dose (dose to clear for positive resist, dose to print for the target CD).
3. Apply optical proximity correction (OPC) to the mask. Sub-resolution assist features (SRAFs) improve the depth of focus for isolated features. Serif and hammerhead corrections for line-end pullback and corner rounding. Inverse lithography technology (ILT) for the most critical layers. Verify the OPC by aerial image simulation and check the mask error enhancement factor (MEEF): MEEF = (delta_CD_wafer / delta_CD_mask) * (1/M) where M is the reduction ratio (typically 4x).
4. Measure the process window. Expose a focus-exposure matrix (FEM) on a test wafer. Measure the CD at each dose-focus combination. Plot the Bossung curves (CD vs focus at constant dose). The usable process window is the overlap of all features being within their CD specification across the dose and focus range. Minimum acceptable depth of focus is typically 100-200nm for ArF immersion (must accommodate wafer topography, focus error, and tilt).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
