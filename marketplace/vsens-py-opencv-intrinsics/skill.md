# Python OpenCV Intrinsic Calibration

**One-line description:** Calibrates one camera's intrinsics in Python with cv2.findChessboardCornersSB, cv2.calibrateCamera (pinhole) or cv2.fisheye.calibrate, and reports per-image reprojection error so outlier views are removed by rule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `calibration_images` (string, required): Directory of still frames of the target captured from the camera at the calibration resolution, in a lossless format (PNG). JPEG artifacts shift corners.
- `target_spec` (object, required): Target type (chessboard), inner-corner count as columns x rows, and square size in meters measured with calipers on the printed target.
- `camera_device_report` (object, required): From `vsens-v4l2-camera-probe`; gives the resolution and the lens field of view class.

---

## Outputs

- `intrinsics_py` (object): Model (`pinhole-radtan` or `fisheye-equidistant`), image width and height, camera matrix K, distortion coefficients, overall RMS reprojection error in pixels, per-image errors, and the list of images used and removed.

---

## Phase 1: Detect Corners

### Entry Criteria
- `python3 -c "import cv2; print(cv2.__version__)"` prints a version of 4.x or later (`findChessboardCornersSB` exists from OpenCV 4.0).
- Every image in `calibration_images` has the same width and height, equal to the mode in `camera_device_report`.

### Actions
1. Write `calib.py`. Build object points: `objp = np.zeros((cols*rows,3), np.float32); objp[:,:2] = np.mgrid[0:cols,0:rows].T.reshape(-1,2) * square_m`.
2. For each image, load grayscale with `cv2.imread(p, cv2.IMREAD_GRAYSCALE)` and call `ok, corners = cv2.findChessboardCornersSB(gray, (cols, rows), flags=cv2.CALIB_CB_EXHAUSTIVE | cv2.CALIB_CB_ACCURACY)`. Pass inner corners, not squares: a 9x7-square board has 8x6 inner corners.
3. If you use `cv2.findChessboardCorners` instead, refine with `cv2.cornerSubPix(gray, corners, (11,11), (-1,-1), (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))`. `findChessboardCornersSB` already returns subpixel corners.
4. Record detected and failed images. Check coverage: draw all detected corners onto one blank image and save it as `coverage.png`. Corners must reach every image edge and corner region.

### Output
Corner lists per image and `coverage.png`.

### Quality Gate
- The detected image count is printed and is at least the minimum the user set; if the user set none, record the count and flag "open question".
- `coverage.png` shows corners in all four image corners (check by eye and record yes or no per corner).

---

## Phase 2: Choose the Model and Calibrate

### Entry Criteria
- Corners detected.

### Actions
1. Choose the model:

| Lens | Model | Call |
|---|---|---|
| Lens datasheet gives a rectilinear (f tan theta) projection | pinhole radtan | `cv2.calibrateCamera` |
| Lens datasheet gives a fisheye (f theta, equidistant) projection | fisheye equidistant | `cv2.fisheye.calibrate` |
| Datasheet silent | try pinhole first; if Phase 3 undistortion leaves curved edges, try fisheye | both |

2. Pinhole: `rms, K, D, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, (w, h), None, None)`. `D` has 5 terms (k1, k2, p1, p2, k3). Add `cv2.CALIB_RATIONAL_MODEL` only when the user asks for 8 terms; extra terms can overfit.
3. Fisheye: object points must have shape (N,1,3) float64 and image points (N,1,2) float64. Call `cv2.fisheye.calibrate(objpoints, imgpoints, (w, h), K, D, flags=cv2.fisheye.CALIB_RECOMPUTE_EXTRINSIC | cv2.fisheye.CALIB_FIX_SKEW, criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 1e-6))`.
4. Print `rms`. It is the RMS reprojection error in pixels over all points.

### Output
K, D and RMS.

### Quality Gate
- `K[0,0]` and `K[1,1]` are positive and `K[0,2]`, `K[1,2]` lie inside the image.
- `rms` is printed with the model name.

---

## Phase 3: Remove Outliers and Export

### Entry Criteria
- Calibration ran.

### Actions
1. For each image, project with `cv2.projectPoints(objp, rvecs[i], tvecs[i], K, D)` (fisheye: `cv2.fisheye.projectPoints`) and compute that image's RMS error.
2. Removal rule: remove images whose error exceeds a user-set limit. If the user gave none, report the per-image list sorted descending and remove none. Do not invent a cutoff.
3. Recalibrate after removal, once. Do not loop removal until RMS is small; that discards the hard views that constrain distortion.
4. Write `intrinsics_py` as YAML with keys `model`, `width`, `height`, `K`, `D`, `rms`, `per_image_error`, `images_used`, `images_removed`.
5. Undistort one image (`cv2.undistort` or `cv2.fisheye.undistortImage`) and save `undistorted.png`. Straight edges in the scene must look straight.

### Output
`intrinsics_py`.

### Quality Gate
- The YAML file loads with `python3 -c "import yaml; yaml.safe_load(open('intrinsics.yaml'))"`.
- `undistorted.png` exists and the user confirms straight edges are straight.

---

## Worked Example

Illustrative only. 8x6 inner corners, 0.030 m squares, 45 PNG frames at 1280x720, 90-degree lens.

```
$ python3 calib.py --dir frames/ --cols 8 --rows 6 --square 0.030
detected 43/45 (failed: f12.png f31.png)
model pinhole-radtan rms=0.31
K=[[912.4,0,641.8],[0,911.9,362.0],[0,0,1]]
D=[-0.341,0.128,0.0004,-0.0002,-0.021]
worst per-image: f07.png 0.58, f22.png 0.44 ...
```
No user limit was set, so no image was removed and the sorted list is reported.

---

## Exit Criteria

DONE when K, D, RMS and per-image errors are exported to YAML with coverage and undistortion evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Most images fail detection | **Adjust**: corner count is wrong (squares vs inner corners) or the board is blurred; fix `target_spec` or recapture. |
| Phase 1 | Coverage missing image corners | **Stop**: recapture with the board near each image corner and at tilts. |
| Phase 2 | fisheye.calibrate raises `CALIB_CHECK_COND` error | **Adjust**: remove the image it names, or drop that flag, then rerun once. |
| Phase 3 | Undistorted edges curve | **Return**: to Phase 2 and try the other model. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
