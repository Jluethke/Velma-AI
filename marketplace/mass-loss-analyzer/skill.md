# Mass Loss Analyzer

Analyze TGA mass loss steps: identify decomposition stages, measure the mass lost in each step, and assign each to a chemical process.

## Inputs

- `preprocessed-curves`: Mass vs. temperature TGA curve
- `derivative-curve`: DTG (first derivative of mass) for step boundary identification

## Outputs

- `mass-loss-table`: Each step with onset, end, mass loss percentage, and assigned process
- `residue-analysis`: Final residue mass and its probable identity (ash, oxide, carbon)

## Process

1. Compute the DTG (derivative) curve to identify mass loss step boundaries.
2. Determine the temperature range and mass loss percentage for each step.
3. Assign each step to a process: moisture loss, decomposition of organic components, oxidation.
4. Report the final residue mass and infer its composition from the atmosphere and material.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
