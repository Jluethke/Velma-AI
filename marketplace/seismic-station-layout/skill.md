# Seismic Station Layout

Design a seismic station network for a target region, optimizing station spacing, site selection, and data telemetry for detection threshold goals.

## Inputs

- `target-region`: Geographic bounds and tectonic setting of the study area
- `detection-threshold`: Minimum magnitude the network must detect and locate
- `existing-stations`: Inventory of existing seismic stations in and near the region

## Outputs

- `network-design`: Station coordinates, sensor types, and telemetry plan
- `detection-capability`: Modeled detection and location thresholds across the network footprint

## Process

1. Model detection thresholds for the existing network using ambient noise levels and path attenuation
2. Identify coverage gaps where the detection threshold exceeds the target magnitude
3. Place new stations to close gaps, balancing azimuthal coverage against site accessibility
4. Specify sensor type (broadband, short-period, accelerometer) and telemetry (cellular, satellite, radio) per site

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
