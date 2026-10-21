# Substrate Consumption Tracker

Track substrate consumption: compute consumption rates, identify limiting substrates, and detect feed depletion or accumulation events.

## Inputs

- `time-course-data`: Substrate concentrations vs. time
- `phase-boundaries`: Growth phases for rate contextualization

## Outputs

- `consumption-profiles`: Each substrate with its consumption rate in each growth phase
- `limiting-substrate`: Which substrate is depleted first and when

## Process

1. Compute the specific substrate consumption rate (qs) in each growth phase.
2. Identify which substrate is depleted first (the likely growth-limiting substrate).
3. Check for substrate accumulation events (feeding faster than consumption).
4. Compute the biomass yield on each substrate: Yx/s = delta_X / delta_S.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
