# Sensor Degradation Detection

Build sensor health monitoring and graceful degradation: detect when a sensor is providing unreliable data, switch to backup sensor paths, and communicate reduced capability to downstream systems.

## Inputs

- `filter-design`: State estimation filter with expected measurement residuals
- `fusion-architecture`: Fusion architecture with sensor data paths
- `computational-budget`: Processing time allocation

## Outputs

- `degradation-detection-system`: Sensor health monitoring rules, thresholds, and fallback modes for each sensor
- `reduced-capability-matrix`: Map of which capabilities are lost when each sensor or sensor combination fails

## Process

1. Define health metrics for each sensor. Camera: exposure histogram (saturation or underexposure), blur metric (Laplacian variance), frame drop rate, detection count consistency. Lidar: point count per scan, range noise level, return intensity consistency, self-interference detection. Radar: target count, false alarm rate, SNR trend, interference detection. IMU: bias stability monitoring, vibration spectral content, temperature drift. For each metric, establish normal operating ranges from field data.
2. Implement per-sensor anomaly detection. Monitor each health metric in a sliding window. Flag a sensor as degraded when any metric exceeds its threshold for more than N consecutive frames (N chosen to avoid false alarms from transient events like passing through a puddle). Flag a sensor as failed when data stops arriving or consistently fails sanity checks (e.g., lidar returns zero points, camera image is black).
3. Design fallback modes. For each sensor failure combination, define which detection capabilities are retained and which are lost. Single camera failure: switch to adjacent camera or lidar-only detection in that sector. Single lidar failure: camera-based 3D estimation (monocular depth) with degraded range accuracy. Radar failure: lose direct velocity measurement, rely on track-based velocity estimation. IMU failure: rely on visual/lidar odometry with degraded latency response. Document the reduced capability for each failure mode.
4. Communicate degradation to downstream systems. The sensor fusion module outputs a capability status alongside the fused object list. Downstream planning and control systems use the capability status to adjust their behavior: widen safety margins, reduce speed, limit operational domain. If degradation reduces capability below the minimum for the current operating condition, initiate a transition to a minimal risk condition (e.g., slow down and pull over).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
