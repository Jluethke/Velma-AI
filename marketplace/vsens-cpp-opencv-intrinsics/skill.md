# C++ OpenCV Intrinsic Calibration

**One-line description:** Calibrates one camera's intrinsics in C++ with cv::findChessboardCornersSB and cv::calibrateCamera or cv::fisheye::calibrate, built with CMake against the system OpenCV, and writes the result with cv::FileStorage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `calibration_images` (string, required): Directory of PNG frames of the target at the calibration resolution.
- `target_spec` (object, required): Chessboard inner-corner count (columns x rows) and caliper-measured square size in meters.
- `camera_device_report` (object, required): From `vsens-v4l2-camera-probe`; gives the resolution.

---

## Outputs

- `intrinsics_cpp` (object): Model, width, height, camera matrix, distortion coefficients, overall RMS error, per-image error, and images used and removed, read from the `cv::FileStorage` YAML the program writes.

---

## Phase 1: Build the Tool

### Entry Criteria
- `pkg-config --modversion opencv4` prints 4.x or later, or CMake finds OpenCV with `find_package(OpenCV REQUIRED)`.

### Actions
1. Create `calib/CMakeLists.txt` with `cmake_minimum_required`, `project(calib CXX)`, `set(CMAKE_CXX_STANDARD 17)`, `find_package(OpenCV REQUIRED COMPONENTS core imgcodecs calib3d imgproc)`, `add_executable(calib main.cpp)`, `target_link_libraries(calib PRIVATE ${OpenCV_LIBS})`.
2. In `main.cpp`, build object points as `std::vector<cv::Point3f>` with `x = c * square`, `y = r * square`, `z = 0` for every inner corner, row-major in the same order OpenCV returns corners.
3. Load each image with `cv::imread(path, cv::IMREAD_GRAYSCALE)`; check `!img.empty()` and that `img.size()` equals the first image size. Abort on mismatch.
4. Detect with `cv::findChessboardCornersSB(img, cv::Size(cols, rows), corners, cv::CALIB_CB_EXHAUSTIVE | cv::CALIB_CB_ACCURACY)`.
5. Build: `cmake -S calib -B calib/build -DCMAKE_BUILD_TYPE=Release && cmake --build calib/build -j`.

### Output
`calib/build/calib` binary.

### Quality Gate
- `cmake --build` exits 0 with no warnings about missing OpenCV components.
- Running `calib/build/calib --help` (or with no args) prints usage and exits without a crash.

---

## Phase 2: Calibrate

### Entry Criteria
- Binary built.

### Actions
1. Pinhole: `double rms = cv::calibrateCamera(objectPoints, imagePoints, imageSize, K, D, rvecs, tvecs);` with `K` and `D` as `cv::Mat`.
2. Fisheye: points must be `std::vector<std::vector<cv::Point3d>>` and `cv::Point2d` (double). Call `cv::fisheye::calibrate(objectPoints, imagePoints, imageSize, K, D, rvecs, tvecs, cv::fisheye::CALIB_RECOMPUTE_EXTRINSIC | cv::fisheye::CALIB_FIX_SKEW, cv::TermCriteria(cv::TermCriteria::COUNT + cv::TermCriteria::EPS, 100, 1e-6));`. Passing float points to fisheye throws an assertion.
3. Pick the model from the lens datasheet projection: rectilinear means pinhole, equidistant fisheye means fisheye. If unknown, run pinhole first.
4. Print `rms` to stdout.

### Output
K, D and RMS in memory.

### Quality Gate
- The program prints `rms=` with a finite value (not `nan` or `inf`).
- Principal point `K(0,2)`, `K(1,2)` lies inside the image.

---

## Phase 3: Per-Image Error and Export

### Entry Criteria
- Calibration succeeded.

### Actions
1. For each view, call `cv::projectPoints` (or `cv::fisheye::projectPoints`), compute `cv::norm(imagePoints[i], projected, cv::NORM_L2) / std::sqrt(n)`, and print it with the file name.
2. Remove views only above a user-set limit. Without a limit, print the sorted list and remove none.
3. Write with `cv::FileStorage fs("intrinsics.yaml", cv::FileStorage::WRITE); fs << "model" << model << "width" << w << "height" << h << "K" << K << "D" << D << "rms" << rms;` plus per-image errors and file lists.
4. Undistort one image with `cv::undistort` (or `cv::fisheye::undistortImage`) and write `undistorted.png`.

### Output
`intrinsics_cpp`.

### Quality Gate
- `intrinsics.yaml` reopens with `cv::FileStorage(..., READ)` and the read-back K equals the written K.
- `undistorted.png` exists and the user confirms straight scene edges are straight.

---

## Worked Example

Illustrative only. 9x6 inner corners, 0.025 m squares.

```
$ cmake -S calib -B calib/build -DCMAKE_BUILD_TYPE=Release && cmake --build calib/build -j
[100%] Built target calib
$ ./calib/build/calib frames/ 9 6 0.025 pinhole
detected 38/40
rms=0.27
f05.png 0.49
f18.png 0.41
wrote intrinsics.yaml
```

---

## Exit Criteria

DONE when the binary builds, calibration prints a finite RMS, per-image errors are listed, and `intrinsics.yaml` round-trips.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Could not find a package configuration file provided by "OpenCV"` | **Adjust**: install the OpenCV development package or pass `-DOpenCV_DIR=<path>` to cmake. |
| Phase 2 | Assertion on `objectPoints.type() == CV_64FC3` in fisheye | **Adjust**: switch point types to double. |
| Phase 2 | `rms` is nan | **Stop**: check that object point order matches corner order and square size is in meters. |
| Phase 3 | Read-back K differs | **Retry**: fix the FileStorage key names and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
