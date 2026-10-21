# Tracking Error Metrics From Run Logs

**One-line description:** Computes signed cross-track error, wrapped heading error and speed error against the reference by projecting each logged pose onto the path, reports RMS, maximum, 95th percentile and command smoothness per scenario segment, and compares each to the user's tolerances.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `run_log` (object, required): A log from `ctrl-closed-loop-sim-py` (`sim_log`) or from `ctrl-closed-course-run` (`course_log`) with time, pose, speed and applied commands.
- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `tracking_tolerances` (object, required): User-supplied acceptance values for each metric (for example maximum cross-track error on straights and curves, RMS heading error, speed error). Metrics without a tolerance are reported but not judged.

---

## Outputs

- `tracking_metrics` (object): Table per scenario and segment type (straight, curve, stop) with each metric, its tolerance, PASS or FAIL, the time of the worst sample, and plots.

---

## Phase 1: Recompute Errors Independently

### Entry Criteria
- `run_log` has time, x, y, psi, v at a uniform rate.

### Actions
1. Do not reuse the controller's own error fields; recompute from poses so a controller bug cannot hide in the metrics.
2. For each pose, project the reference point used by the evaluation (state which: rear axle, center of mass or front axle; use the same point for every controller compared) onto the polyline of `reference_trajectory`: find the nearest segment with a KD-tree (`scipy.spatial.cKDTree(path_xy).query`), then project onto the segment and its neighbor, keep the closer foot point.
3. Signed cross-track error: `e = cross(t_hat, p - p_foot)` (positive when the vehicle is left of the path). Record the sign convention.
4. Heading error: `e_psi = arctan2(sin(psi - psi_ref), cos(psi - psi_ref))`.
5. Speed error: `e_v = v - v_ref(s_foot)` interpolated at the foot station, not at the same time index (time alignment hides lag as error).

### Output
Error time series.

### Quality Gate
- A self-test passes: feeding the reference trajectory itself as the run gives max |e| below 1e-9 m (prints the value).

---

## Phase 2: Aggregate

### Entry Criteria
- Errors computed.

### Actions
1. Segment labels: curve where `|kappa| > kappa_curve` (user value), stop where `v_ref` is zero at the end, straight otherwise. Exclude the first `t_settle` seconds after engage (user value) from steady-state statistics and report them separately as transient.
2. Per segment compute: RMS `numpy.sqrt(numpy.mean(e**2))`, max |e|, 95th percentile `numpy.percentile(numpy.abs(e), 95)`, mean e (bias) for each error.
3. Smoothness: steering rate `numpy.diff(delta_applied)/dt` RMS and max; longitudinal jerk from applied acceleration; count of steering sign reversals per 10 s.
4. Final stop error: distance along path between the stop point and the target stop point.

### Output
Metrics table.

### Quality Gate
- Every metric row names its segment, unit and sample count.

---

## Phase 3: Judge And Plot

### Entry Criteria
- Table built.

### Actions
1. For every metric that has a value in `tracking_tolerances`, write PASS if within tolerance else FAIL. Metrics without a tolerance are "not judged", never PASS.
2. Plot errors versus s with the tolerance band, and the path with the run overlaid, colored by |e|. Save PNGs.
3. Write `tracking_metrics.json` and `tracking_metrics.csv`.
4. Do not change a tolerance after seeing the results. Tolerance changes go back to the user with the reason.

### Output
`tracking_metrics`.

### Quality Gate
- `tracking_metrics.json` parses; the count of FAIL rows is printed.

---

## Worked Example

Illustrative only. Stanley run S4, tolerances: straight max |e| 0.20 m, curve max |e| 0.35 m, RMS e_psi 0.05 rad.

- Phase 1: self-test max |e| 2e-13 m.
- Phase 2: straight max 0.11 m, curve max 0.29 m, RMS e_psi 0.021 rad; bias on curves 0.08 m outward.
- Phase 3: 3 PASS, 0 FAIL, steering rate RMS not judged.

---

## Exit Criteria

DONE when errors are recomputed from poses, aggregated per segment and judged only against user tolerances.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Projection jumps to another part of a looped path | **Adjust**: restrict search to a window around the previous foot station. |
| Phase 1 | Self-test fails | **Stop**: fix projection before judging any run. |
| Phase 3 | No tolerances supplied | **Return**: report metrics as not judged and ask the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
