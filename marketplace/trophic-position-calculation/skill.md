# Trophic Position Calculation

Calculate the trophic position of each consumer relative to the isotopic baseline.

## Inputs

- `isotope-values`: Consumer delta-15N values
- `baseline-samples`: Baseline organism isotope values
- `study-design`: Trophic discrimination factors to apply

## Outputs

- `trophic-positions`: Estimated trophic position for each consumer species with uncertainty
- `food-chain-length`: Maximum trophic position observed in the food web

## Process

1. Determine the baseline delta-15N from primary consumers or a two-source baseline model
2. Apply the trophic discrimination factor (typically 3.4 per mil per trophic level for delta-15N)
3. Calculate trophic position: TP = baseline_trophic_level + (delta-15N_consumer minus delta-15N_baseline) / discrimination_factor
4. Propagate uncertainty from baseline variability and discrimination factor estimates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
