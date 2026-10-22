# Weld Fatigue Life Prediction

Predict the fatigue life of the welded joint using the appropriate methodology for the application, from S-N curves through structural stress methods.

## Inputs

- `joint-configuration`: Joint geometry and weld profile
- `service-requirements`: Cyclic loading spectrum and target fatigue life

## Outputs

- `fatigue-life-prediction`: Predicted fatigue life at the design confidence level, with identification of the critical location and failure mode
- `fatigue-improvement-options`: Post-weld fatigue improvement techniques and their expected benefit factors if the as-welded life is insufficient

## Process

1. Classify the weld detail per the fatigue design code. BS 7608, Eurocode 3 (EN 1993-1-9), or IIW recommendations each classify weld details into fatigue categories (FAT classes). A full-penetration butt weld ground flush is FAT 90-112. A transverse non-load-carrying fillet weld is FAT 80. A longitudinal fillet weld end is FAT 50-71. The FAT class defines the characteristic S-N curve at 2 million cycles.
2. Calculate the hot-spot stress or structural stress at the weld toe. The nominal stress method uses simple beam/membrane stress at the weld location multiplied by a stress concentration factor from the detail class. The hot-spot stress method (IIW) uses stress extrapolation from FEA to the weld toe using specified read-out points (0.4t and 1.0t for fine mesh, or 0.5t and 1.5t for coarse mesh, where t is plate thickness).
3. Apply the Palmgren-Miner damage summation for variable amplitude loading: D = sum(n_i / N_i) where n_i is the number of cycles at stress range S_i and N_i is the fatigue life at S_i from the S-N curve. Failure at D = 1.0 (use D = 0.5 for conservative design or when the loading sequence has occasional overloads that may accelerate crack growth). Extract the stress spectrum from the service load history using rainflow counting.
4. If the as-welded fatigue life is insufficient, evaluate improvement techniques. Toe grinding (burr or disc): typically 1.3-1.5x life improvement (removes the crack-like intrusions at the weld toe). TIG dressing: 1.5-2.5x (remelts the toe to a smooth profile and removes intrusions). Hammer peening or HFMI (high-frequency mechanical impact): 2-5x (introduces compressive residual stress at the toe). Apply the improvement factor per IIW recommendations (different factors by R-ratio and yield strength).
5. Report the predicted life with explicit statement of the assumptions: S-N curve source, stress calculation method, Miner's sum limit, improvement technique if applied, and the reliability level (characteristic curve is typically mean minus 2 standard deviations, approximately 95% survival probability). If the predicted life still falls short, the joint must be redesigned (e.g., change from fillet to full-penetration, or reduce the stress range by increasing the section).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
