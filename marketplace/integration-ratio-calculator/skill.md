# Integration Ratio Calculator

Integrate each resonance to determine the relative number of protons: compute integral ratios and check against the molecular formula.

## Inputs

- `processed-spectrum`: The spectrum for integration
- `peak-list-nmr`: Peak positions defining integration regions

## Outputs

- `integration-table`: Each resonance with its integral value and assigned proton count
- `integral-consistency`: Whether the total proton count matches the molecular formula

## Process

1. Define integration regions around each resonance or group of overlapping resonances.
2. Compute the integral (area under the curve) for each region.
3. Normalize to the smallest integral and round to find relative proton ratios.
4. Compare the total proton count to the molecular formula to verify consistency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
