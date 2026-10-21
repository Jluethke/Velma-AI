# EKF And UKF Model Design For Vehicle Localization

**One-line description:** Writes the state vector, process model, measurement models and Jacobians for a planar or 3D vehicle localization filter fusing IMU, wheel odometry and GNSS, choosing between EKF and UKF and between a full-state and an error-state (loosely coupled INS) formulation with explicit rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.
- `sensor_list` (object[], required): Sensors to fuse with message types and rates.
- `time_offsets` (object, required): Output of `loc-sensor-time-sync-check`.
- `filter_type` (string, optional): "ekf" or "ukf". If absent, Phase 1 decides.

---

## Outputs

- `filter_design` (object): State vector with units and frames, process model equations, every measurement model h(x) with its Jacobian H or a note that the UKF needs none, angle-wrapping rules, initialization rule, and the formulation choice with its reason.

---

## Phase 1: Choose Formulation

### Entry Criteria
- `sensor_list` includes at least one absolute source (GNSS or map localization) or the user accepts drift.

### Actions
1. Choose the state size:

   | Condition | State |
   |---|---|
   | Ground vehicle on roads, 2D map, ROS robot_localization | 2D mode: x, y, yaw, vx, vy, yaw_rate, ax (robot_localization `two_d_mode: true` uses its 15-state vector with 3D terms held fixed) |
   | Grades, ramps, multi-level structures, or 3D lidar maps | full 3D: position, orientation, velocity, plus angular rate and acceleration or IMU biases |
   | IMU used as the propagation input at full rate (INS style) | error-state: nominal position, velocity, quaternion, gyro bias, accel bias; filter state is the error |

2. Choose EKF or UKF:

   | Condition | Choice |
   |---|---|
   | Models are smooth and Jacobians are easy to derive and test | EKF |
   | Strong nonlinearity at the update rate (large heading uncertainty with GNSS position updates at startup) | UKF, or EKF with a heading initialization step |
   | Rotation states as quaternions | error-state EKF (3-parameter attitude error), or UKF with a manifold-aware mean (do not average quaternions component-wise) |

3. If `filter_type` is given, use it and record any condition above that argues against it.

### Output
Formulation choice with the rows that decided it.

### Quality Gate
- The chosen rows of both tables are quoted in `filter_design`.

---

## Phase 2: Write Process Model

### Entry Criteria
- Formulation chosen.

### Actions
1. For 2D constant velocity and turn rate (CTRV style) with state [x, y, yaw, v, yaw_rate]:
   x' = x + v cos(yaw) dt, y' = y + v sin(yaw) dt, yaw' = wrap(yaw + yaw_rate dt), v' = v, yaw_rate' = yaw_rate.
2. Write the Jacobian F = df/dx analytically. For the model above: dx'/dyaw = -v sin(yaw) dt, dx'/dv = cos(yaw) dt, dy'/dyaw = v cos(yaw) dt, dy'/dv = sin(yaw) dt, dyaw'/dyaw_rate = dt.
3. For the error-state INS: write the nominal mechanization in the chosen world frame (ENU or NED from `frame_spec`), with gravity sign matching that frame. Cite the reference you derive from (for example Groves, "Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems", or Sola, "Quaternion kinematics for the error-state Kalman filter").
4. State the process noise structure (which states receive noise, through which input matrix G) but not the values; values come from `loc-q-r-derivation`.
5. Define angle wrapping: every yaw is wrapped to (-pi, pi] after predict and every yaw residual is wrapped before use.

### Output
Process model section.

### Quality Gate
- Every entry of F that is nonzero off the identity is written out.
- The gravity vector is written with its sign in the chosen frame.

---

## Phase 3: Write Measurement Models

### Entry Criteria
- Process model written.

### Actions
1. For each sensor, write h(x), the measured quantity, its frame, and H:
   - Wheel odometry: z = [v_forward, yaw_rate] in `base_link`; for the CTRV state H selects v and yaw_rate.
   - Gyro z as a measurement (if not used as input): z = yaw_rate + bias_g if bias is a state.
   - GNSS position: z = p + R(yaw) * lever_arm, where lever_arm is the antenna position in `base_link` from `frame_spec`. Write the derivative of the lever-arm term with respect to yaw; omitting it biases heading in turns.
   - GNSS heading (dual antenna) if present: z = yaw + mounting offset, residual wrapped.
2. Write the initialization rule: position from the first valid GNSS fix, yaw from dual antenna, from GNSS course over ground once speed exceeds a user-set threshold, or with large initial variance; velocity zero at a static start.
3. Write how `time_offsets` are applied: measurement processed at corrected stamp.

### Output
`filter_design`.

### Quality Gate
- Every sensor in `sensor_list` has h(x) and H or an explicit "not fused" line.
- The GNSS model includes the lever arm and its Jacobian term.

---

## Worked Example

Illustrative. Sensors: 6-axis IMU 200 Hz, wheel odometry 50 Hz, single-antenna GNSS 10 Hz, flat urban roads, ROS 2.

Phase 1: 2D, EKF (robot_localization), yaw initialized from GNSS course over ground. Phase 3: GNSS lever arm (1.1, 0.0) m; d(z_x)/d(yaw) includes -1.1 sin(yaw).

---

## Exit Criteria

DONE when `filter_design` contains state, process model with F, every measurement model with H, wrapping rules and initialization, all tied to `frame_spec`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No absolute source and user wants global position | **Stop**: add GNSS or map localization; odometry alone drifts without bound. |
| Phase 2 | Jacobian unclear for a chosen model | **Adjust**: switch to UKF or derive symbolically with sympy and record the derivation. |
| Phase 3 | Lever arm unknown | **Return**: request measurement into `frame_spec`. |
| Phase 3 | Heading unobservable at standstill | **Adjust**: hold yaw variance large until speed allows course-over-ground initialization. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
