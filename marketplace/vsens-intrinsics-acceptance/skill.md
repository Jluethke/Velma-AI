# Intrinsics Acceptance on Held-Out Views

**One-line description:** Accepts or rejects one camera intrinsic calibration by fixing K and D and solving pose with cv2.solvePnP on held-out target images the calibration never saw, then comparing held-out reprojection error against the training RMS and the user's limit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `intrinsics_py` (object, optional): From `vsens-py-opencv-intrinsics`; null if that flow did not run.
- `intrinsics_cpp` (object, optional): From `vsens-cpp-opencv-intrinsics`; null if that flow did not run.
- `intrinsics_ros` (object, optional): From `vsens-ros2-camera-calibrator`; null if that flow did not run.
- `holdout_images` (string, required): Directory of PNG images of the same target, same resolution, captured in a separate session and never used for calibration.
- `target_spec` (object, required): Same target definition used for calibration.

---

## Outputs

- `camera_intrinsics` (object): The accepted calibration in one normalized form: model, width, height, fx, fy, cx, cy, distortion coefficients, training RMS, held-out RMS, and source flow.
- `intrinsics_verdict` (string): "ACCEPT", "REJECT" with the failing check, or "NO LIMIT SET" when the user supplied no held-out limit.

---

## Phase 1: Select and Normalize

### Entry Criteria
- Exactly one of `intrinsics_py`, `intrinsics_cpp`, `intrinsics_ros` is non-null. If more than one is non-null, ask the user which to evaluate; do not average them.

### Actions
1. Read the non-null input.
2. Normalize to `fx = K[0][0]`, `fy = K[1][1]`, `cx = K[0][2]`, `cy = K[1][2]`. For `intrinsics_ros`, `camera_matrix.data` is row-major with 9 values; `fx` is index 0, `cx` index 2, `fy` index 4, `cy` index 5.
3. Map the distortion model name: ROS `plumb_bob` equals OpenCV 5-term radtan; ROS `equidistant` equals OpenCV fisheye 4-term.
4. Confirm width and height match the `holdout_images` resolution. A calibration does not transfer across resolutions or binning modes without rescaling K; do not rescale here.

### Output
Normalized calibration.

### Quality Gate
- Normalized width and height equal the held-out image size read with `python3 -c "import cv2;print(cv2.imread('<one image>').shape)"`.
- The model name is one of `pinhole-radtan` or `fisheye-equidistant`.

---

## Phase 2: Held-Out Reprojection

### Entry Criteria
- Normalized calibration exists.

### Actions
1. Detect corners in every held-out image with `cv2.findChessboardCornersSB` as in calibration.
2. Pinhole: `ok, rvec, tvec = cv2.solvePnP(objp, corners, K, D, flags=cv2.SOLVEPNP_ITERATIVE)`. Fisheye: undistort points first with `cv2.fisheye.undistortPoints(corners, K, D, P=K)` and call `cv2.solvePnP` with zero distortion.
3. Project back with `cv2.projectPoints` (or `cv2.fisheye.projectPoints`) and compute per-image RMS in pixels.
4. Compute held-out RMS over all points of all held-out images.
5. Do NOT re-estimate K or D in this phase. Only pose is solved per image.

### Output
Per-image and overall held-out RMS.

### Quality Gate
- Held-out RMS is printed with the number of images and points used.
- At least one held-out image has the board near an image corner (check the corner pixel coordinates against the image bounds).

---

## Phase 3: Verdict

### Entry Criteria
- Held-out RMS computed.

### Actions
1. Ask the user for the maximum held-out RMS in pixels their application allows. Record it as a user input.
2. Apply:

| Condition | Verdict |
|---|---|
| No user limit | "NO LIMIT SET"; report both RMS values |
| Held-out RMS above the user limit | "REJECT: held-out RMS" |
| Overall held-out RMS within the limit, but one image with corners at the image edge exceeds the user limit | "REJECT: edge distortion underfit"; recalibrate with more edge views |
| Otherwise | "ACCEPT" |

3. Report the ratio held-out RMS / training RMS as information. A large ratio suggests overfitting to the training views; state it, do not turn it into a rule without a user limit.
4. Emit `camera_intrinsics` and `intrinsics_verdict`.

### Output
`camera_intrinsics`, `intrinsics_verdict`.

### Quality Gate
- `intrinsics_verdict` is one of the four table values.
- `camera_intrinsics.source` names the flow the calibration came from.

---

## Worked Example

Illustrative only. `intrinsics_py` non-null, 12 held-out images, user limit 0.5 px.

```
$ python3 holdout.py --calib intrinsics.yaml --dir holdout/ --cols 8 --rows 6 --square 0.030
holdout images 12, points 576
holdout rms 0.38 (training rms 0.31, ratio 1.23)
worst: h09.png 0.47 (board at top-right corner)
```
Verdict: ACCEPT (overall 0.38 and worst edge image 0.47 are both below 0.5).

---

## Exit Criteria

DONE when one calibration is normalized, evaluated on held-out views, and given a verdict from the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All three inputs null | **Stop**: run one intrinsics flow first. |
| Phase 1 | Resolution mismatch | **Stop**: capture held-out images in the calibration mode. |
| Phase 2 | solvePnP fails on an image | **Adjust**: drop that image and record it; continue. |
| Phase 3 | REJECT | **Return**: to the source intrinsics flow with the failing check named. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
