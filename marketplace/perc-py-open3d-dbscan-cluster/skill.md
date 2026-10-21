# Perception Lidar Object Clustering with Open3D DBSCAN (Python)

**One-line description:** Clusters non-ground lidar points into object candidates with Open3D `cluster_dbscan`, filters clusters by point count and box size from user limits, fits oriented boxes, and measures cluster quality against labeled 3D boxes when available.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_nonground_clouds` (string, required): Non-ground `.pcd` files from the Open3D ground removal flow.
- `cluster_params` (object, required): `eps` (meters), `min_points`, and size limits (min and max box extents), all from the user with a reason each.

---

## Outputs

- `py_lidar_clusters` (string): JSON per sweep: cluster id, point indices count, centroid, axis-aligned and oriented box, and the min and max range.

---

## Phase 1: Cluster

### Entry Criteria
- Non-ground clouds exist and the ground report has no unresolved failures for the sweeps used.

### Actions
1. `labels = np.array(pcd.cluster_dbscan(eps=eps, min_points=min_points, print_progress=False))`. Label `-1` is noise.
2. Know DBSCAN's range problem: lidar point spacing grows with range, so one `eps` over-segments far objects and merges near ones. If the user cares about long range, split the cloud into range rings and use a per-ring `eps` the user supplies; record the rings.
3. Record cluster count and noise point count per sweep.

### Output
Labels per point.

### Quality Gate
- Per-sweep cluster and noise counts printed for five sweeps.

---

## Phase 2: Filter and Box

### Entry Criteria
- Labels exist.

### Actions
1. For each label `k >= 0`: `c = pcd.select_by_index(np.where(labels == k)[0])`.
2. Box: `aabb = c.get_axis_aligned_bounding_box()`; `obb = c.get_oriented_bounding_box()`. For vehicles a box with yaw only is usually wanted; the Open3D OBB rotates in 3D, so if you need yaw-only, fit a 2D minimum-area rectangle on x, y with `cv2.minAreaRect` and take z extent separately.
3. Drop clusters outside the user size limits; count drops per reason.
4. Do NOT label clusters as classes ("car", "pedestrian") from size alone in this flow; class comes from camera fusion or a learned 3D detector.

### Output
Filtered clusters with boxes.

### Quality Gate
- Every kept cluster has a centroid, AABB and yaw box; drop counts per reason printed.

---

## Phase 3: Measure Against Labels and Time

### Entry Criteria
- Filtered clusters exist.

### Actions
1. If 3D labels exist (KITTI `label_2` boxes are in rectified camera coordinates; transform them to lidar coordinates with the inverse of `R0_rect` then the inverse of `Tr_velo_to_cam`, both as 4x4 matrices), count labeled objects in range that contain one or more cluster centroids (recall proxy) and clusters that match no label (false cluster count). State that this is a clustering diagnostic, not a 3D detection AP.
2. Time `cluster_dbscan` per sweep with `time.perf_counter`; report median and p99. Open3D DBSCAN cost grows with point count; record counts with times.
3. Write `py_lidar_clusters`.

### Output
`py_lidar_clusters`.

### Quality Gate
- Recall proxy and false cluster count printed when labels exist, or "no labels" recorded.
- Median and p99 time with point counts printed.

---

## Worked Example

Illustrative only. Sweep 000010, 18,944 non-ground points. `eps=0.5`, `min_points=10` (user). 47 clusters, 1,102 noise points. Size limits drop 19 (too large: building facades). 28 kept. Against 9 labeled Cars and Pedestrians within 40 m: 8 contain a centroid. DBSCAN median 21 ms, p99 34 ms.

---

## Exit Criteria

DONE when every sweep has filtered clusters with boxes, diagnostic counts against labels are recorded when labels exist, and clustering time is measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All points in one cluster | **Adjust**: check ground removal first, then `eps` with the user. |
| Phase 2 | Many clusters dropped as too large | **Return** the drop list; ground or walls may remain. |
| Phase 3 | Time too high for the budget | **Adjust** voxel size upstream or move to the C++ PCL flow, then remeasure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
