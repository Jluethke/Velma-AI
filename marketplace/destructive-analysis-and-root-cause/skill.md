# Destructive Analysis And Root Cause

Perform destructive physical analysis including cross-sectioning, SEM/EDS, and dye-and-pry to determine the failure mechanism at the microstructural level.

## Inputs

- `non-destructive-diagnosis`: Hypothesis and evidence from non-destructive inspection
- `fault-localization`: Specific component or joint to section

## Outputs

- `cross-section-results`: Metallographic cross-section images showing solder joint microstructure, intermetallic thickness, crack path, and void morphology
- `material-analysis`: EDS (Energy Dispersive X-ray Spectroscopy) composition analysis at failure site identifying contaminants, corrosion products, or unexpected materials
- `failure-mechanism-determination`: Root cause identification: failure mechanism (fatigue, overstress, contamination, EOS/ESD, manufacturing defect) with supporting evidence from the physical analysis

## Process

1. For solder joint analysis, use dye-and-pry first (for BGA/CSP). Apply fluorescent dye to the suspect area, allow it to wick into any cracks. Remove the component by heating above solder liquidus and lifting off. Examine the fracture surfaces under UV light: dye penetration marks the pre-existing crack; fresh fracture surfaces (from removal) are dye-free. This reveals the crack location (board side, component side, bulk solder, intermetallic) and extent.
2. Cross-section the suspect joint or component. Mount the sample in epoxy, grind and polish through the target plane using progressively finer abrasive (180 grit to 0.05um alumina). Etch the polished surface to reveal grain boundaries if needed (for solder: 5% HCl in methanol for 5 seconds). Examine under optical microscope at 50x to 500x.
3. Examine the cross-section for failure signatures. Thermal fatigue: intergranular crack propagating from the stress concentration point (package corner for BGA), with grain coarsening near the crack. Mechanical overstress: transgranular crack with little deformation. Solder void: smooth spherical cavity in the joint interior. Kirkendall voiding: line of voids at the Cu-Sn intermetallic interface from diffusion imbalance (indicates excessive thermal exposure).
4. Use SEM (Scanning Electron Microscopy) for high-magnification imaging of the fracture surface or cross-section. EDS (Energy Dispersive Spectroscopy) identifies elemental composition: detect tin whiskers (pure Sn), contamination (Cl, S for corrosion; Na, K for flux residue), intermetallic composition (Cu6Sn5 vs Cu3Sn), and foreign material.
5. Determine the root cause category: design (thermal stress exceeds joint fatigue life, inadequate pad size), component (internal defect, incoming quality issue), process (reflow profile, paste deposit volume, placement accuracy, cleanliness), or field stress (thermal cycling, mechanical shock, corrosion from environment). Document the evidence chain from symptom to mechanism to root cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
