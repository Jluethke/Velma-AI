# Climate Data Acquirer

Acquire and quality-control climate time series data.

## Inputs

- `station-ids`: Weather station identifiers or gridded product names
- `time-period`: Start and end dates for the analysis
- `variables`: Climate variables to analyze (temperature, precipitation, etc.)

## Outputs

- `raw-climate-series`: Time series data with metadata for each station or grid point
- `initial-qc-flags`: Flagged values failing gross error checks (physical limits, temporal consistency)

## Process

1. Download data from the source (GHCN, ERA5, station archives)
2. Apply gross error checks: physical limits, temporal consistency, spatial coherence
3. Flag suspect values but do not remove them yet
4. Document data sources, versions, and access dates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
