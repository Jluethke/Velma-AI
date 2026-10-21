# Perception Camera-Lidar Calibration and Sync Check

**One-line description:** Verifies camera intrinsics, lidar-to-camera extrinsics and time sync before fusion by projecting lidar points into images with the full matrix chain (KITTI `P2 * R0_rect * Tr_velo_to_cam`), measuring edge alignment on review frames, and measuring the timestamp offset between paired camera and lidar frames.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_calib` (object, required): Intrinsics (K and distortion, or a rectified projection matrix such as KITTI `P2`), rectification, and lidar-to-camera extrinsic, with the file they came from.
- `point_cloud_dir` (string, required): Lidar sweeps with timestamps.
- `image_dir` (string, required): Camera images with timestamps, from the same recording.

---

## Outputs

- `calib_check_report` (object): Matrix chain used, projection overlays reviewed, edge alignment numbers, timestamp offset statistics between paired frames, and a pass or fail per check with the user tolerance.

---

## Phase 1: Assemble the Projection Chain

### Entry Criteria
- Calibration came from a documented procedure (for example OpenCV `calibrateCamera` with its RMS reprojection error recorded, or the dataset's calib files).
- Data was recorded on a vehicle the user owns, parked or driven normally by a person, with sensors logging only; or from a public dataset.

### Actions
1. KITTI object calib file: parse `P2` (3x4), `R0_rect` (3x3) and `Tr_velo_to_cam` (3x4). Pad `R0_rect` and `Tr_velo_to_cam` to 4x4 with a last row `[0,0,0,1]`.
2. For a lidar point `X = [x, y, z, 1]^T`: `Y = P2 @ R0_rect @ Tr_velo_to_cam @ X`; pixel `u = Y[0]/Y[2]`, `v = Y[1]/Y[2]`.
3. Keep only points with camera-frame depth greater than zero before dividing (points behind the camera project to valid-looking pixels).
4. For a non-rectified camera, project with `cv2.projectPoints(pts_cam, rvec0, tvec0, K, dist)` after transforming points to the camera frame with the extrinsic; never ignore the distortion terms.
5. Write down each matrix's direction (lidar to camera or the inverse). A swapped direction is the most common fusion bug.

### Output
The projection function.

### Quality Gate
- Projection of the KITTI devkit example (or a known target point) lands on the expected pixel within the user tolerance, printed.

---

## Phase 2: Check Geometric Alignment

### Entry Criteria
- Projection function works.

### Actions
1. Choose ten review frames with poles, vehicle edges and building corners at different ranges.
2. Draw projected points colored by depth over each image (`cv2.circle`) and save.
3. Measure alignment: compute image edges (`cv2.Canny`) and lidar depth discontinuities (points where range jumps between neighbors), project the discontinuities, and report the median pixel distance to the nearest image edge with `cv2.distanceTransform` on the inverted edge map. This is an alignment diagnostic in pixels.
4. Compare with the user tolerance. Do not adjust extrinsics by hand to make overlays look right; recalibrate with a target-based method instead.

### Output
Overlays and alignment numbers.

### Quality Gate
- Ten overlays saved and listed; median edge distance per frame printed.

---

## Phase 3: Check Time Sync

### Entry Criteria
- Every image and sweep has a timestamp with a known clock source.

### Actions
1. Pair each image with the nearest sweep by timestamp; record the offset distribution (median, p99, max).
2. Confirm both timestamps share a clock (PTP, GPS PPS or one host clock). If they come from different clocks without sync, the offsets are meaningless; record it as a failure.
3. Note the mechanical lidar sweep: points in one sweep span the rotation time; per-point timestamps (if the driver provides them) allow motion compensation, which a static check cannot reveal. Record whether per-point times exist.
4. Compare the offset p99 against the user's maximum skew.

### Output
`calib_check_report`.

### Quality Gate
- Offset median, p99 and max printed; clock source named.
- Each check marked pass or fail against a user tolerance.

---

## Worked Example

Illustrative only. KITTI raw drive 0005, calib from `calib_velo_to_cam.txt` and `calib_cam_to_cam.txt`. Ten overlays saved; median edge distance 1.8 to 3.4 px (user tolerance 4 px). Camera and lidar timestamps from `timestamps.txt` files, offset median 4.1 ms, p99 9.7 ms, both on the same host clock. Per-point times not available.

---

## Exit Criteria

DONE when projection uses the documented chain, alignment and sync are measured on review frames, and each check has pass or fail against the user's tolerance.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Points appear mirrored or shifted far off | **Adjust**: invert the extrinsic direction and **Retry**. |
| Phase 2 | Misalignment grows with range | **Return**: rotation error in the extrinsic; recalibrate with a target. |
| Phase 3 | No common clock | **Stop**: fusion results would be unreliable; fix time sync first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
