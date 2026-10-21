# Seismic Hazard Assessment

Compute probabilistic seismic hazard for the study region by combining source models, ground motion models, and site effects.

## Inputs

- `magnitude-catalog`: Catalog with completeness and b-value parameters
- `focal-mechanisms`: Fault characterization data
- `attenuation-model`: Regional attenuation and site amplification

## Outputs

- `hazard-curves`: Annual exceedance probability curves for PGA and spectral accelerations at key periods
- `hazard-map`: Gridded hazard map for the target return periods (475-year, 2475-year)

## Process

1. Build seismic source models: area sources, fault sources, and smoothed seismicity
2. Assign ground motion prediction equations calibrated to the regional attenuation model
3. Run probabilistic seismic hazard analysis using OpenQuake or equivalent engine
4. Generate hazard curves and uniform hazard spectra at target sites and gridded hazard maps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
