# ROS 2 camera_calibration Intrinsics

**One-line description:** Calibrates a camera publishing on a ROS 2 image topic with the camera_calibration package's cameracalibrator node, reading its X, Y, Size and Skew coverage bars, saving the ost.yaml result and loading it through camera_info_url.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_topic` (string, required): The raw image topic, for example `/camera/image_raw`, and its camera namespace.
- `target_spec` (object, required): Chessboard inner-corner count (columns x rows) and caliper-measured square size in meters.

---

## Outputs

- `intrinsics_ros` (object): The `ost.yaml` content (image_width, image_height, camera_name, camera_matrix, distortion_model, distortion_coefficients, rectification_matrix, projection_matrix), the epipolar or reprojection figure the GUI printed, and the `camera_info_url` used to load it.

---

## Phase 1: Prepare the Topic

### Entry Criteria
- `ros2 pkg list | grep camera_calibration` prints `camera_calibration`.
- `ros2 topic hz <camera_topic>` reports the camera's locked rate.

### Actions
1. Confirm the topic carries raw, unrectified images: `ros2 topic echo --once <camera_topic> --field encoding`. Encodings `mono8`, `bgr8`, `rgb8`, `yuv422` work. Calibrating on `image_rect` is wrong; it has already been undistorted.
2. Confirm the driver exposes the `set_camera_info` service: `ros2 service list | grep set_camera_info`. If absent, you can still Save; pass `--no-service-check`.
3. Print the board flat on a rigid plate. Measure one square with calipers; use that value, not the nominal print size.

### Output
Verified raw topic and service status.

### Quality Gate
- `ros2 topic hz` shows a steady rate for 10 seconds.
- The topic encoding is printed and is not a rectified topic.

---

## Phase 2: Collect Views

### Entry Criteria
- Raw topic verified.

### Actions
1. Run: `ros2 run camera_calibration cameracalibrator --size 8x6 --square 0.030 --ros-args -r image:=/camera/image_raw -p camera:=/camera`. Substitute your corner count and square size. `--size` takes inner corners.
2. Run `ros2 run camera_calibration cameracalibrator --help` and read the distortion model options for your installed version before choosing fisheye.
3. Move the board through: the left, right, top and bottom of the frame; near and far; tilted left, right, up and down. Watch the X, Y, Size and Skew bars fill.
4. Hold the board still at each pose; motion blur makes the node reject views.
5. The CALIBRATE button enables when the node has enough views by its own rule. Press it only after all four bars are well filled.

### Output
Collected views in the node.

### Quality Gate
- The CALIBRATE button is enabled.
- A screenshot of the four bars is saved before pressing CALIBRATE.

---

## Phase 3: Save, Load, Check

### Entry Criteria
- Calibration computed in the GUI.

### Actions
1. Read the terminal: the node prints `D`, `K`, `R`, `P` and the distortion model. Copy them.
2. Press SAVE. The node writes `/tmp/calibrationdata.tar.gz` containing `ost.yaml` and the images. Copy it out of `/tmp` immediately.
3. Press COMMIT only if Phase 1 found `set_camera_info`. COMMIT writes through the driver to its `camera_info_url` location.
4. Otherwise place `ost.yaml` at a stable path and set the driver parameter `camera_info_url:=file:///<abs path>/ost.yaml`. Restart the driver.
5. Check: `ros2 topic echo --once /camera/camera_info` must show the new `k` and `d` arrays.
6. Run `ros2 run camera_calibration cameracheck --size 8x6 --square 0.030 --ros-args -r monocular:=/camera` if available in your install and record its reprojection output. If the executable is missing, record "cameracheck not installed".

### Output
`intrinsics_ros`.

### Quality Gate
- `camera_info` on the live topic shows the `k` values from `ost.yaml`.
- `/tmp/calibrationdata.tar.gz` was copied to a persistent location and the path is recorded.

---

## Worked Example

Illustrative only.

```
$ ros2 run camera_calibration cameracalibrator --size 8x6 --square 0.030 --ros-args -r image:=/camera/image_raw -p camera:=/camera
...
**** Calibrating ****
D = [-0.338, 0.121, 0.0003, -0.0001, 0.0]
K = [905.1, 0.0, 640.2, 0.0, 904.7, 361.5, 0.0, 0.0, 1.0]
('Wrote calibration data to', '/tmp/calibrationdata.tar.gz')
$ ros2 topic echo --once /camera/camera_info --field k
[905.1, 0.0, 640.2, 0.0, 904.7, 361.5, 0.0, 0.0, 1.0]
```

---

## Exit Criteria

DONE when `ost.yaml` is saved to a persistent path and the live `camera_info` topic carries its values.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package missing | **Stop**: install `ros-<distro>-camera-calibration` and rerun. |
| Phase 2 | Board never detected | **Adjust**: `--size` counts inner corners; fix it, improve lighting, slow down. |
| Phase 3 | COMMIT fails with service timeout | **Adjust**: use SAVE and `camera_info_url` instead. |
| Phase 3 | `camera_info` unchanged after restart | **Retry**: check the `file://` URL is absolute and readable by the driver user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
