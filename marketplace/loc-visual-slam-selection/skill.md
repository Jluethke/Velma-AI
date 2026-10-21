# Visual And Visual-Inertial SLAM Selection And Calibration Plan

**One-line description:** Chooses a visual or visual-inertial odometry or SLAM package (ORB-SLAM3, VINS-Fusion, OpenVINS, Isaac ROS Visual SLAM) from camera type, shutter, IMU, compute and license, and writes the camera intrinsic and camera-IMU extrinsic and time-offset calibration plan with Kalibr.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_list` (object[], required): Camera model, mono or stereo, global or rolling shutter, resolution and rate, hardware sync availability, IMU model and rate, and the onboard computer (GPU or CPU only).
- `operating_area` (object, required): Environment, lighting conditions (night, tunnels, glare), and whether a reusable map is needed.

---

## Outputs

- `vslam_choice` (object): Chosen package, license, pinned version, required inputs, rejected options with reasons.
- `calibration_plan` (object): The Kalibr steps for intrinsics and camera-IMU extrinsics and time offset, target type, data collection procedure, and acceptance checks.

---

## Phase 1: Select

### Entry Criteria
- Camera shutter type and IMU availability are known.

### Actions
1. Apply this table and quote the row:

   | Condition | Choice | Notes |
   |---|---|---|
   | Stereo or mono plus IMU, CPU only, map reuse wanted | ORB-SLAM3 | GPL-3.0; atlas multi-map; ROS 2 wrappers are community maintained |
   | Mono or stereo plus IMU, optional GNSS fusion | VINS-Fusion | GPL-3.0; has a global fusion module for GNSS |
   | Filter-based VIO with online calibration of extrinsics and time offset | OpenVINS | GPL-3.0; MSCKF; good documentation of calibration states |
   | NVIDIA Jetson or discrete GPU, stereo camera, ROS 2 | Isaac ROS Visual SLAM | NVIDIA license terms; check the current license before shipping |
   | Rolling shutter camera without rolling-shutter model support in the package | prefer a global shutter camera or a package that models readout time | rolling shutter distorts geometry in fast motion |

2. Monocular without IMU cannot observe scale; reject for vehicle localization unless scale comes from another sensor.
3. Night and tunnel driving degrade visual tracking; if `operating_area` includes them, record that the visual estimate needs a fallback source.
4. Record license and pinned commit.

### Output
`vslam_choice`.

### Quality Gate
- Chosen and rejected rows each have reasons; license recorded.

---

## Phase 2: Calibration Plan

### Entry Criteria
- Choice made.

### Actions
1. Intrinsics: Kalibr `kalibr_calibrate_cameras` with an AprilGrid target; camera model (`pinhole-radtan` or `pinhole-equi`) chosen by lens field of view; record the model.
2. Camera-IMU: `kalibr_calibrate_imu_camera` with the target fixed, the camera-IMU rig moved by hand to excite all axes, IMU noise values from `loc-imu-allan-variance` in the IMU YAML. Kalibr estimates the time offset between camera and IMU.
3. Kalibr is built for ROS 1; use the project's official Docker image as described in its README, and convert rosbag2 to ROS 1 bag format with the `rosbags-convert` tool from the `rosbags` package.
4. Acceptance checks from Kalibr outputs: reprojection error plots in the generated PDF report, and the time offset value; record both. Repeat calibration twice; extrinsics that differ between runs by more than the reported standard deviation indicate insufficient excitation.

### Output
`calibration_plan`.

### Quality Gate
- The plan names the Kalibr command, target file, camera model, and the two-run repeatability check.

---

## Worked Example

Illustrative. Stereo global shutter 1280x720 at 30 Hz with hardware trigger, 6-axis IMU 200 Hz, Jetson computer, urban plus parking garage. Choice: Isaac ROS Visual SLAM (GPU available, stereo). ORB-SLAM3 retained as CPU fallback. Calibration: `pinhole-radtan`, AprilGrid 6x6, two Kalibr runs: time offset 4.1 ms and 4.3 ms.

---

## Exit Criteria

DONE when a package is chosen with license and version, and a calibration plan with repeatability checks is written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Monocular with no IMU | **Return**: request an IMU or stereo camera; scale is unobservable. |
| Phase 1 | License conflicts with distribution | **Stop**: present options to the user. |
| Phase 2 | Kalibr reports high reprojection error | **Retry**: recollect with slower motion and better lighting. |
| Phase 2 | Extrinsics differ between runs | **Retry**: excite all rotation axes more fully. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
