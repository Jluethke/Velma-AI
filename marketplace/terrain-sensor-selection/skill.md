# Terrain Sensor Selection

Select and configure the terrain measurement sensor (radar altimeter, lidar, sonar) for profile matching.

## Inputs

- `terrain-database`: Database resolution and accuracy
- `platform-constraints`: Aircraft/vehicle type, altitude, speed, and SWaP limitations

## Outputs

- `terrain-sensor-specification`: Selected sensor with measurement rate, accuracy, footprint, and installation requirements
- `measurement-error-model`: Sensor error characteristics for use in the matching algorithm

## Process

1. For airborne: radar altimeter is the standard terrain sensor. Frequency: typically 4.3 GHz (C-band). Measurement principle: FMCW measures the round-trip time to the ground. Accuracy: 1-3 m over land, degraded over vegetation canopy. Footprint: depends on antenna beamwidth and altitude (e.g., 10 deg beamwidth at 500m AGL gives ~90m footprint). Measurement rate: 10-100 Hz.
2. For higher accuracy: scanning lidar provides dense point clouds but is expensive, heavy, and eye-safe wavelength selection (1550 nm) adds cost. For covert operation, lidar is detectable. For underwater: forward-looking or downward-looking multibeam sonar measures bathymetry.
3. Model the sensor errors. Radar altimeter: bias (calibration residual), noise (from signal processing), footprint averaging (smooths terrain features smaller than the footprint), vegetation penetration uncertainty. For each, estimate the magnitude and whether it is correlated or random across measurements.
4. Determine the measurement rate needed for the matching algorithm. The along-track sample spacing should be comparable to the database posting to capture the same terrain features. At 200 m/s airspeed with 30m database posting, the sensor needs ~7 Hz minimum measurement rate. Higher rates improve robustness through averaging.
5. Document the sensor specification including mounting requirements (nadir-pointing, stabilized or body-fixed), interface to the navigation computer (measurement format, latency, time-tagging relative to INS), and any operational limitations (minimum/maximum altitude, terrain slope limits).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
