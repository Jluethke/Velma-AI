# Assay Optimization And Lod

Optimize assay conditions for maximum signal-to-noise, then determine the limit of detection and limit of quantification using CLSI protocols.

## Inputs

- `assay-architecture`: Platform, reagents, and detection method
- `performance-targets`: Required sensitivity and precision

## Outputs

- `optimized-assay-protocol`: Final assay conditions: reagent concentrations, incubation times, temperatures, wash steps
- `lod-loq-determination`: Limit of detection and limit of quantification with confidence intervals and blank study data

## Process

1. Optimize sequentially: antibody/primer concentration first (checkerboard titration for sandwich immunoassay), then incubation time, then blocking agent, then wash stringency. At each step, measure both signal (positive control) and noise (negative control). Maximize the signal-to-noise ratio, not just signal.
2. For immunoassays, optimize blocking to reduce nonspecific binding: test BSA, casein, fish gelatin, and proprietary blockers. Measure background signal on each. The blocker that produces the lowest background at the negative control is the winner, even if it slightly reduces positive signal.
3. Determine limit of blank (LoB) per CLSI EP17: measure 60+ blank replicates across 3+ days. LoB = mean blank + 1.645 * SD blank (for 95% confidence that a blank will not exceed this value).
4. Determine limit of detection (LoD): measure 60+ replicates of low-concentration samples (near expected LoD) across 3+ days. LoD = LoB + 1.645 * SD of the low-concentration sample. This gives 95% confidence of detecting a true positive at the LoD concentration.
5. Determine limit of quantification (LoQ): the lowest concentration at which the assay meets the required precision target (typically CV below 20% or below 10% depending on clinical need). Measure precision at multiple low concentrations and identify the concentration where the CV requirement is met.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
