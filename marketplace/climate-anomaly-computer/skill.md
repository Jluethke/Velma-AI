# Climate Anomaly Computer

Compute anomalies relative to a defined baseline period.

## Inputs

- `homogenized-series`: Homogenized time series
- `baseline-period`: Reference period for computing the climatological mean (e.g. 1961-1990)

## Outputs

- `anomaly-series`: Time series of departures from the baseline climatology
- `climatology`: Monthly or seasonal mean values over the baseline period

## Process

1. Compute the climatological mean for each month or season over the baseline period
2. Subtract the climatology from each observation to produce the anomaly
3. Handle months with insufficient data in the baseline (flag or interpolate)
4. Express anomalies in appropriate units (degrees, mm, percent of normal)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
