# Column Hydraulic Design

Perform detailed hydraulic design for the column including tray layout, downcomer sizing, and pressure drop verification.

## Inputs

- `column-diameter`: Column diameter from flooding analysis
- `internals-type`: Selected tray or packing type
- `actual-stages`: Number of actual stages or packed sections

## Outputs

- `tray-layout`: Tray spacing, hole area, downcomer area, weir height and length
- `pressure-drop-profile`: Pressure drop per stage and total column pressure drop
- `hydraulic-operating-range`: Operating diagram showing flooding, weeping, entrainment, and downcomer backup limits

## Process

1. Set tray spacing: 450 to 600 mm is standard. Closer spacing reduces column height but increases entrainment. Check that downcomer residence time exceeds 3 to 5 seconds for froth disengagement.
2. Size downcomer area: minimum 10% of column cross-section for moderate liquid loads. Calculate downcomer backup: h_dc = h_t + h_w + h_ow + h_hg + h_da. Backup must not exceed 50% of tray spacing to prevent flooding.
3. For sieve trays: set hole diameter (5 to 12 mm), hole area (5% to 15% of active area), weir height (25 to 75 mm). Calculate dry tray pressure drop h_d = 0.186*(V_h/C_o)^2 * (rho_V/rho_L). Calculate wet tray drop by adding weir crest and residual head.
4. Check weeping: the minimum vapor velocity through holes must exceed the weeping velocity. Plot operating range on a hydraulic diagram with flooding as upper limit and weeping as lower limit. The turndown ratio is the ratio of max to min vapor flow within the operating envelope.
5. For packed columns: calculate pressure drop from the Robbins or Kister-Gill correlation. Check for flooding (typically the pressure drop at which liquid holdup increases sharply, around 2 to 3 inches H2O per foot of packing). Verify adequate liquid distribution (minimum 4 to 12 irrigation points per square foot).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
