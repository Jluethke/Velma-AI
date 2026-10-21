# Yield Component Analysis

Harvest, weigh, and analyze yield components (grain weight, biomass, harvest index) with moisture correction.

## Inputs

- `randomization-plan`: Plot map and harvest area per plot
- `phenotype-data`: Maturity and lodging data informing harvest timing

## Outputs

- `yield-data`: Plot yields corrected to standard moisture with yield components
- `harvest-quality`: Test weight, protein, or other quality parameters

## Process

1. Harvest the net plot area at physiological maturity, excluding border rows
2. Weigh grain and biomass, measure moisture, and correct to standard moisture content
3. Subsample for yield components: thousand kernel weight, kernels per spike, spikes per area
4. Measure quality parameters (test weight, protein, oil) on a subsample per plot

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
