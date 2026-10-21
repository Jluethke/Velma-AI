# Camera-Lidar Extrinsics from Board Plane Correspondences

**One-line description:** Estimates the lidar-to-camera transform from a checkerboard held still at several poses by matching the board plane seen by the camera (cv2.solvePnP) to the board plane fitted in the lidar cloud (Open3D segment_plane), solving rotation by SVD on normals and translation by least squares, then verifying with a point-to-image overlay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_intrinsics` (object, required): From `vsens-intrinsics-acceptance`, verdict ACCEPT.
- `lidar_stream_report` (object, required): From `vsens-lidar-driver-pointcloud`.
- `static_board_bag` (string, required): A recording with the image and point cloud topics where the board is held still at each pose for several frames. Static poses remove the need for tight time sync in this flow.

---

## Outputs

- `camera_lidar_extrinsics` (object): `T_cam_lidar` 4x4, the number of poses used, per-pose plane residuals (camera plane vs transformed lidar board points, in meters), the overlay image paths, and the tape-measured offset for comparison.

---

## Phase 1: Extract Planes per Pose

### Entry Criteria
- At least three board poses with non-parallel normals exist in the bag; more poses tilted in different directions constrain rotation better.
- `python3 -c "import cv2, open3d, numpy"` succeeds.

### Actions
1. For each pose, take one image and the point cloud nearest in time from the static segment.
2. Camera plane: detect corners, call `cv2.solvePnP(objp, corners, K, D)`, convert `rvec` with `cv2.Rodrigues`. The board normal in the camera frame is `n_c = R[:, 2]` and the plane offset is `d_c = n_c . t`. Flip both signs if `d_c < 0` so normals face the camera consistently.
3. Lidar plane: crop the cloud to a box around the board by hand (record the box), then call `plane, idx = pcd.segment_plane(distance_threshold=<dt>, ransac_n=3, num_iterations=<iters>)`. Set `dt` from the lidar datasheet range accuracy; record the value and its source. Normal `n_l = plane[:3]`, offset `d_l = -plane[3]` after normalizing so `|n_l| = 1`; orient it to face the sensor like the camera normal.
4. Save the inlier board points per pose for Phase 3.

### Output
Per pose: `(n_c, d_c)`, `(n_l, d_l)`, board inlier points.

### Quality Gate
- Every pose has both planes; the count of poses is printed.
- The smallest singular value of the stacked camera normals matrix is printed and is nonzero (normals not all parallel).

---

## Phase 2: Solve the Transform

### Entry Criteria
- At least three poses with both planes.

### Actions
1. Rotation: form `H = sum(n_l_i n_c_i^T)`, compute `U, S, Vt = numpy.linalg.svd(H)`, set `R = Vt.T @ U.T`. If `numpy.linalg.det(R) < 0`, negate the last row of `Vt` and recompute. This is the Kabsch solution mapping lidar normals to camera normals.
2. Translation: each pose gives `n_c_i . t = d_c_i - d_l_i`. Stack into `A t = b` with rows `n_c_i^T` and solve with `numpy.linalg.lstsq`.
3. Refine: minimize the sum over poses of squared distances from transformed lidar board points `R p + t` to the camera plane `(n_c_i, d_c_i)` with `scipy.optimize.least_squares`, starting from the closed-form result.
4. Build `T_cam_lidar` from R and t.

### Output
`T_cam_lidar`.

### Quality Gate
- `abs(numpy.linalg.det(R) - 1)` printed and near machine precision.
- Per-pose RMS point-to-plane residual printed in meters for every pose.

---

## Phase 3: Verify Visually and Physically

### Entry Criteria
- `T_cam_lidar` solved.

### Actions
1. For one image not used in Phase 1, transform the matching cloud into the camera frame, keep points with z greater than zero, project with `cv2.projectPoints(pts, numpy.zeros(3), numpy.zeros(3), K, D)`, and draw them colored by depth. Save `overlay.png`.
2. Check: lidar points on pole edges, door frames or the board border must land on the same edges in the image. Record yes or no per edge checked.
3. Compare the translation to a tape-measured offset between the camera lens center and the lidar optical center marked in its manual. Record both.
4. Emit `camera_lidar_extrinsics`.

### Output
`camera_lidar_extrinsics`.

### Quality Gate
- `overlay.png` exists and the edge check list is recorded.
- The translation sign per axis matches the tape measurement; any mismatch is written as a defect.

---

## Worked Example

Illustrative only. 8 board poses, lidar range accuracy from the datasheet used as `dt`.

```
$ python3 cam_lidar.py --bag calib_static --poses 8
poses with both planes: 8
camera normals min singular value: 0.41
det(R)-1: 2.2e-16
pose residual RMS [m]: 0.006 0.005 0.007 0.006 0.008 0.005 0.006 0.007
T_cam_lidar t = [0.112, -0.231, -0.085]
```
Overlay: board border and a lamp post edge align. Tape measure (0.11, -0.23, -0.09) m.

---

## Exit Criteria

DONE when `T_cam_lidar` is solved from at least three non-parallel poses, residuals are reported per pose, and the overlay and tape checks are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lidar plane fit grabs the floor or wall | **Adjust**: tighten the crop box around the board and rerun. |
| Phase 1 | Normals nearly parallel | **Stop**: recapture with tilts in different directions. |
| Phase 2 | det(R) negative after fix | **Adjust**: normal orientation is inconsistent; reorient normals toward each sensor and rerun. |
| Phase 3 | Overlay offset on all edges | **Return**: to Phase 1 and recheck the time pairing of images and clouds. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
