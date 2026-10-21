# Kalibr Camera-IMU Extrinsic and Time Offset Calibration

**One-line description:** Estimates the camera-to-IMU transform and the camera-IMU time offset with Kalibr's kalibr_calibrate_imu_camera from a bag recorded while moving an Aprilgrid in front of the rig, and accepts the result only after reading the reprojection and IMU error plots in the report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_intrinsics` (object, required): From `vsens-intrinsics-acceptance` with verdict ACCEPT.
- `imu_noise_params` (object, required): From `vsens-imu-allan-variance`; supplies `imu.yaml`.
- `calibration_bag` (string, required): Path to a ROS bag containing the raw image topic and the raw IMU topic recorded together while the rig was excited on all six axes in front of the target.
- `aprilgrid_spec` (object, required): tagCols, tagRows, tagSize in meters (caliper-measured black square edge), tagSpacing as the ratio of gap to tag size.

---

## Outputs

- `camera_imu_extrinsics` (object): `T_cam_imu` 4x4 from the Kalibr camchain-imucam YAML, its inverse, the report PDF path, mean and std of reprojection error, and the IMU residual plot verdicts.
- `camera_imu_time_offset` (number): `timeshift_cam_imu` in seconds from the same YAML, with its sign convention (t_imu = t_cam + timeshift_cam_imu per the Kalibr documentation).

---

## Phase 1: Prepare Inputs for Kalibr

### Entry Criteria
- Kalibr is installed, typically via the official Docker image built from the ethz-asl/kalibr repository. Kalibr runs on ROS 1.
- The rig was moved by hand or on a gimbal, not driven; no actuator commands are part of this flow.

### Actions
1. If the bag is ROS 2 (`.db3` or `.mcap`), convert it: `pip install rosbags` then `rosbags-convert --src <ros2_bag_dir> --dst calib.bag`. Run `rosbag info calib.bag` inside the Kalibr container and confirm both topics and message counts.
2. Write `april.yaml`: `target_type: 'aprilgrid'`, `tagCols`, `tagRows`, `tagSize`, `tagSpacing` from `aprilgrid_spec`.
3. Write `camchain.yaml` from `camera_intrinsics`: `cam0: {camera_model: pinhole, intrinsics: [fx, fy, cx, cy], distortion_model: radtan, distortion_coeffs: [k1, k2, p1, p2], resolution: [w, h], rostopic: /cam0/image_raw}`. Kalibr radtan has 4 coefficients. If the source calibration has a nonzero OpenCV k3, do NOT drop it silently; instead run `kalibr_calibrate_cameras --bag calib.bag --topics /cam0/image_raw --models pinhole-radtan --target april.yaml` to get a Kalibr-native camchain. Fisheye intrinsics map to Kalibr `distortion_model: equidistant`.
4. Copy `imu.yaml` from `imu_noise_params` and set its `rostopic` to the bag's IMU topic.

### Output
`april.yaml`, `camchain.yaml`, `imu.yaml`, `calib.bag`.

### Quality Gate
- `rosbag info calib.bag` lists both topics with nonzero counts.
- `camchain.yaml` resolution equals the image size in the bag.

---

## Phase 2: Run the Calibration

### Entry Criteria
- Inputs prepared.

### Actions
1. Run `kalibr_calibrate_imu_camera --help` and read the options for your version, including temporal calibration.
2. Run `rosrun kalibr kalibr_calibrate_imu_camera --bag calib.bag --cam camchain.yaml --imu imu.yaml --target april.yaml` plus the temporal calibration option if your version needs it enabled.
3. Let it finish. It writes `camchain-imucam-calib.yaml`, `results-imucam-calib.txt` and `report-imucam-calib.pdf`.
4. Do NOT edit noise values in `imu.yaml` between runs to make residuals look better unless the user approves and the change is recorded.

### Output
Kalibr output files.

### Quality Gate
- All three output files exist.
- `results-imucam-calib.txt` contains `T_ci` (or `T_cam_imu`) and `timeshift`.

---

## Phase 3: Read the Report

### Entry Criteria
- Report PDF exists.

### Actions
1. Reprojection errors: in the PDF, the reprojection scatter must be centered on zero with no structure. Record mean and std from `results-imucam-calib.txt`.
2. IMU residuals: the gyro and accelerometer error plots show residuals with the 3-sigma bound derived from your noise values. Apply:

| Observation | Meaning | Response |
|---|---|---|
| Residuals mostly inside the 3-sigma bound | Noise values consistent | Accept |
| Residuals far inside the bound | Noise values too large | Record; result usable |
| Residuals well outside the bound | Noise too small, poor sync, or unmodeled motion blur | Reject; check timestamps and recapture |

3. Sanity check `T_cam_imu` translation against a tape-measured offset between the camera lens and the IMU chip marking. Record both. A sign flip or axis swap here means a frame convention error, not noise.
4. Record `timeshift_cam_imu`. A value of several frame periods indicates a timestamping problem upstream; send it to `vsens-ros2-stamp-latency` or `vsens-camera-led-latency`.
5. Emit `camera_imu_extrinsics` and `camera_imu_time_offset`.

### Output
`camera_imu_extrinsics`, `camera_imu_time_offset`.

### Quality Gate
- The tape-measured offset and the calibrated translation are both written down with the difference per axis.
- The residual table row chosen is recorded for gyro and for accelerometer.

---

## Worked Example

Illustrative only. 6x6 Aprilgrid, tagSize 0.088, tagSpacing 0.3.

```
$ rosbags-convert --src rig_ros2 --dst calib.bag
$ rosrun kalibr kalibr_calibrate_imu_camera --bag calib.bag --cam camchain.yaml --imu imu.yaml --target april.yaml
...
Reprojection error (cam0):  mean 0.21, median 0.18, std: 0.14
timeshift cam0 to imu0: [s] (t_imu = t_cam + shift)
0.0071
```
`T_cam_imu` translation (0.041, -0.012, -0.033) m; tape measure (0.04, -0.01, -0.03) m. Gyro residuals inside the bound.

---

## Exit Criteria

DONE when `T_cam_imu` and the time offset are extracted, the residual plots are classified by the table, and the translation agrees in sign and axis with the tape measurement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | rosbags-convert fails on custom messages | **Adjust**: record only standard `sensor_msgs` topics for calibration. |
| Phase 2 | "No corners detected" for most frames | **Adjust**: check `tagSize` and `tagSpacing`, lighting and motion blur; recapture slower. |
| Phase 2 | Optimization diverges | **Retry**: once with a bag that excites all axes; then **Stop** and check IMU units. |
| Phase 3 | Translation axis swapped vs tape | **Return**: to `vsens-imu-driver-bringup` to recheck the axis map. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
