# Map Building Pipeline

Build the map from collected sensor data: process mapping runs, optimize the pose graph, generate the map product, and establish quality metrics.

## Inputs

- `slam-architecture`: Selected SLAM algorithm and configuration
- `mapping-data`: Raw sensor data from mapping runs (drives, flights, walks)

## Outputs

- `built-map`: Optimized map with accuracy metadata and coverage documentation
- `map-quality-report`: Quality metrics: consistency, coverage, accuracy against ground truth

## Process

1. Process mapping runs through the SLAM pipeline. Run the selected SLAM algorithm on recorded sensor data. For multi-session mapping: align sessions using common overlap regions, merge into a single consistent map. For large-scale mapping: use hierarchical pose graph optimization (local submaps with global optimization) to manage computational cost. Track the mapping residuals: scan matching scores, feature reprojection errors, GPS consistency. Flag regions where residuals are high for manual review.
2. Optimize the full pose graph. After all mapping sessions are incorporated, run global pose graph optimization (g2o, GTSAM, or Ceres). Include all constraints: odometry edges, loop closure edges, GPS prior edges. Weight each edge by its measurement uncertainty. After optimization, check for remaining inconsistencies: edges with residuals beyond 3 sigma may indicate incorrect loop closures (perceptual aliasing) and should be reviewed or removed.
3. Generate the map product. The raw SLAM output (point cloud or feature map) is the localization map. For autonomous driving, enrich with: lane boundaries and lane connectivity (from lidar reflectivity and camera data), traffic signs and signals (geolocated from detection), road surface type, speed limits. This becomes the HD map. For indoor robots: occupancy grid with room labels and semantic annotations. For drones: 3D mesh or elevation map with no-fly zones.
4. Establish map quality metrics. Absolute accuracy: compare map coordinates to survey-grade ground truth (RTK-GPS control points or total station measurements). Internal consistency: measure the spread of repeat observations of the same feature across sessions. Coverage: verify that every required operating area has sufficient map density for localization. Currency: document the mapping date and change detection methodology for keeping the map updated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
