# Gazebo Ackermann Vehicle Model and World

**One-line description:** Builds an SDF car model with Ackermann steering for Gazebo (gz sim Garden or newer, or Ignition Fortress), a world file with the required system plugins, and validates both with the SDF checker and a short headless run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gz_version` (string, required): "fortress", "garden", "harmonic" or newer. Fortress uses `ign` commands and `ignition-gazebo-*` plugin names; Garden and newer use `gz` and `gz-sim-*`.
- `vehicle_params` (object, required): Wheelbase, track width, wheel radius, wheel width, kingpin width, maximum steering angle (radians), total mass, and center of mass position, each with its source (spec sheet or measurement).

---

## Outputs

- `vehicle_sdf` (string): Path to `models/car/model.sdf` with links, joints, inertials and the Ackermann steering plugin.
- `world_file` (string): Path to `worlds/test_track.sdf` that includes the car and loads the physics, user-commands, scene-broadcaster, sensors, IMU and NavSat systems.

---

## Phase 1: Choose Names by Version

### Entry Criteria
- `gz_version` and `vehicle_params` present; every parameter has a source.

### Actions
1. Fill this table and use it for every name in later phases:

| Item | Fortress | Garden and newer |
|---|---|---|
| CLI | `ign gazebo`, `ign sdf`, `ign topic` | `gz sim`, `gz sdf`, `gz topic` |
| Ackermann plugin filename | `ignition-gazebo-ackermann-steering-system` | `gz-sim-ackermann-steering-system` |
| Ackermann plugin name | `ignition::gazebo::systems::AckermannSteering` | `gz::sim::systems::AckermannSteering` |
| Sensors system | `ignition-gazebo-sensors-system` | `gz-sim-sensors-system` |
| Message prefix | `ignition.msgs.` | `gz.msgs.` |

2. Confirm the plugin files exist on this install: `gz sim --help` runs, and `ls $(dirname $(which gz))/../lib/*/gz-sim*/plugins 2>/dev/null` or the package file list (`dpkg -L libgz-sim8-plugins` for Harmonic) shows the Ackermann library. If you cannot find it, check the package name for your version in the Gazebo install docs.
3. Any parameter without a source is an open question. Do not fill it from a "typical car".

### Output
Version name table and a sourced parameter list.

### Quality Gate
- The Ackermann library path is printed from the local install.
- Every value in `vehicle_params` has a cited source.

---

## Phase 2: Write the Model

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `models/car/model.sdf` with: `chassis` link (box collision, inertial with mass and a computed box inertia: Ixx = m(y^2+z^2)/12 and so on for box dimensions), four wheel links (cylinder, inertia for a solid cylinder), two steering links at the front.
2. Joints: `front_left_steering_joint` and `front_right_steering_joint` (revolute, axis z, limits plus and minus the maximum steering angle); `front_left_wheel_joint`, `front_right_wheel_joint`, `rear_left_wheel_joint`, `rear_right_wheel_joint` (revolute, axis along the wheel spin axis, unlimited).
3. Add the plugin inside `<model>`:
```xml
<plugin filename="gz-sim-ackermann-steering-system" name="gz::sim::systems::AckermannSteering">
  <left_joint>rear_left_wheel_joint</left_joint>
  <right_joint>rear_right_wheel_joint</right_joint>
  <left_steering_joint>front_left_steering_joint</left_steering_joint>
  <right_steering_joint>front_right_steering_joint</right_steering_joint>
  <kingpin_width>KINGPIN</kingpin_width>
  <steering_limit>MAX_STEER</steering_limit>
  <wheel_base>WHEELBASE</wheel_base>
  <wheel_separation>TRACK</wheel_separation>
  <wheel_radius>RADIUS</wheel_radius>
  <topic>/model/car/cmd_vel</topic>
</plugin>
```
   Replace placeholders from `vehicle_params`. For Fortress use the Fortress names from the table.
4. Validate: `gz sdf -k models/car/model.sdf` must print `Valid.`.
5. Do NOT copy inertia values from another model; compute them from this vehicle's mass and dimensions.

### Output
`vehicle_sdf`.

### Quality Gate
- `gz sdf -k models/car/model.sdf` prints `Valid.`.
- Every placeholder is replaced (`grep -c -E "KINGPIN|MAX_STEER|WHEELBASE|TRACK|RADIUS" models/car/model.sdf` prints 0).

---

## Phase 3: World File and Headless Smoke Run

### Entry Criteria
- `vehicle_sdf` valid.

### Actions
1. Create `worlds/test_track.sdf` with `<physics name="fixed" type="ode"><max_step_size>0.001</max_step_size><real_time_factor>1.0</real_time_factor></physics>` (these are the SDF defaults; change only for a documented reason) and the systems: `gz-sim-physics-system` (`gz::sim::systems::Physics`), `gz-sim-user-commands-system`, `gz-sim-scene-broadcaster-system`, `gz-sim-sensors-system` with `<render_engine>ogre2</render_engine>`, `gz-sim-imu-system`, `gz-sim-navsat-system`. Add `<spherical_coordinates>` with the test site's latitude and longitude if GNSS is used.
2. Include the ground plane and the car: `<include><uri>model://car</uri><pose>0 0 0.5 0 0 0</pose></include>`, and export `GZ_SIM_RESOURCE_PATH=$PWD/models` (Fortress: `IGN_GAZEBO_RESOURCE_PATH`).
3. Validate: `gz sdf -k worlds/test_track.sdf`.
4. Smoke run headless: `gz sim -s -r -v 4 --iterations 2000 worlds/test_track.sdf`. While it runs in a second terminal: `gz topic -l | grep cmd_vel` and `gz topic -t /model/car/cmd_vel -m gz.msgs.Twist -p "linear: {x: 1.0}"`, then `gz model -m car -p` to read the pose.
5. Read the result: the pose x increases after the command means drive works; the car sinking through the ground means a collision is missing; the car flipping at rest means a bad inertial or center of mass.

### Output
`world_file` and a smoke-run log.

### Quality Gate
- `gz sdf -k worlds/test_track.sdf` prints `Valid.`.
- `gz model -m car -p` shows x position changed after the command and z within the wheel radius of its start.

---

## Worked Example

Illustrative. `gz_version` = "harmonic", wheelbase 2.85 m, track 1.58 m, wheel radius 0.33 m, mass 1600 kg (from the vehicle owner's manual and tape measure).
```
$ gz sdf -k models/car/model.sdf
Valid.
$ gz sim -s -r -v 4 --iterations 2000 worlds/test_track.sdf &
$ gz topic -t /model/car/cmd_vel -m gz.msgs.Twist -p "linear: {x: 1.0}"
$ gz model -m car -p
Name: car
  - Pose [ XYZ (m) ] [ RPY (rad) ]:
    [3.12 0.00 0.33]
    [0.00 0.00 0.00]
```

---

## Exit Criteria

DONE when the model and world pass `gz sdf -k`, and a headless run moves the car in response to `cmd_vel` without sinking or flipping.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parameter has no source | **Stop**: get the value from a spec sheet or measurement; record as open question. |
| Phase 2 | `gz sdf -k` reports an error | **Adjust**: fix the named element and line; rerun. |
| Phase 3 | `Failed to load system plugin` | **Adjust**: the filename does not match your version; use the Phase 1 table. |
| Phase 3 | Car does not move | **Adjust**: check joint names in the plugin match the model and the topic name matches. |
| Phase 3 | Car flips or jitters at rest | **Return**: to Phase 2 and recompute inertials. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
