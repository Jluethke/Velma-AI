# Extractables Leachables Study

Execute chemical characterization: extract patient-contacting materials under simulated-use and exaggerated conditions, identify and quantify extractables, and perform toxicological risk assessment of each chemical species.

## Inputs

- `material-characterization-plan`: Extraction conditions and analytical methods
- `device-description`: Materials, processes, and sterilization affecting extractable profile

## Outputs

- `extractables-report`: Identified and quantified chemical species from each extraction condition with analytical method validation
- `toxicological-risk-assessment`: Risk assessment of each extractable species against tolerable intake values, with margin of safety calculation

## Process

1. Prepare test articles: final-finished devices or representative material coupons processed and sterilized identically to production. Include negative controls (extraction solvent only) and positive controls where applicable.
2. Extract in polar (water, saline, or water/ethanol) and non-polar (hexane or similar) solvents. Use elevated temperature (50C or 70C) to simulate accelerated aging. Extraction time based on device contact duration: 72h for permanent implants.
3. Analyze extracts by GC-MS for volatile and semi-volatile organics, LC-MS for non-volatile organics, ICP-MS or ICP-OES for metals, FTIR for polymer degradation products. Report limits of detection for each method.
4. Identify each detected species by library matching (NIST, Wiley) and quantify by calibrated standards. For unknowns, assign a toxicological threshold of concern (TTC) per Cramer class.
5. Calculate tolerable exposure for each identified species using ISO 10993-17. Compare patient exposure (extractable quantity per device, per day) to tolerable intake (TI). Report the margin of safety (TI divided by estimated exposure). Any margin below 1.0 requires risk control.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
