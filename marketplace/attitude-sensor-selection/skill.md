# Attitude Sensor Selection

Select the sensor suite and build the attitude-knowledge error budget.

## Inputs

- `pointing_budget`: Knowledge allocation the sensors must meet.
- `orbit_parameters`: Environment constraints such as Sun and Earth presence.

## Outputs

- `sensor_suite`: Chosen complement of star trackers, Sun sensors, gyros, and magnetometers.
- `attitude_knowledge_budget`: Root-sum-square knowledge error from the selected sensors.

## Process

1. Star trackers give 1 to 10 arcsec accuracy and absolute three-axis attitude but need an unobstructed field of view and a lost-in-space acquisition mode.
2. Sun sensors give coarse 1 deg or digital 0.1 deg knowledge for safe mode; Earth and horizon sensors give nadir reference for Earth-pointing craft.
3. Rate gyros propagate attitude between star-tracker updates; specify angle random walk (for example 0.003 deg/sqrt-hr) and bias stability (0.01 deg/hr) since these drive drift.
4. Magnetometers give about 0.5 deg attitude from the local field and double as input to magnetic unloading.
5. Fuse the sensors in an estimator (deterministic QUEST for a snapshot, an extended Kalman filter for continuous estimation) and root-sum-square the contributors into the knowledge budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
