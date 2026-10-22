# Non Destructive Physical Inspection

Inspect the failed assembly using non-destructive methods including visual inspection, X-ray, acoustic microscopy, and dye penetrant to identify physical defects without altering the evidence.

## Inputs

- `fault-localization`: Suspected component or area from electrical characterization
- `electrical-characterization`: Measured deviations to correlate with physical findings

## Outputs

- `visual-inspection-findings`: Optical and stereo microscope observations: solder joint appearance, component damage, PCB defects, contamination
- `xray-inspection-results`: X-ray images of suspect solder joints showing voids, bridging, head-in-pillow, and other hidden defects under BGA and QFN packages
- `non-destructive-diagnosis`: Preliminary failure mechanism hypothesis based on non-destructive evidence, with confidence assessment

## Process

1. Start with unaided visual inspection: look for obvious physical damage, discoloration (burn marks, heat damage), cracked components, bent pins, contamination, or corrosion. Photograph everything before handling. Handle the board by the edges with ESD-safe gloves to preserve contamination evidence.
2. Move to stereo microscope inspection (10x to 45x magnification) of the suspect area. Examine solder joints for cold solder (grainy, dull finish), insufficient solder, excess solder, solder bridges, lifted pads, cracked joints, or tin whiskers. For through-hole components, check for solder fill (barrel fill should be 75% minimum per IPC-A-610).
3. For BGA, QFN, and other hidden-joint packages, use X-ray inspection. In 2D X-ray, look for: voids (dark circles in solder balls, acceptable up to 25% of ball area per IPC-7095), bridging (solder connecting adjacent balls), head-in-pillow (ball and pad solder did not fully merge, showing a distinct boundary), and missing or misaligned balls. If available, use 3D X-ray (CT) to see the joint profile in cross-section without cutting.
4. For suspected delamination or die-attach voids, use scanning acoustic microscopy (SAM/C-SAM). Acoustic imaging reveals voids and delamination at interfaces (die to die-attach, die-attach to leadframe, board layer delamination) that are invisible to X-ray. Voids appear as bright (high reflection) areas at the interface.
5. Correlate non-destructive findings with electrical symptoms. A void in a BGA solder ball correlates with an intermittent open. A solder bridge matches a short between two nets. Die-attach voiding correlates with thermal failure (hot spot on the die from poor heat conduction). If the non-destructive evidence is conclusive, document it and proceed to root cause. If inconclusive, proceed to destructive analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
