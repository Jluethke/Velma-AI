# Perception Lidar Ground Removal with Open3D RANSAC (Python)

**One-line description:** Loads lidar sweeps (KITTI `.bin` or `.pcd`), crops and voxel-downsamples them, removes the ground with Open3D `segment_plane` RANSAC constrained by the sensor mounting height and plane normal check, and verifies the result with measured inlier statistics and saved views.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `point_cloud_dir` (string, required): Folder of lidar sweeps recorded from the user's own sensor or a public dataset.
- `lidar_mount` (object, required): Sensor mounting height above ground in meters and its axis convention (for KITTI Velodyne: x forward, y left, z up), from the vehicle setup or dataset calibration.

---

## Outputs

- `py_nonground_clouds` (string): Folder of non-ground point clouds (`.pcd`), one per sweep.
- `py_ground_report` (object): Per sweep: plane coefficients, inlier count, normal angle to the vertical axis, plane height at the sensor origin, and parameters with sources.

---

## Phase 1: Load and Prepare

### Entry Criteria
- Recording was done on a vehicle the user owns or comes from a public dataset. This flow processes recorded data only and sends nothing to any vehicle.
- `pip install open3d numpy` succeeds; record the Open3D version.

### Actions
1. KITTI `.bin`: `pts = np.fromfile(p, dtype=np.float32).reshape(-1, 4)` (x, y, z, reflectance). `.pcd` or `.ply`: `o3d.io.read_point_cloud(p)`.
2. Build `pcd = o3d.geometry.PointCloud(); pcd.points = o3d.utility.Vector3dVector(pts[:, :3].astype(np.float64))`.
3. Crop to a region of interest the user defines with `pcd.crop(o3d.geometry.AxisAlignedBoundingBox(min_b, max_b))`, and remove points on the vehicle itself (a box around the origin).
4. Downsample with `pcd.voxel_down_sample(voxel_size)`, voxel size from the user. Record raw and downsampled point counts.

### Output
Prepared clouds.

### Quality Gate
- Raw and downsampled counts printed for the first five sweeps.

---

## Phase 2: Segment the Ground Plane

### Entry Criteria
- Prepared clouds exist.

### Actions
1. Prefilter candidates near the expected ground: keep points with `z` within a band around `-mount_height` (band width from the user) for plane fitting only. This stops RANSAC from picking a wall or a truck side.
2. `plane, inliers = cand.segment_plane(distance_threshold=dist_thr, ransac_n=3, num_iterations=n)`, with `dist_thr` and `n` from the user; record them. `plane` is `[a, b, c, d]` for `ax + by + cz + d = 0` (this `d` is the plane offset, not the threshold).
3. Check the normal: angle between `(a, b, c)` and the vertical axis. If it exceeds the user's limit, reject the fit for that sweep and record it; do not keep a tilted plane.
4. Remove ground from the full cloud by distance to the plane: keep points with `abs(a*x + b*y + c*z + d) / norm(a,b,c) > dist_thr`, so ground points outside the prefilter band are also removed.
5. Know the limit: one plane does not fit hills, ramps or curbs at range. If the report shows failures on slopes, split the area into range bins and fit a plane per bin (the approach of patchwork-style methods), or use a published ground segmentation library; record the choice.

### Output
Ground and non-ground clouds.

### Quality Gate
- Every sweep has a normal angle and plane height printed; rejected sweeps are listed.

---

## Phase 3: Verify and Save

### Entry Criteria
- Segmentation finished.

### Actions
1. For each sweep check that `|d / c|` (plane height at the origin) is close to `mount_height`; print the difference.
2. Save non-ground clouds with `o3d.io.write_point_cloud(out, ng)`.
3. Render five sweeps with ground in one color and the rest in another (`o3d.visualization.draw_geometries` or headless rendering) and save screenshots for review.

### Output
`py_nonground_clouds`, `py_ground_report`.

### Quality Gate
- Plane height difference per sweep printed; sweeps beyond the user tolerance are listed.
- Five review images saved.

---

## Worked Example

Illustrative only. KITTI sweep 000010, 121,015 raw points, `voxel_size=0.1` gives 54,302. Mount height 1.73 m (KITTI setup). Prefilter band from user. `segment_plane(distance_threshold=0.15, ransac_n=3, num_iterations=200)` gives plane `[0.008, -0.004, 0.99996, 1.712]`, normal angle 0.5 degrees, height 1.712 m vs 1.73 m. Non-ground 18,944 points.

---

## Exit Criteria

DONE when every sweep has a ground plane with a checked normal and height, or a recorded rejection, and non-ground clouds are saved.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `.bin` reshape fails | **Stop**: the file is not 4-float records; check the sensor format. |
| Phase 2 | Plane normal tilted | **Adjust** the prefilter band and **Retry** that sweep; else record rejection. |
| Phase 2 | Slopes fail regularly | **Return** with the per-bin plane option for the user to choose. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
