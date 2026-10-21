# Ae Event Filtering Location

Filter noise from genuine AE events and locate the sources on the structure.

## Inputs

- `raw-ae-data`: All recorded hits
- `sensor-layout`: Sensor positions and measured wave velocities

## Outputs

- `located-events`: AE events with computed source coordinates and location accuracy estimates
- `noise-rejected`: Hits classified as electromagnetic interference, friction, or mechanical noise

## Process

1. Apply amplitude, duration, and frequency filters to remove obvious noise hits
2. Use arrival time differences between sensors to compute source locations (triangulation)
3. Discard events that do not meet the minimum sensor trigger criterion for valid location
4. Map located events onto the structure geometry

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
