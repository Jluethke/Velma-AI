# Circulation Pattern Analysis

Identify dominant circulation patterns in the residual current using EOF analysis, progressive vector diagrams, and seasonal statistics.

## Inputs

- `residual-current`: Non-tidal residual current velocities
- `wind-and-pressure-data`: Concurrent wind and atmospheric pressure records for forcing analysis

## Outputs

- `circulation-patterns`: Dominant modes of variability, progressive vector diagrams, and seasonal statistics
- `forcing-correlations`: Correlations between residual current and wind/pressure forcing

## Process

1. Compute progressive vector diagrams to visualize net transport direction and magnitude
2. Run EOF analysis on multi-depth current profiles to identify dominant vertical modes
3. Compute seasonal mean current roses and statistics
4. Correlate residual current with wind speed, direction, and atmospheric pressure to identify forcing mechanisms

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
