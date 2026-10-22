# Optical Tolerance Analysis

Assign fabrication and assembly tolerances to each optical element and verify that the as-built performance meets the specification with the required yield.

## Inputs

- `lens-prescription`: Nominal surface data for every element
- `mtf-curves`: Nominal MTF performance to establish the degradation budget

## Outputs

- `tolerance-table`: For each element: radius tolerance, thickness tolerance, tilt, decenter, wedge, surface irregularity, index tolerance, Abbe number tolerance, with the sensitivity (waves/unit) for each
- `compensator-strategy`: Which elements or spacings adjust during assembly to recover performance, and the range of adjustment needed

## Process

1. Run a sensitivity analysis: perturb each parameter one at a time by a standard manufacturing tolerance and record the change in wavefront error or MTF. Rank the parameters by sensitivity.
2. For radius of curvature, start with test-plate tolerances for spherical surfaces (3 fringes = 0.15% on radius for standard, 1 fringe = 0.05% for precision). For aspheric surfaces, specify the departure from best-fit sphere and the slope error.
3. Assign tighter tolerances to the most sensitive parameters. Use a cost model: standard (low cost), precision (2x), high-precision (5x). Iterate to find the minimum-cost assignment that meets the performance budget.
4. Run a Monte Carlo analysis with 1000+ random draws from the tolerance distributions. Compute the cumulative probability of meeting the MTF specification. Target: 90% yield or better.
5. Identify 1-2 compensators (usually a spacer thickness or a lens axial position) that can be adjusted during assembly. Re-run Monte Carlo with compensation and verify that yield improves to the required level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
