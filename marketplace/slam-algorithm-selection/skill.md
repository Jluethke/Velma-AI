# Slam Algorithm Selection

Select the SLAM algorithm based on sensor suite, environment structure, and accuracy requirements: compare visual SLAM, lidar SLAM, and visual-inertial odometry.

## Inputs

- `sensor-suite`: Available sensors for localization (cameras, lidar, IMU, GPS)
- `environment-type`: Indoor/outdoor, structured/unstructured, feature density
- `accuracy-requirements`: Required position and heading accuracy for the application

## Outputs

- `slam-architecture`: Selected SLAM approach with algorithm, parameters, and expected performance
- `map-representation`: Map format and content (point cloud, feature map, occupancy grid, HD map)

## Process

1. Evaluate visual SLAM options. ORB-SLAM3: sparse feature-based, works with monocular, stereo, or RGB-D cameras, good loop closure, struggles in textureless environments. LSD-SLAM / DSO: semi-dense or direct methods, work better in low-texture but higher compute. Visual-Inertial Odometry (VIO): fuse camera with IMU for resilient tracking during fast motion and brief visual dropout (VINS-Mono, MSCKF, OKVIS). VIO is the minimum viable localization for any camera-equipped platform because the IMU bridges gaps in visual tracking.
2. Evaluate lidar SLAM options. Lidar provides geometric accuracy independent of lighting. LOAM/LeGO-LOAM: extract edge and planar features from lidar scans, match features across scans for odometry, build a feature map. ICP-based (KISS-ICP): register consecutive scans using iterative closest point, simple and effective for high-density lidar. NDT-based: represent the environment as normal distributions in a voxel grid, register scans against the distribution. Lidar SLAM gives centimeter-level accuracy in structured environments but degrades in geometrically repetitive spaces (long tunnels, open fields).
3. Evaluate fusion approaches. For most outdoor autonomous platforms, the strongest localization combines: lidar SLAM for geometric accuracy, visual features for place recognition (loop closure), IMU for short-term dead reckoning during sensor gaps, GPS for global reference when available. The fusion should be tightly coupled: IMU predictions initialize the scan matching, visual loop closures correct lidar map drift, GPS fixes anchor the map to a global frame.
4. Select based on the application constraints. Indoor robot with camera only: VIO with sparse visual SLAM. Outdoor vehicle with lidar and camera: lidar SLAM with visual loop closure and IMU integration. Drone in GPS-denied environment: VIO primary, lidar-aided if equipped. Document the selected architecture, expected accuracy (position RMS, heading RMS), and known failure modes (e.g., performance in rain for lidar, in darkness for camera).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
