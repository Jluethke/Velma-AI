# Chiplet Cost Model

Build a complete cost model for the chiplet-based system and compare to monolithic alternatives.

## Inputs

- `test-plan`: Test sequence and cost per chiplet
- `kgd-yield-model`: KGD yields per chiplet
- `integration-technology`: Packaging technology with associated costs

## Outputs

- `cost-comparison`: Total cost per good package: chiplet vs monolithic, broken down by wafer, test, assembly, and packaging
- `volume-sensitivity`: Cost crossover volume where chiplet approach becomes cheaper than monolithic

## Process

1. Calculate wafer cost per chiplet die: (wafer cost for that process node) / (gross dies per wafer * chiplet yield). Include mask cost amortized over lifetime volume.
2. Add test cost per KGD from the test plan. Include probe card cost amortized, tester time, and handler cost.
3. Add packaging cost: interposer or bridge wafer cost per unit, assembly cost (die attach, reflow, underfill), substrate cost, heat spreader and TIM, lid attach, and final test.
4. Calculate composite yield: product of all KGD yields * assembly yield * package test yield. Total cost per good package = sum of all component costs / composite yield.
5. Compare to monolithic: single die on same leading-edge node, same total function, conventional flip-chip package. Chiplets win when yield loss on large monolithic die exceeds the added packaging cost. Plot cost vs volume to find crossover.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
