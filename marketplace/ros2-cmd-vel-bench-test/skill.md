# ROS 2 Velocity Command Bench Test Behind a Hardware Emergency Stop

**One-line description:** Verifies a base controller's response to velocity commands on a bench with drive wheels off the ground behind an independent hardware emergency stop, checks the command timeout stops motion when commands cease, and confirms the emergency stop cuts actuator power with no software in its path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `estop_verified` (boolean, required): True only after the user has physically confirmed that the hardware emergency stop removes actuator power independently of any computer.
- `launch_file` (string, required): Launch file that starts the base controller.
- `command_timeout_s` (number, required): The controller's documented command timeout, read from its configuration (for example the `cmd_vel_timeout` parameter of the ros2_control diff_drive_controller). Supplied by the user from the configuration, not chosen here.

---

## Outputs

- `bench_test_log` (object): Bench setup confirmation, each command sent, observed wheel response, measured stop after timeout, emergency stop test result, and any defect.

---

## Phase 1: Bench Setup and Emergency Stop Proof

### Entry Criteria
- This step commands motion. It runs only on a bench or a closed course behind an independent hardware emergency stop.
- `estop_verified == true`.
- Drive wheels are lifted off the ground on stands, or the platform is on a closed course with nobody in the motion path.

### Actions
1. Confirm the emergency stop is hardware: pressing it opens a contactor or relay in the actuator power path. It is not a ROS topic, a service, or a software flag. Braking and emergency-stop paths are never gated, delayed or blocked by software; if any software must agree before power is removed, stop and redesign.
2. With actuators powered and no commands, press the emergency stop and confirm with a meter or the drive's indicator that actuator power is removed. Release it.
3. Confirm no other command source is running: `ros2 topic info -v /cmd_vel` must show exactly zero publishers before you start.

### Output
Bench readiness record.

### Quality Gate
- The emergency stop removed actuator power in step 2, with the evidence recorded.
- `/cmd_vel` publisher count is 0 before the test.

---

## Phase 2: Command Response and Timeout

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Launch the controller with `launch_file`. Confirm the command topic and type with `ros2 topic info /cmd_vel` (`geometry_msgs/msg/Twist`, or `geometry_msgs/msg/TwistStamped` for controllers configured for stamped input).
2. Read the configured timeout: `ros2 param get /<controller> cmd_vel_timeout` (parameter name depends on the controller; check its documentation). It must equal `command_timeout_s`.
3. Send a low command for a short burst at a steady rate: `ros2 topic pub --rate 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.1}}"`. The value must be within the platform's documented safe bench speed; ask the user for it.
4. Observe the wheels turn in the forward direction per REP 103 (x forward). Record direction for each wheel.
5. Stop the publisher with Ctrl+C. Measure the time until the wheels stop from the controller's output topic (for example its joint state or odometry stamps) or a video with a timestamp overlay. The stop must occur within `command_timeout_s` plus the controller's documented deceleration behavior.
6. Never test the timeout by sending a command and walking away; keep a hand on the emergency stop throughout.

### Output
Response and timeout measurements.

### Quality Gate
- Wheel direction matches REP 103 for the forward command.
- Measured stop time after the last command is recorded and is within `command_timeout_s` plus documented deceleration.

---

## Phase 3: Emergency Stop Under Command

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Start the same low command stream.
2. Press the hardware emergency stop. The wheels must stop without any software action.
3. Stop the publisher. Release the emergency stop. The wheels must remain stopped until a new command is sent; if motion resumes on release with no new command, record a defect and do not continue.
4. Fill `bench_test_log`.

### Output
`bench_test_log`.

### Quality Gate
- Wheels stopped on emergency stop press while commands were still being published.
- No motion on emergency stop release without a new command.

---

## Worked Example

Illustrative only. Differential drive base on stands, diff_drive_controller with `cmd_vel_timeout` read as 0.5 s, user-supplied bench speed 0.1 m/s.

- Phase 1: emergency stop opens the motor contactor; drive LED goes dark. `/cmd_vel` has 0 publishers.
- Phase 2: both wheels turn forward; after Ctrl+C the joint velocities in `/joint_states` reach zero 0.42 s after the last command stamp.
- Phase 3: press stops wheels while publishing; release with no command: no motion.

---

## Exit Criteria

DONE when the emergency stop is proven to remove actuator power in hardware, commands drive the expected direction, the timeout stops motion, and release does not resume motion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `estop_verified` is false or the stop depends on software | **Stop**: do not command motion. |
| Phase 1 | Another node publishes `/cmd_vel` | **Stop**: find and stop it before testing. |
| Phase 2 | Wheels turn the wrong way | **Stop**: press the emergency stop; fix wheel direction configuration; restart Phase 2. |
| Phase 2 | Wheels keep turning after commands stop | **Stop**: press the emergency stop; record a defect in the controller timeout configuration. |
| Phase 3 | Motion resumes on release | **Stop**: record a defect; the drive must require a fresh command after power returns. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
