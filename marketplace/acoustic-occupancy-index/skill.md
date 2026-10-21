# Acoustic Occupancy Index

Compute acoustic indices and occupancy estimates to characterize overall soundscape activity.

## Inputs

- `detection-summary`: Detections per class per recording
- `acoustic-features`: Feature table for all events

## Outputs

- `acoustic-indices`: ACI, bioacoustic index, NDSI, and species-specific occupancy estimates
- `temporal-patterns`: Diel and seasonal activity patterns per species or sound class

## Process

1. Compute landscape-level indices (ACI, H, NDSI) per time bin.
2. Estimate single-season occupancy for target species accounting for imperfect detection.
3. Plot diel activity patterns (detections per hour across the 24-hour cycle).
4. Plot seasonal trends if multi-month data are available.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
