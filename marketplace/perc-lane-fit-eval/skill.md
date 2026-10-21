# Perception Lane Postprocessing (Polynomial Fit) and Benchmark Evaluation

**One-line description:** Turns a lane segmentation or lane-point model output into per-lane polynomial curves (optionally in a bird's-eye view through a measured homography) and evaluates them with the official metric of the chosen benchmark, CULane F1 or TuSimple accuracy, on a held-out set.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `seg_model` (string, required): The lane model (segmentation with one channel per lane instance, or a point-output model) with its preprocessing spec.
- `seg_holdout_dir` (string, required): Held-out images with lane ground truth in the benchmark's format.
- `lane_benchmark` (string, required): "culane" or "tusimple".
- `lane_poly_degree` (number, required): Polynomial degree for each lane, chosen by the user (second and third order are common in published lane models; this flow does not choose).

---

## Outputs

- `lane_fit_impl` (object): Postprocessing code path, sampling rows, fit method and degree, and the homography source if a bird's-eye view is used.
- `lane_eval_report` (object): Benchmark metric values (CULane precision, recall, F1 per category; or TuSimple accuracy, FP, FN), the tool and commit used.

---

## Phase 1: Extract Lane Points

### Entry Criteria
- The output format of the model is documented (per-lane masks, row-anchor classification, or point sets).

### Actions
1. Per-lane mask: for each lane channel, threshold the probability with the value the model's reference code uses (cite it), then for each sampled image row take the mean column of foreground pixels.
2. Sample rows exactly as the benchmark expects: TuSimple ground truth gives `h_samples` (fixed row list per image in the JSON); CULane lines are point lists per row in `.lines.txt`.
3. Drop lanes with fewer points than `lane_poly_degree + 1`; a fit is undefined there.

### Output
Point lists per lane per image.

### Quality Gate
- Every kept lane has more points than its polynomial degree, checked by assertion.

---

## Phase 2: Fit Curves

### Entry Criteria
- Point lists exist.

### Actions
1. Fit `x = f(y)` (column as a function of row), not `y = f(x)`; near-vertical lanes are not functions of x. Use `np.polyfit(ys, xs, lane_poly_degree)`.
2. Optional bird's-eye view: compute `H = cv2.getPerspectiveTransform(src_pts, dst_pts)` from four ground points measured on a calibration image of a flat road, transform points with `cv2.perspectiveTransform`, fit there, and transform back for evaluation. Record where the four points came from. A homography assumes a flat road and fixed camera pitch.
3. Evaluate the fitted curve back at the benchmark rows to produce the prediction file.

### Output
`lane_fit_impl`.

### Quality Gate
- On five images, overlay fitted curves on the image (`cv2.polylines`) and save; listed by file name.

---

## Phase 3: Benchmark Metric

### Entry Criteria
- Prediction files written in the benchmark format.

### Actions
1. CULane: build and run the official evaluation tool from the CULane release (or the copy in a maintained repo, with commit recorded). It draws each lane 30 pixels wide and counts a true positive when IoU with a ground truth lane exceeds 0.5, then reports precision, recall and F1, per scene category (normal, crowd, night, shadow, no line, arrow, curve, cross, dazzle light). The cross category reports FP only.
2. TuSimple: run the official `lane.py` `LaneEval.bench_one_submit(pred_json, gt_json)`. A point is correct within 20 pixels (scaled by lane angle in the code) and a lane matches when 85% of its points are correct; accuracy, FP and FN are reported.
3. Do NOT write your own metric and report it as the benchmark metric.

### Output
`lane_eval_report`.

### Quality Gate
- The tool name, commit and verbatim output are in the report.

---

## Worked Example

Illustrative only. TuSimple test-style holdout, 2782 images, `lane_poly_degree=2`, no bird's-eye view. `LaneEval.bench_one_submit` output: `Accuracy 0.9581, FP 0.0412, FN 0.0388`. Five overlays saved; curves follow lanes except one with a lane split near the horizon.

---

## Exit Criteria

DONE when every lane is fit with the user's degree in `x = f(y)` form and the benchmark's own tool reports the metric on holdout.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Model output format undocumented | **Stop**: get the reference postprocessing code first. |
| Phase 2 | Fit unstable near the horizon | **Adjust**: restrict rows to the benchmark range; **Retry**. |
| Phase 3 | Official tool fails to build | **Return** the build error; do not substitute a homemade metric. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
