# Regional Residual Separation

Separate the Bouguer anomaly into regional (deep) and residual (shallow) components using polynomial fitting or spectral filtering.

## Inputs

- `bouguer-anomaly-map`: Gridded Bouguer anomaly values
- `separation-parameters`: Method choice (polynomial order, filter cutoff wavelength)

## Outputs

- `regional-field`: Long-wavelength component representing deep structure
- `residual-anomaly`: Short-wavelength component representing shallow targets

## Process

1. Select the separation method (polynomial surface fitting, upward continuation, or bandpass filter)
2. Fit the regional field to the Bouguer anomaly grid
3. Subtract the regional from the Bouguer anomaly to obtain the residual
4. Validate that the residual highlights known shallow features and the regional is geologically reasonable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
