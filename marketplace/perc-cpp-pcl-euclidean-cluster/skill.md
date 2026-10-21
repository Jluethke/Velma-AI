# Perception Lidar Object Clustering with PCL Euclidean Cluster Extraction (C++)

**One-line description:** Clusters non-ground lidar points in C++ with `pcl::EuclideanClusterExtraction` over a `pcl::search::KdTree`, applies user size limits, computes yaw-only boxes, and measures timing in a Release build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_nonground_clouds` (string, required): Non-ground `.pcd` files from the PCL ground removal flow.
- `cluster_params` (object, required): Cluster tolerance (meters), min and max cluster size (points), and box size limits, from the user with a reason each.

---

## Outputs

- `cpp_lidar_clusters` (string): JSON per sweep: cluster id, point count, centroid, axis-aligned box, yaw box, and min and max range.

---

## Phase 1: Extract Clusters

### Entry Criteria
- Release build of the PCL project from the ground removal flow; add `search` and `kdtree` to the `find_package(PCL ... COMPONENTS ...)` list.

### Actions
1. `pcl::search::KdTree<pcl::PointXYZI>::Ptr tree(new pcl::search::KdTree<pcl::PointXYZI>); tree->setInputCloud(cloud);`
2. `pcl::EuclideanClusterExtraction<pcl::PointXYZI> ec; ec.setClusterTolerance(tol); ec.setMinClusterSize(min_pts); ec.setMaxClusterSize(max_pts); ec.setSearchMethod(tree); ec.setInputCloud(cloud); std::vector<pcl::PointIndices> clusters; ec.extract(clusters);`
3. Same range problem as DBSCAN: one tolerance over-segments far objects. If needed, run extraction per range ring with a user tolerance per ring and record it.
4. Points not in any cluster (too small clusters) are noise; count them.

### Output
Cluster index lists.

### Quality Gate
- Cluster count and noise count printed for five sweeps.

---

## Phase 2: Boxes and Filters

### Entry Criteria
- Clusters extracted.

### Actions
1. Centroid with `pcl::compute3DCentroid(*cloud, idx, centroid)`; axis-aligned extent with `pcl::getMinMax3D(*cloud, idx, min_pt, max_pt)`.
2. Yaw box: project cluster points to x, y and run `cv::minAreaRect` (OpenCV) on them, or compute the principal axis of the x, y covariance with `pcl::computeCovarianceMatrixNormalized` restricted to 2D; record which. z extent comes from `getMinMax3D`.
3. Drop clusters outside the size limits; count per reason.
4. Write JSON with a library such as `nlohmann/json`.

### Output
Filtered clusters.

### Quality Gate
- Every kept cluster has centroid, AABB and yaw box; drop counts printed.

---

## Phase 3: Time and Cross-Check

### Entry Criteria
- Filtered clusters exist.

### Actions
1. Time tree build and `extract` separately with `std::chrono::steady_clock`; report median and p99 with point counts.
2. If 3D labels exist, compute the same recall proxy as the Python flow (labeled boxes containing a centroid) and the count of unmatched clusters, and state it is a diagnostic.
3. If the Python stack also ran, compare cluster counts on the same five sweeps; differences come from DBSCAN `min_points` core-point rules vs Euclidean connectivity. Record, do not force equality.

### Output
`cpp_lidar_clusters`.

### Quality Gate
- Timing table and the diagnostic counts (or "no labels") printed.

---

## Worked Example

Illustrative only. Sweep 000010, 18,890 points. Tolerance 0.5 m, min 10, max 25,000 points (user). 44 clusters, 17 dropped by size, 27 kept. Tree build median 2.2 ms, extract median 4.9 ms, p99 7.3 ms. Recall proxy 8 of 9 labeled objects.

---

## Exit Criteria

DONE when clusters with boxes exist per sweep, size drops are counted, and Release-build timing is measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Clusters capped at max size and split | **Adjust** max size with the user; a capped cluster is silently dropped by PCL. |
| Phase 2 | Yaw box unstable on small clusters | **Adjust**: report AABB only for clusters below a user point count. |
| Phase 3 | Timing far above Python | **Stop**: check the build type and that the KdTree is built once per sweep. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
