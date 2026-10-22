# Sensor Suite Selection

Select sensors for the perception stack based on range, resolution, field of view, weather performance, and cost. Compare camera, lidar, radar, ultrasonic, and IMU by their operating envelopes and failure modes.

## Inputs

- `platform-type`: Type of autonomous platform (ground vehicle, drone, marine, industrial robot)
- `operating-environment`: Environmental conditions the system must handle (weather, lighting, dust, vibration)
- `detection-requirements`: Required detection ranges, angular resolution, and object classes

## Outputs

- `sensor-manifest`: List of selected sensors with specifications, mounting locations, and coverage zones
- `coverage-gap-analysis`: Identified blind spots and environmental conditions where sensors degrade

## Process

1. List detection requirements by range band: near-field (0-10m), mid-field (10-100m), far-field (100m+). For each band, identify which object classes must be detected and at what angular resolution.
2. Map each sensor modality to its operating envelope. Camera: high resolution but degrades in low light and direct sun; requires ISP tuning per environment. Lidar: precise 3D geometry, degrades in rain/fog/dust proportional to optical density. Radar: weather-immune for velocity and range, poor angular resolution without MIMO or scanning array. Ultrasonic: near-field only, cheap, works in all weather below 10m. IMU: self-contained motion measurement, drifts without external correction.
3. For each range band, select the primary and backup sensor modality. Primary provides the highest-quality data in nominal conditions. Backup covers the primary's degraded conditions. Every detection requirement must have at least two independent sensor paths.
4. Define mounting locations from the platform geometry. Each sensor needs clear field of view, vibration isolation appropriate to its sensitivity, thermal management if needed (lidar and camera overheat in sun), and cable routing. Document the coverage map as a polar plot showing sensor footprints overlaid.
5. Identify remaining coverage gaps and document them as known limitations of the sensor suite. These become inputs to the operational design domain definition.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
