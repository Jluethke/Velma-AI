# Polymer Thermal Analysis

Characterize thermal transitions (Tg, Tm, Td) by DSC and TGA to define processing and service temperature windows.

## Inputs

- `mw-distribution`: Molecular weight data for the sample
- `target-properties`: Required service temperature range

## Outputs

- `thermal-properties`: Glass transition (Tg), melting point (Tm), crystallinity, and decomposition onset (Td)
- `processing-window`: Recommended processing temperature range based on thermal data

## Process

1. Run DSC with heat-cool-heat cycle to erase thermal history and identify Tg and Tm
2. Calculate percent crystallinity from the melting enthalpy against 100% crystalline reference
3. Run TGA from ambient to 600C to determine decomposition onset and char yield
4. Define the processing window between Tm (or Tg + 100C for amorphous) and Td

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
