# Inertial Navigation Design

Select and configure the inertial measurement unit and analyze navigation error propagation through ascent.

## Inputs

- `orbit-insertion-accuracy`: Required orbit insertion accuracy (altitude, velocity, inclination tolerances)
- `mission-duration`: Time from liftoff to orbit insertion (error grows with time)
- `cost-reliability-constraints`: Budget and reliability requirements (drives IMU grade selection)

## Outputs

- `imu-specification`: IMU grade (navigation, tactical, MEMS), sensor error budgets
- `navigation-error-budget`: Position and velocity error at orbit insertion from each error source
- `alignment-requirements`: Pre-launch alignment procedure and accuracy requirements

## Process

1. IMU error sources: gyro bias (degrees/hour, causes position error that grows as t^2), gyro scale factor (causes velocity-dependent error), accelerometer bias (micro-g, causes position error growing as t^2), accelerometer scale factor, and noise (random walk). Each error source contributes independently to the navigation solution.
2. For a typical LEO launch (500 seconds): a 0.01 deg/hr gyro bias produces about 200 m position error at insertion. A 100 micro-g accelerometer bias produces about 12 m/s velocity error. Navigation-grade IMUs (ring laser gyro or fiber optic gyro) achieve these levels.
3. Error propagation: propagate each error source through the trajectory using the linearized navigation equations (state transition matrix). The position and velocity errors at insertion are the RSS of all contributions. This analysis determines if the IMU grade is adequate for the mission accuracy requirement.
4. Pre-launch alignment: the IMU must be aligned to the local vertical and true north before launch. Gyrocompassing uses the Earth's rotation rate sensed by the gyros to find north; this takes 5-20 minutes depending on latitude and gyro quality. At equatorial sites, gyrocompassing is difficult (small horizontal component of Earth rate).
5. For missions requiring better accuracy than inertial navigation alone provides, add GPS updates during ascent (outside the atmosphere) or star tracker measurements. Sensor fusion via Kalman filter corrects the INS drift. GPS-aided INS can achieve 10 m, 0.1 m/s accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
