# Spectrum Utilization Monitor

Monitor spectrum utilization and identify underused bands.

## Inputs

- `spectrum-inventory`: Spectrum holdings inventory
- `license-timeline`: License renewal timeline

## Outputs

- `utilization-by-band`: Utilization percentage by band and geography
- `refarming-candidates`: Bands identified as candidates for refarming or sharing

## Process

1. Measure traffic and capacity utilization on each band.
2. Identify bands with sustained low utilization (below 30%).
3. Assess whether underused bands could serve higher-demand areas through refarming.
4. Flag bands where spectrum sharing or leasing could generate value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
