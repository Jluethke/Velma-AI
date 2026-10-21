# Reaction Intermediate Identifier

Identify reaction products and intermediates using spectroscopic and chromatographic techniques.

## Inputs

- `reaction-mixture-samples`: Time-resolved aliquots from the reaction at various conversions
- `analytical-methods`: Available techniques: NMR, MS, IR, UV-Vis, GC, HPLC

## Outputs

- `intermediate-catalog`: List of detected species with structural assignments and retention times or chemical shifts
- `temporal-profiles`: Concentration vs time profiles for each identified species

## Process

1. Analyze aliquots by the selected analytical methods at each time point
2. Assign molecular structures to detected signals using spectral databases and fragmentation patterns
3. Track the appearance and disappearance of each species over time
4. Build the temporal concentration profile for starting material, intermediates, and products

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
