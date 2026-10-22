# Ins Alignment Methodology

Design the alignment sequence that initializes the INS attitude from unknown or approximate orientation using a combination of gravity and Earth rotation sensing.

## Inputs

- `error-state-model`: The INS error model with state definitions
- `imu-grade-selection`: IMU performance parameters

## Outputs

- `alignment-procedure`: Complete alignment sequence with timing and accuracy predictions
- `alignment-accuracy`: Achievable heading, pitch, and roll accuracy as function of alignment time and IMU grade

## Process

1. Coarse leveling: determine pitch and roll from accelerometer measurements of gravity. With the platform stationary, the accelerometer body-frame output equals the gravity vector projected into body coordinates. Two-axis tilt is determined from atan2 of accelerometer components. Accuracy limited by accelerometer bias: 1 mg bias gives ~0.06 deg tilt error.
2. Coarse heading (gyrocompassing): determine heading from gyroscope measurement of Earth rotation rate. The horizontal component of Earth rate (omega_E * cos(lat) ~ 15 deg/hr * cos(lat)) projects into the body frame through the heading angle. Gyro bias directly limits heading accuracy: heading_error ~ gyro_bias / (omega_E * cos(lat)). At 45 deg latitude, a 0.01 deg/hr gyro gives ~0.06 deg heading. A 1 deg/hr gyro gives ~6 deg heading. MEMS gyros (>1 deg/hr) cannot gyrocompass.
3. Fine alignment: run the Kalman filter with the INS operating in navigation mode while stationary or with known zero velocity. The filter observes the difference between computed and measured velocity (zero velocity update, ZUPT) to estimate attitude errors. This improves heading beyond the coarse gyrocompass limit by averaging and by exploiting the Schuler coupling. Fine alignment typically requires 5-15 minutes for navigation-grade systems.
4. In-motion alignment: when the platform cannot be stationary, use GPS velocity aiding during the alignment phase. GPS velocity observes horizontal attitude errors through the velocity error they produce. Heading becomes observable through turns (heading error produces cross-track velocity error during turns). A figure-8 or S-turn maneuver accelerates heading convergence.
5. Transfer alignment: for a weapon or sensor INS mounted on a platform with its own navigation system, align the subordinate INS to the master. Use velocity matching (compare velocities) and attitude matching. Flexure between master and subordinate IMU locations introduces error that requires modeling or measurement of the relative motion.
6. Document the alignment time budget, the achievable accuracy for each phase, and the conditions required (stationary, maneuvering, or moving with GPS). Define go/no-go criteria: what alignment accuracy is needed before the mission can begin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
