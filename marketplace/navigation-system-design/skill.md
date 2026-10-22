# Navigation System Design

Design the inertial navigation system for a launch vehicle: select sensors, model error propagation, and design sensor fusion with external aiding sources.

## Inputs

- `trajectory-requirements`: Orbit insertion accuracy requirements (semi-major axis, inclination, RAAN, argument of perigee tolerances)
- `vehicle-dynamics`: Mass, thrust, burn times, stage separation events, expected vibration environment

## Outputs

- `navigation-design`: Sensor selection, error model, fusion algorithm, predicted navigation accuracy at orbit insertion
- `error-budget`: Navigation error budget allocating contributions from each sensor error source

## Process

1. Select the IMU. Ring laser gyros (RLG): bias stability 0.003-0.01 deg/hr, scale factor 1-5 ppm, suitable for large launch vehicles. Fiber optic gyros (FOG): bias stability 0.01-0.1 deg/hr, lighter and cheaper, suitable for small launch vehicles. Accelerometers: pendulous integrating gyro accelerometer (PIGA) for highest accuracy, or MEMS for cost-sensitive applications. The IMU must survive the launch vibration environment.
2. Model navigation error propagation. The position error grows with time due to gyro drift (attitude error causes accelerometer misalignment, which integrates into velocity error, which integrates into position error). The dominant error source is gyro bias: position error grows as approximately 0.5 * bias * g * t^2 for a bias-induced tilt. For a 0.01 deg/hr gyro over a 500-second burn, the position error at cutoff is approximately 100-500 meters depending on trajectory.
3. Design external aiding. GPS provides position (10 m) and velocity (0.1 m/s) updates that bound the INS drift. Implement a loosely or tightly coupled GPS/INS Kalman filter. For high-altitude or fast-moving phases where GPS may be degraded, use star tracker updates for attitude reset. The Kalman filter state vector includes position, velocity, attitude, and sensor error states (biases, scale factors).
4. Build the navigation error budget. Allocate the total orbit insertion accuracy requirement across the contributing sources: IMU errors (gyro bias, gyro scale factor, accelerometer bias, accelerometer scale factor), GPS errors (if used), alignment errors (IMU-to-vehicle alignment), and guidance execution errors. Use covariance analysis or Monte Carlo simulation to verify the RSS of all sources meets the requirement.
5. Define the pre-flight alignment procedure. Transfer alignment from the launch pad azimuth reference to the IMU: gyrocompass for azimuth (accuracy limited by gyro bias and Earth rate), leveling for tilt. The alignment time depends on the gyro quality: finer gyros achieve better azimuth accuracy in shorter time. For strap-down IMUs, the alignment is performed in software using the sensed Earth rate and gravity vectors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
