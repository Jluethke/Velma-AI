# Gazebo Sensor Models with Datasheet-Derived Noise

**One-line description:** Adds camera, GPU LiDAR, IMU and NavSat sensors to a Gazebo SDF car with update rates and Gaussian noise derived from the real sensors' datasheets, then measures the simulated noise to confirm the SDF values took effect.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vehicle_sdf` (string, required): Valid model from `vsim-gz-vehicle-model`.
- `sensor_spec` (object[], required): Per sensor: type, mounting pose on the vehicle (ROS frame, meters and radians), rate, resolution or channel count, range, and field of view, from the datasheet.
- `noise_params` (object, optional): Per sensor noise figures from the datasheet: IMU gyro and accelerometer noise density and bias instability, GNSS horizontal and vertical accuracy (and whether stated as 1-sigma, CEP or RMS), LiDAR range accuracy, camera noise if specified. When absent, sensors are added noise-free and each missing figure is an open question.

---

## Outputs

- `noisy_vehicle_sdf` (string): Path to the model SDF with sensors and noise blocks, plus a table mapping each SDF noise value to its datasheet source and derivation.

---

## Phase 1: Derive SDF Noise Values

### Entry Criteria
- `vehicle_sdf` passes `gz sdf -k`.

### Actions
1. For each figure in `noise_params`, convert to the SDF `<stddev>` (per-sample standard deviation) with this table:

| Datasheet figure | Conversion to per-sample stddev |
|---|---|
| Gyro or accel noise density N (unit per sqrt(Hz)) | stddev = N * sqrt(update_rate). This is the discrete white-noise relation used in Allan variance practice (IEEE Std 952). |
| Value stated as 1-sigma | Use directly. |
| Value stated as RMS with zero mean | Use directly as stddev. |
| CEP (50 percent, 2D) | Not directly convertible without a distribution assumption; record as open question or use the 1-sigma figure if the datasheet also gives it. |
| "Accuracy" with no statistic named | Open question; ask the vendor. Do not guess. |

2. Convert units to SI: degrees to radians, mg to m/s^2 (1 g = 9.80665 m/s^2, the standard gravity), centimeters to meters.
3. Bias instability maps to `<bias_mean>`/`<bias_stddev>` only with a stated derivation; if unsure, leave bias at zero and note it.
4. Write a derivation table: sensor, field, datasheet value and statistic, formula, SDF value.

### Output
Derivation table.

### Quality Gate
- Every non-zero SDF noise value has a row with source and formula.
- Every figure that could not be converted appears as an open question.

---

## Phase 2: Add Sensors to the SDF

### Entry Criteria
- Derivation table complete.

### Actions
1. Inside the `chassis` link add one `<sensor>` per spec entry. Use these types and blocks:
   - Camera: `<sensor name="front_cam" type="camera"><update_rate>R</update_rate><topic>front_cam/image</topic><camera><horizontal_fov>F</horizontal_fov><image><width>W</width><height>H</height></image><clip><near>0.1</near><far>FAR</far></clip><noise><type>gaussian</type><mean>0</mean><stddev>S</stddev></noise></camera></sensor>`
   - LiDAR: `type="gpu_lidar"` with `<lidar><scan><horizontal><samples/><min_angle/><max_angle/></horizontal><vertical>...</vertical></scan><range><min/><max/><resolution/></range><noise><type>gaussian</type><mean>0</mean><stddev>S</stddev></noise></lidar>`.
   - IMU: `type="imu"` with `<imu><angular_velocity><x><noise type="gaussian"><mean>0</mean><stddev>S</stddev></noise></x>` repeated for y, z, and the same under `<linear_acceleration>`.
   - GNSS: `type="navsat"` with `<navsat><position_sensing><horizontal><noise type="gaussian"><mean>0</mean><stddev>S</stddev></noise></horizontal><vertical>...</vertical></position_sensing></navsat>`.
2. Use mounting poses from `sensor_spec` in `<pose>` (SDF is right-handed, x forward, y left, z up, same as REP 103).
3. Camera near clip 0.1 above is a placeholder; set it from the lens minimum focus distance or record it as an open question.
4. Validate: `gz sdf -k models/car/model.sdf` prints `Valid.`.
5. Do NOT add noise to a sensor whose figure is an open question; leave the `<noise>` block out so the gap is visible.

### Output
`noisy_vehicle_sdf`.

### Quality Gate
- `gz sdf -k` prints `Valid.`.
- `grep -c "<sensor " models/car/model.sdf` equals the number of `sensor_spec` entries.

---

## Phase 3: Measure the Simulated Noise

### Entry Criteria
- Model valid; world loads the Sensors, IMU and NavSat systems.

### Actions
1. Run the world headless with the car at rest: `gz sim -s -r --headless-rendering worlds/test_track.sdf`.
2. Capture IMU samples: `gz topic -e -t /imu -n 2000 > imu.txt` (topic name as set in the SDF; list with `gz topic -l`). Confirm `-n` with `gz topic --help`.
3. Extract angular velocity x values and compute the sample standard deviation (for example with a short NumPy script in your project). At rest the mean is near zero and the sample stddev should match the SDF stddev within the statistical spread of 2000 samples.
4. Measure the rate: `gz topic -f -t /imu` (or `gz topic --help` for the frequency option on your version) and compare with `<update_rate>`.
5. Record measured versus configured values per sensor.

### Output
Measured-noise table appended to `noisy_vehicle_sdf` notes.

### Quality Gate
- Measured rate per sensor is printed next to its `<update_rate>`.
- Measured IMU stddev is printed next to the SDF stddev for each axis.

---

## Worked Example

Illustrative. IMU datasheet gyro noise density 0.007 deg/s/sqrt(Hz), rate 200 Hz. stddev = 0.007 * sqrt(200) = 0.099 deg/s = 0.00173 rad/s. GNSS datasheet "1.5 m CEP" with no 1-sigma: open question, no GNSS noise added.
```
$ gz sdf -k models/car/model.sdf
Valid.
$ python tools/stddev.py imu.txt angular_velocity.x
n=2000 mean=0.00002 std=0.00171
```

---

## Exit Criteria

DONE when every sensor in `sensor_spec` is in the SDF, every noise value is derived from a datasheet figure or recorded as an open question, and measured simulated noise and rates are reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Datasheet statistic unnamed | **Stop**: record as open question; do not assume 1-sigma. |
| Phase 2 | Sensor publishes nothing | **Adjust**: the world is missing the Sensors, IMU or NavSat system; add it. |
| Phase 3 | Measured stddev far from configured | **Adjust**: check units (degrees vs radians) and that the vehicle was at rest. |
| Phase 3 | Rate lower than configured | **Return**: report it; rendering sensors may be limited by GPU. Do not lower `<update_rate>` to hide it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
