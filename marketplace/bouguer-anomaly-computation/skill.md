# Bouguer Anomaly Computation

Compute Bouguer anomaly by applying the Bouguer slab and terrain corrections to the reduced gravity values.

## Inputs

- `reduced-gravity-values`: Gravity values after drift, tidal, latitude, and free-air corrections
- `terrain-model`: Digital elevation model surrounding the survey area

## Outputs

- `bouguer-anomaly-map`: Map of Bouguer anomaly values at each station
- `terrain-correction-values`: Terrain correction computed for each station

## Process

1. Apply the Bouguer slab correction using an assumed near-surface density (typically 2.67 g/cc)
2. Compute terrain corrections using the DEM for near-zone and far-zone topographic effects
3. Subtract the normal gravity field to obtain the Bouguer anomaly at each station
4. Grid the anomaly values and produce a contour map

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
