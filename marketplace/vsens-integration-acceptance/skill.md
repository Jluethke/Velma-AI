# Sensor Integration Acceptance Report

**One-line description:** Collects the outputs of every sensor integration flow into one acceptance report: a per-sensor checklist of driver, calibration, time sync, latency and health evidence, a single transform tree published as static transforms, and an explicit list of open questions, with no item marked done without its evidence file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`.
- `camera_intrinsics` (object, optional): From `vsens-intrinsics-acceptance`.
- `intrinsics_verdict` (string, optional): From `vsens-intrinsics-acceptance`.
- `camera_imu_extrinsics` (object, optional): From `vsens-kalibr-camera-imu`.
- `camera_lidar_extrinsics` (object, optional): From `vsens-camera-lidar-extrinsics`.
- `rtk_status_report` (object, optional): From `vsens-gnss-ntrip-rtk`.
- `radar_stream_report` (object, optional): From `vsens-radar-can-decode`.
- `ptp_sync_report` (object, optional): From `vsens-ptp-linuxptp`.
- `clock_discipline_report` (object, optional): From `vsens-pps-chrony`.
- `stamp_latency_report` (object, optional): From `vsens-ros2-stamp-latency`.
- `optical_latency_report` (object, optional): From `vsens-camera-led-latency`.
- `health_monitor_config` (object, optional): From `vsens-ros2-diagnostics-health`.
- `dropout_report` (object, optional): From `vsens-py-dropout-detector`.

---

## Outputs

- `integration_report` (object): Per-sensor checklist with status (PASS, FAIL, NOT RUN, OPEN QUESTION) and the evidence path for each item, the combined transform tree, the list of open questions, and the list of flows that did not run.

---

## Phase 1: Build the Checklist

### Entry Criteria
- `sensor_inventory` is present.

### Actions
1. Create one row per sensor in `sensor_inventory` with these columns: driver bring-up, rate verified, calibration, time sync, latency measured, health monitored.
2. Fill each cell only from an input. Use this rule table:

| Input state | Cell status |
|---|---|
| Input null (flow did not run) | NOT RUN |
| Input present and its own verdict or quality gates passed | PASS, with the evidence path from the input |
| Input present and a verdict or gate failed | FAIL, with the failing item |
| Input present but compares against a limit the user never set | OPEN QUESTION |

3. `intrinsics_verdict` "ACCEPT" gives PASS for the camera calibration cell; "NO LIMIT SET" gives OPEN QUESTION; any "REJECT" gives FAIL.
4. Do NOT mark a cell PASS from memory, from a previous run, or because a flow "should have" passed. No input means NOT RUN.

### Output
Checklist table.

### Quality Gate
- Every PASS cell has a file path that exists (`test -e <path>` returns 0 for each).
- No cell is empty.

---

## Phase 2: Combine the Transform Tree

### Entry Criteria
- Checklist exists.

### Actions
1. Choose the body frame from `sensor_inventory` (REP 103 `base_link`). Write every extrinsic as a parent-to-child transform with the frame ids from the inventory.
2. Kalibr gives `T_cam_imu` (maps IMU-frame points into the camera frame). Camera-lidar gives `T_cam_lidar`. Record the direction of each before composing; invert with the 4x4 inverse, not by negating the translation.
3. Compose into one tree rooted at the body frame. Each frame has exactly one parent.
4. ROS 2: publish with `ros2 run tf2_ros static_transform_publisher --x .. --y .. --z .. --qx .. --qy .. --qz .. --qw .. --frame-id <parent> --child-frame-id <child>` per edge (argument style for Humble and later; check `--help` on older distributions), or put the tree in a URDF.
5. Verify: `ros2 run tf2_ros tf2_echo <body> <sensor>` for each sensor and compare with the composed matrices. `ros2 run tf2_tools view_frames` writes a PDF of the tree; save it.

### Output
Transform tree and verification output.

### Quality Gate
- `tf2_echo` translation for each sensor equals the composed value to the printed precision.
- `view_frames` PDF shows one tree with no disconnected frames.

---

## Phase 3: Write the Report

### Entry Criteria
- Checklist and tree complete.

### Actions
1. Collect every OPEN QUESTION from all inputs into one numbered list, each with the flow and the value that needs a user decision.
2. List every NOT RUN flow and the sensors it affects.
3. State scope plainly: this report records engineering checks performed; it does not claim certification or compliance with any standard. Where a standard guided a method (for example IEEE Std 952 for Allan variance, IEEE 1588 for PTP, NMEA 0183 for GNSS sentences), cite it by number only.
4. Emit `integration_report`.

### Output
`integration_report`.

### Quality Gate
- The open questions list count equals the count of OPEN QUESTION cells plus open questions carried in inputs.
- The report contains the scope statement from step 3.

---

## Worked Example

Illustrative only. Camera, IMU, lidar, GNSS; no radar.

Phase 1 table row for the camera: driver PASS (`camera_device_report.json`), rate PASS, calibration PASS (`intrinsics.yaml`, verdict ACCEPT), time sync PASS (PPS via chrony, `chrony_tracking.txt`), latency PASS (`optical_latency.json`), health PASS (`diag_unplug.txt`). Radar row: every cell NOT RUN.
Phase 2:
```
$ ros2 run tf2_ros tf2_echo base_link lidar_link
- Translation: [1.215, 0.000, 1.630]
```
Matches the composed value. Open questions: 2 (allowed PTP offset, stall timeout for GNSS).

---

## Exit Criteria

DONE when every sensor has a fully filled checklist backed by existing evidence files, one verified transform tree, and a complete open question list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Evidence path missing for a PASS | **Adjust**: change the cell to NOT RUN until the evidence exists. |
| Phase 2 | Frame with two parents | **Stop**: fix the tree so each frame has one parent. |
| Phase 2 | tf2_echo disagrees with composition | **Adjust**: a transform direction is inverted; recheck each `T_a_b` meaning. |
| Phase 3 | User asks to drop open questions | **Return**: keep them in the report; they are decisions only the user can make. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
