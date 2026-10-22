# Catalyst Screening And Selection

Screen candidate catalysts and select the best performer for the target reaction.

## Inputs

- `target-reaction`: Reaction to catalyze with desired selectivity
- `operating-constraints`: Temperature, pressure, and feed composition constraints

## Outputs

- `catalyst-candidates`: Ranked list of catalyst formulations with activity and selectivity data
- `selected-catalyst`: Best catalyst with justification for selection

## Process

1. Define screening metrics: conversion at fixed temperature and space velocity, selectivity to desired product, and stability over a minimum run time (typically 100 hours). Weight the metrics according to process priorities.
2. Design the screening experiment using design of experiments: vary catalyst composition (active metal loading, promoter, support) as factors. Use a fractional factorial or Plackett-Burman design for initial screening if many candidates exist.
3. Test in a differential reactor (low conversion, less than 10%) to measure intrinsic activity without transport artifacts. Operate at the same GHSV, temperature, and pressure as the intended industrial conditions.
4. Rank catalysts by turnover frequency (moles converted per active site per second), not just conversion, to account for differences in active site density. Use chemisorption (H2, CO, or probe molecule) to count active sites.
5. Select the catalyst considering not just activity and selectivity but also: cost of active metal, mechanical strength (crush test for fixed bed), attrition resistance (for fluidized bed), thermal stability, and tolerance to feed impurities.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
