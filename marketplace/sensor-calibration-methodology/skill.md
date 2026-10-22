# Sensor Calibration Methodology

Calibrate the sensor suite: intrinsic parameters for each sensor, extrinsic transforms between all sensor pairs, and temporal synchronization across the suite.

## Inputs

- `sensor-manifest`: Selected sensors with specifications and mounting locations
- `coverage-gap-analysis`: Known coverage gaps to verify after calibration

## Outputs

- `calibration-parameters`: Intrinsic and extrinsic calibration results for every sensor and sensor pair
- `synchronization-config`: Timing synchronization configuration including trigger scheme and latency compensation

## Process

1. Intrinsic calibration for each sensor independently. Camera: checkerboard or ChArUco board, capture 30+ images at varied poses, solve for focal length, principal point, and distortion coefficients (Brown-Conrady model). Verify reprojection error below 0.5 pixels. Lidar: verify point cloud accuracy against known targets at multiple ranges, characterize range bias and angular offset. Radar: measure range and angle accuracy against corner reflectors at known positions. IMU: static bias estimation (gravity alignment), Allan variance analysis for gyro drift and accelerometer noise.
2. Extrinsic calibration between sensor pairs. Camera-lidar: use a planar target visible to both modalities, solve the rigid body transform (rotation and translation) by minimizing point-to-plane distance in the camera frame. Camera-radar: use corner reflectors with visual fiducials, solve for the 6-DOF transform. Camera-camera: stereo calibration with overlapping checkerboard views. Lidar-IMU: use hand-eye calibration formulation from motion sequences. Verify every transform by projecting one sensor's data into the other's frame and measuring alignment residual.
3. Temporal synchronization. Determine each sensor's trigger mechanism: hardware trigger (PPS from GPS), software trigger (ROS timestamp), or free-running with timestamp interpolation. Measure the latency from physical event to timestamp for each sensor. Implement a common time base using PTP (IEEE 1588) or GPS PPS. For sensors that cannot be hardware-triggered, measure and compensate for the latency offset. Verify synchronization by recording a fast-moving calibration target and checking cross-sensor temporal alignment.
4. Validate the full calibration by running a field test with known reference objects. Check that fused data aligns within specification: lidar points project onto camera images within 2-3 pixels, radar detections correspond to lidar clusters within one range resolution cell. Document calibration date, conditions, and residuals for every parameter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
