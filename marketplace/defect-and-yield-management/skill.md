# Defect And Yield Management

Manage defect density through inspection, classification, and root cause analysis to achieve and maintain the target yield.

## Inputs

- `etch-performance`: Etch process characterization data
- `film-characterization`: Deposition process characterization data

## Outputs

- `defect-density-map`: Defect density (defects/cm^2) by defect type and process step, with Pareto of top yield-limiting defect types
- `yield-model`: Yield prediction from defect density using the Poisson model (Y = exp(-D0 * A)) or negative binomial model (Y = (1 + D0 * A / alpha)^(-alpha)) with the process baseline and improvement targets

## Process

1. Implement inline defect inspection after each critical process step. Bright-field optical inspection (KLA 2900 series or equivalent) for patterned wafer inspection: detects particles, pattern defects, and bridging down to approximately 30nm depending on the design rule. Dark-field inspection (KLA Surfscan or equivalent) for unpatterned wafer monitoring: measures particle density and haze on bare or film-coated wafers.
2. Classify defects. Use automated defect classification (ADC) with SEM review of a sample from each defect bin. Common categories: particles (from process tool contamination, wafer handling), pattern defects (bridging from litho, open from etch, CD variations), film defects (pinholes, delamination, nodules), and scratch/handling damage. The Pareto of defect types by count guides the improvement priority.
3. Calculate the yield impact. For random defects: Y = exp(-D0 * A) where D0 is the defect density (defects/cm^2) at the critical defect size, and A is the die area. A defect must be at a critical location (on a feature, not in a field area) and large enough to cause a functional failure. The critical area analysis (from the layout) determines what fraction of the die area is sensitive to each defect type.
4. Root-cause and fix. Trace each high-count defect type to its process step by comparing defect maps before and after each step (defect adders per step). Particles: clean the tool (chamber clean, gas line purge), qualify hardware (o-rings, showerheads), improve wafer handling. Pattern defects: adjust litho or etch process (focus/dose, etch chemistry). Systematic defects (repeating at the same die location on every wafer): mask defect or reticle contamination, fix the mask. Track the defect density trend over time to verify that fixes are sustaining.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
