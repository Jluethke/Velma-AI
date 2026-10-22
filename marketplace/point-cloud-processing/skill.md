# Point Cloud Processing

Process 3D lidar point clouds: ground segmentation, clustering for object detection, and geometric feature extraction.

## Inputs

- `lidar-specifications`: Lidar specs including point density, range, and scan pattern
- `processed-image-stream`: Camera data for cross-modal validation

## Outputs

- `ground-segmented-cloud`: Point cloud with ground points labeled and removed from obstacle detection
- `object-clusters`: Clustered point groups with bounding boxes, dimensions, and geometric features

## Process

1. Ground segmentation. The ground surface must be removed before object clustering to prevent ground points from merging with nearby objects. Methods: RANSAC plane fitting (fast, works for flat ground, fails on hills and curbs), sector-based ground estimation (divide the point cloud into angular sectors, fit a line to the lowest points in each sector, handles slopes), Patchwork/Patchwork++ (ground likelihood estimation per patch, handles uneven terrain). Select based on terrain complexity. Validate by checking that known ground points (road surface) are correctly labeled and known obstacles (curbs, barriers) are not removed.
2. Cluster non-ground points into object candidates. Euclidean clustering (DBSCAN or connected-components on a voxel grid): set the distance threshold based on point density at the expected detection range. At 50m, lidar points on a car may be 0.5m apart, so the clustering threshold must accommodate this. Problem: under-segmentation (two nearby objects merged) and over-segmentation (one object split across scan lines). Mitigate under-segmentation by using adaptive thresholds that increase with range. Mitigate over-segmentation by using scan-line-aware connectivity.
3. Extract geometric features from each cluster. Compute: oriented bounding box (minimum-volume OBB from PCA or L-shape fitting), cluster dimensions (length, width, height), point count and density, centroid position, intensity statistics. L-shape fitting is important for vehicles: fit two perpendicular lines to the visible edges to estimate the full vehicle footprint from a partial view. These features feed into classification and tracking.
4. Cross-validate with camera data. Project each lidar cluster's centroid into the camera image using the calibrated extrinsic transform. Check that the projected position falls within or near a camera detection bounding box. Clusters that have no camera support may be false alarms (ground clutter, vegetation) or objects the camera missed (dark objects, small objects). Use the cross-modal agreement to adjust detection confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
