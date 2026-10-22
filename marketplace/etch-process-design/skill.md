# Etch Process Design

Design the plasma etch process for pattern transfer from the resist into the target film, achieving the required profile, selectivity, and uniformity.

## Inputs

- `lithography-recipe`: Resist pattern with CD and profile to be transferred
- `film-stack`: Target film and underlying layers to etch through (material, thickness) with selectivity requirements

## Outputs

- `etch-recipe`: Etch chemistry (gas mixtures, pressures, power levels), endpoint detection method, and over-etch strategy
- `etch-performance`: Achieved etch rate, selectivity to mask and underlayer, CD bias, profile angle, uniformity, and loading effects

## Process

1. Select the etch chemistry from the material. Silicon and polysilicon: Cl2/HBr-based (Cl2 for high rate, HBr for selectivity to oxide and profile control, add O2 for sidewall passivation). Silicon dioxide: C4F8/Ar/O2 (fluorocarbon polymer deposition on the sidewall provides anisotropy, O2 removes excess polymer, Ar provides ion bombardment for vertical etch). Silicon nitride: CH2F2/O2 or CHF3/O2 (selective to oxide by tuning the C:F ratio). Metals (TiN, W): Cl2/BCl3 for TiN, SF6/Cl2 for W.
2. Balance anisotropy and selectivity. Anisotropic etching requires a passivation mechanism on the sidewall (polymer deposition from fluorocarbon gases, or oxidation from O2 addition to chlorine chemistry). Higher ion energy (higher bias power) improves anisotropy but reduces selectivity (the mask etches faster). Lower pressure increases ion directionality (more anisotropic) but may increase ion damage to the underlayer.
3. Implement endpoint detection. Optical emission spectroscopy (OES): monitor the emission line of a volatile etch product (e.g., CO for oxide etch in fluorocarbon, SiCl for silicon etch in chlorine). When the target film is consumed, the etch product signal drops (endpoint). Set the over-etch time as a percentage of the main etch time (typically 20-50%) to clear residual material from topographic features and compensate for across-wafer uniformity variation.
4. Characterize the etch performance. Measure CD bias (CD_after_etch minus CD_after_litho, including any trim steps). Profile angle by SEM cross-section (target 88-90 degrees for vertical profile). Selectivity = etch rate of target / etch rate of mask (must be sufficient for the mask to survive the entire etch plus over-etch). Uniformity: measure the etch rate at 49 or more points across the wafer (target 3-sigma uniformity below 3%).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
