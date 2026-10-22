# Weld Distortion And Residual Stress

Predict and mitigate welding distortion and residual stress through sequence planning, fixturing, and post-weld treatment selection.

## Inputs

- `wps-document`: Welding parameters including heat input and pass sequence
- `joint-configuration`: Joint geometry and structural assembly details

## Outputs

- `distortion-mitigation-plan`: Weld sequence, fixturing requirements, pre-set (pre-camber) values, and intermediate stress relief points
- `residual-stress-assessment`: Expected residual stress distribution and selected mitigation method (PWHT, mechanical stress relief, or as-welded with justification)

## Process

1. Estimate shrinkage. Transverse shrinkage of a butt weld is approximately 0.3-1.5mm depending on thickness and groove angle. Longitudinal shrinkage is approximately 0.5-1mm per meter of weld. Angular distortion of a single-V butt weld is roughly 1-5 degrees depending on plate thickness and heat input. Use these estimates to set pre-camber or pre-set values.
2. Plan the weld sequence to balance heat input symmetrically. Weld from the center outward to allow shrinkage toward the center. Alternate sides of a double-V groove. For long welds, use the backstep technique (weld short segments in the reverse direction of overall progression) to distribute shrinkage. For closed structures (frames, box beams), plan the sequence to close the last joint where distortion can be accommodated.
3. Design fixturing to restrain distortion during welding. Strongbacks for butt joints, clamps and tack welds for positioning. The restraint must be stiff enough to control distortion but not so rigid that it causes cracking in the weld or HAZ (especially for high-strength or crack-sensitive materials). Release restraint gradually after the weld cools to prevent springback-induced cracking.
4. Post-weld heat treatment (PWHT) when required. ASME VIII mandates PWHT for carbon steel above certain thicknesses (typically 19mm for P-No. 1). Typical PWHT for carbon steel: 600-650C for 1 hour per 25mm of thickness. Heating and cooling rates must be controlled (typically 55-220 C/hr depending on thickness) to avoid thermal gradients that create new residual stress. Alternatives to furnace PWHT: local PWHT (electric resistance heating blankets, verify the soak band covers the HAZ), mechanical stress relief (vibratory, proof loading), or design with fatigue improvement techniques (toe grinding, TIG dressing, peening) instead of PWHT.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
