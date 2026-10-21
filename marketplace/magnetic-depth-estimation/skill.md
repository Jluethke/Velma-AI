# Magnetic Depth Estimation

Estimate depth to magnetic sources using Euler deconvolution, Werner deconvolution, or spectral depth analysis.

## Inputs

- `rtp-anomaly`: Reduced-to-pole magnetic anomaly grid
- `source-catalog`: Identified magnetic sources with locations

## Outputs

- `depth-estimates`: Depth to each source with uncertainty ranges
- `depth-method-comparison`: Cross-comparison of depths from multiple methods

## Process

1. Run Euler deconvolution with structural indices for contacts, dikes, and spheres
2. Apply Werner deconvolution along selected profiles crossing key anomalies
3. Use radially averaged power spectrum for average depth to magnetic basement
4. Compare depth estimates from each method and assign confidence based on agreement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
