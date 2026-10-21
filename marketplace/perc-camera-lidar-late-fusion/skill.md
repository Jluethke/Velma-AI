# Perception Camera-Lidar Late Fusion (Box Association)

**One-line description:** Associates lidar clusters with camera tracks by projecting cluster points into the image and solving a Hungarian assignment on the fraction of projected points inside each 2D box, so each camera object gets a measured range and 3D extent and each lidar cluster gets a class.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `calib_check_report` (object, required): Must show calibration and sync checks passed.
- `camera_calib` (object, required): Projection chain.
- `py_lidar_clusters` (string, optional): Clusters from the Python stack.
- `cpp_lidar_clusters` (string, optional): Clusters from the C++ stack. One of the two must be present.
- `track_outputs` (string, required): Camera tracks per frame (MOTChallenge format with class from the detector).
- `max_sync_skew_ms` (number, required): Largest camera-lidar timestamp gap to accept a pair, from the user.

---

## Outputs

- `fused_objects` (string): Per frame JSON: track id, class, 2D box, matched cluster id, range (median depth of in-box points), 3D centroid and box, or "camera only" and "lidar only" objects.
- `fusion_report` (object): Match rate, unmatched counts per class and range band, pairs rejected by skew, and timing.

---

## Phase 1: Pair Frames

### Entry Criteria
- `calib_check_report` marks projection, alignment and sync as pass.
- This flow publishes perception results only. It sends no command to steering, braking, throttle or any actuator.

### Actions
1. For each image frame pick the nearest lidar sweep; reject the pair if the gap exceeds `max_sync_skew_ms` and count it.
2. For moving objects, record ego speed from logs if available; a gap of `t` seconds shifts a static object by speed times `t` in the lidar frame. Motion compensation is out of scope here; record its absence.

### Output
Frame pairs.

### Quality Gate
- Count of accepted and rejected pairs printed.

---

## Phase 2: Associate

### Entry Criteria
- Frame pairs exist.

### Actions
1. Project each cluster's points with the verified chain, keeping positive depth only.
2. Build a cost matrix `C[i][j] = 1 - f_ij`, where `f_ij` is the fraction of cluster j's projected points inside track i's 2D box.
3. Solve with `scipy.optimize.linear_sum_assignment(C)` (Python) or a Hungarian implementation in C++; accept a pair only if `f_ij` meets the minimum fraction the user sets.
4. Watch occlusion: a near object's cluster can fall inside a far object's box. When one cluster matches two boxes, prefer the box whose in-box points have the smallest depth spread; record ambiguous cases.
5. Range for a match: median camera-frame depth of the in-box points (median resists background points leaking into the box).

### Output
Matched, camera-only and lidar-only objects per frame.

### Quality Gate
- Every track and cluster in a paired frame is in exactly one category, checked by count equality.

---

## Phase 3: Measure

### Entry Criteria
- Associations done.

### Actions
1. Match rate per class and per range band (bands from the user).
2. If 3D labels exist, compare fused range with labeled range for matched objects: median and p95 absolute error per range band.
3. Time association per frame; report median and p99.
4. Write `fused_objects` and `fusion_report`.

### Output
`fused_objects`, `fusion_report`.

### Quality Gate
- Match rate table, range error table (or "no labels"), and timing printed.

---

## Worked Example

Illustrative only. 1131 holdout frames, `max_sync_skew_ms=20`; 1129 pairs accepted. Minimum in-box fraction 0.5 (user). Car match rate 0.93 in 0 to 30 m, 0.71 in 30 to 60 m (fewer points). Range error vs labels for Cars: median 0.21 m, p95 0.88 m in 0 to 30 m. Association median 0.9 ms.

---

## Exit Criteria

DONE when every paired frame has each track and cluster classified as matched, camera-only or lidar-only, with match rates and timing measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Calibration check failed | **Stop**: return to `perc-camera-lidar-calib-check`. |
| Phase 2 | Systematic offset between points and boxes | **Return** to calibration; do not widen boxes to compensate. |
| Phase 3 | Range error grows with ego speed | **Return** with the observation: motion compensation or tighter sync is needed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
