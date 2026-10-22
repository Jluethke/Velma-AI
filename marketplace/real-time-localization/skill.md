# Real Time Localization

Implement real-time localization against the built map: match live sensor data to the map, fuse with IMU and GPS, handle degraded conditions, and output a localization state with uncertainty.

## Inputs

- `built-map`: Pre-built localization map
- `slam-architecture`: SLAM algorithm for live matching

## Outputs

- `localization-system`: Real-time localization pipeline with map matching, sensor fusion, and integrity monitoring
- `localization-accuracy`: Expected accuracy under nominal and degraded conditions

## Process

1. Implement map matching. Load the relevant map section based on approximate position (from GPS or last known position). Match the current sensor observation against the map. For lidar: scan-to-map registration using ICP or NDT with the map as the target. For camera: match extracted features against map features using descriptor matching and PnP pose estimation. The map match provides an absolute position fix with known accuracy (from the map quality metrics).
2. Fuse map match with dead reckoning. Between map matches, propagate the state using IMU integration (for short periods) or wheel odometry (for ground vehicles). The fusion filter (EKF or factor graph) combines: IMU predictions (high rate, drifts), wheel odometry (medium rate, slip errors), map matches (lower rate, high accuracy), GPS when available (variable accuracy, check consistency before accepting). The filter output is the fused position, heading, and velocity with covariance at the control loop rate.
3. Handle degraded localization conditions. GPS multipath in urban canyons: detect by checking consistency between GPS and map-matched position, reject GPS fixes that disagree. Lidar degradation in rain or dust: detect by monitoring scan matching score, increase reliance on camera and IMU. Camera degradation in darkness: switch to lidar-primary, increase IMU weight. Total sensor degradation (e.g., dense fog): coast on IMU with growing uncertainty, reduce speed and prepare for controlled stop when uncertainty exceeds the safety threshold.
4. Monitor localization integrity. The system must know when its position estimate is unreliable. Implement integrity monitoring: compute the protection level (the bound on the position error at a specified confidence level, analogous to GNSS integrity). If the protection level exceeds the alert limit (the maximum tolerable error for safe operation), declare a localization failure and initiate a safe response. Log localization telemetry for offline analysis: position, covariance, sensor availability, matching scores.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
