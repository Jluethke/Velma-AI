# Scene Understanding Mapping

Build scene understanding from tracked objects: free space estimation, occupancy grid mapping, semantic segmentation for drivable area, and scene-level reasoning.

## Inputs

- `tracked-objects`: Tracked object list with states and uncertainty
- `ground-segmented-cloud`: Lidar point cloud with ground labeled
- `processed-image-stream`: Camera image stream for semantic segmentation

## Outputs

- `scene-model`: Complete scene representation including free space, occupancy grid, drivable area, and lane structure
- `scene-confidence`: Per-cell confidence in the scene model for planning to use

## Process

1. Build the occupancy grid. Discretize the area around the platform into a 2D grid (typical resolution: 0.1-0.2m for parking, 0.5m for highway). For each lidar scan, ray-trace from the sensor through each cell: cells hit by a lidar return are marked occupied, cells the ray passed through are marked free, cells beyond the return are unknown. Update the grid probabilistically using a log-odds formulation (inverse sensor model). The log-odds representation handles repeated observations naturally: cells observed as free many times become confidently free.
2. Estimate free space from both lidar and camera. Lidar free space: the boundary between the last free cell and the first occupied cell in each radial direction. Camera free space: use a trained network for free space segmentation on the ground plane, project the result into world coordinates using the known camera-ground geometry. Fuse lidar and camera free space estimates: take the more conservative (closer) boundary where they disagree, take either where only one sensor has coverage.
3. Run semantic segmentation for drivable area. Use a trained segmentation network (DeepLab, SegFormer, or similar) on camera images to classify each pixel: road, sidewalk, lane marking, curb, vegetation, building, sky. Project the road/sidewalk classification onto the ground plane to define the drivable area boundary. Compare with the occupancy grid: the drivable area should be a subset of the free space. Where they disagree, investigate (e.g., occupancy grid shows free space on a sidewalk, but it is not drivable).
4. Assemble the scene model. Combine: occupancy grid (where things are), free space boundary (where the platform can physically go), drivable area (where the platform is allowed to go), tracked objects (what is moving and where), lane structure (from HD map or lane detection). Output a unified scene representation that the motion planner consumes. Attach confidence to each element: high confidence for cells observed by multiple sensors, lower confidence for single-sensor observations, lowest for extrapolated regions. The planner uses confidence to modulate its safety margins.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
