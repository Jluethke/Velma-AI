# Ground Truth Trajectory Preparation

**One-line description:** Turns a reference source (RTK GNSS with fixed solutions, a post-processed GNSS/INS solution, or surveyed control points) into a TUM-format ground truth trajectory in the same frame, time base and body point as the estimate, with its own uncertainty stated.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ground_truth_source` (object, required): Type (RTK GNSS topic in the bag, post-processed solution file, or surveyed points), path or topic, and its published or measured accuracy.
- `sensor_bag` (string, required): rosbag2 path from `loc-rosbag2-drive-logging`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.

---

## Outputs

- `ground_truth_traj` (object): Path of the TUM ground truth file, its frame and body point, the time base, the fraction of the drive it covers, and its stated accuracy.

---

## Phase 1: Qualify The Reference

### Entry Criteria
- `ground_truth_source` accuracy is stated and better than the accuracy the evaluation wants to resolve. If it is not better, the evaluation measures the reference, not the filter; report that.

### Actions
1. Classify the source:

   | Source | Use |
   |---|---|
   | RTK fixed in the same bag, also fused by the filter | not independent; only usable to evaluate a filter run with GNSS disabled or with the evaluated segment withheld |
   | Separate RTK receiver and antenna not fused | usable for position; orientation only from dual antenna |
   | Post-processed GNSS/INS (forward-backward smoothed) | usable for position and orientation; record the software and settings |
   | Surveyed points | usable as checkpoints at the times the vehicle passes them |

2. Keep only samples with the qualifying fix type (for example RTK fixed). Record the fraction of the drive kept.

### Output
Qualified reference samples.

### Quality Gate
- The independence row is recorded; a reference fused by the evaluated filter is never reported as independent.

---

## Phase 2: Align Frame, Body Point And Time

### Entry Criteria
- Qualified samples.

### Actions
1. Convert to the same local frame as the estimate: the map-frame ENU around the same datum, using the project conversion module or `pymap3d.geodetic2enu` with the same origin.
2. Move the reference point to `base_link`: p_base = p_antenna - R(yaw) * lever_arm, with the lever arm from `frame_spec`. Without this, ATE contains a heading-dependent error the size of the lever arm.
3. Time base: the reference timestamps must be in the same clock as the estimate. GNSS time differs from UTC by leap seconds (GPS time ahead of UTC by the current leap second count published by IERS). If the solution file is in GPS time and the bag is UTC-based ROS time, convert and record the offset used.
4. Write TUM: `timestamp tx ty tz qx qy qz qw`. If no orientation, write identity quaternion and mark orientation as absent so only translation metrics are used.

### Output
`ground_truth_traj`.

### Quality Gate
- `awk '{print NF}' gt.tum | sort -u` prints `8`.
- First and last timestamps overlap the estimate span (print both).

---

## Phase 3: Sanity Check

### Entry Criteria
- TUM file written.

### Actions
1. `evo_traj tum gt.tum estimate.tum --ref gt.tum -p --plot_mode xy` and look for a constant offset or rotation between them.
2. A constant time offset shows as along-track error proportional to speed; check it by computing ATE with evo's `--t_offset` at a few values and confirming the smallest error occurs near zero.

### Output
Verified `ground_truth_traj`.

### Quality Gate
- The plot file path is listed and the `--t_offset` scan results are tabulated.

---

## Worked Example

Illustrative. Post-processed GNSS/INS solution in GPS time, 18 s ahead of UTC (leap seconds at recording date per IERS Bulletin C). Converted to ROS time, lever arm (1.10, 0.00, 1.52) m removed. 94 percent of the drive kept. `--t_offset` scan: -0.05 s ATE 0.31 m, 0 s 0.18 m, +0.05 s 0.30 m.

---

## Exit Criteria

DONE when a TUM ground truth exists in the estimate's frame, body point and time base, its independence and accuracy are stated, and the time-offset scan is minimal near zero.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference not more accurate than the target resolution | **Return**: report that results bound the reference, not the filter. |
| Phase 1 | Reference fused by the filter | **Adjust**: rerun the filter with that source disabled for evaluation. |
| Phase 2 | Leap second count unknown | **Stop**: look it up from IERS for the recording date before proceeding. |
| Phase 3 | Minimum error far from zero offset | **Adjust**: fix the time base and regenerate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
