# Ins Error Model Design

Build the 15+ state error model that characterizes how sensor errors propagate into navigation errors over time.

## Inputs

- `mechanization-algorithm`: The strapdown mechanization equations
- `sensor-error-budget`: Gyro and accelerometer error parameters

## Outputs

- `error-state-model`: Linear error propagation model (F matrix) with process noise (Q matrix) for Kalman filter design
- `error-propagation-analysis`: Time histories of position, velocity, and attitude error growth for unaided operation

## Process

1. Define the error state vector. Standard 15-state: delta-position (3), delta-velocity (3), attitude error (3), gyro bias (3), accelerometer bias (3). For higher fidelity, add gyro scale factor (3), accel scale factor (3), gyro misalignment (3) for a 24-state model.
2. Derive the error dynamics F matrix by linearizing the mechanization equations. Key coupling terms: attitude error couples into velocity error through specific force (f x delta-psi), velocity error couples into position error through integration, and latitude error couples into east velocity error through Coriolis.
3. Identify the Schuler oscillation: a ~84-minute period oscillation where horizontal position errors and tilt errors exchange energy. This is a fundamental property of inertial navigation on a rotating planet and cannot be removed by filtering. It bounds the free-inertial position error growth pattern.
4. Model the sensor errors. Gyro bias as a first-order Markov process with correlation time from 1 hour (tactical MEMS) to hundreds of hours (navigation-grade RLG). Random walk as white noise driving the Markov process. Accelerometer bias similarly modeled. Set process noise Q from the sensor specifications (ARW, VRW, bias instability).
5. Run a covariance propagation (P_dot = F*P + P*F' + Q) to predict error growth over time without aiding. Verify that the Schuler oscillation appears in the horizontal channel, that vertical channel error grows quadratically (no Schuler bounding), and that heading error growth matches the gyro drift rate.
6. Document the observability of each error state. Without external aiding, accelerometer biases in the horizontal plane are indistinguishable from tilt errors (this is the fundamental limitation of unaided INS). Vertical channel is inherently unstable without altitude aiding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
