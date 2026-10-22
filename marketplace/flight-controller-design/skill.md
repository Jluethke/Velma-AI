# Flight Controller Design

Design the flight controller: cascaded attitude and rate control loops, state estimation from IMU and GPS, and failsafe behaviors.

## Inputs

- `airframe-design`: Airframe configuration, dimensions, and inertia estimates
- `propulsion-system`: Motor response characteristics and thrust mapping

## Outputs

- `flight-controller`: Control architecture with PID gains, state estimator configuration, and mixer matrix
- `failsafe-design`: Failsafe behaviors for GPS loss, RC link loss, low battery, and motor failure

## Process

1. Design the cascaded control architecture. Outer loop (position controller): takes desired position and velocity, outputs desired attitude angles and thrust. Runs at 50-100 Hz. Middle loop (attitude controller): takes desired roll, pitch, yaw angles, outputs desired angular rates. Runs at 250-500 Hz. Inner loop (rate controller): takes desired angular rates, outputs motor commands through the mixer. Runs at 250-1000 Hz. The cascaded structure allows each loop to be tuned independently with increasing bandwidth from outer to inner.
2. Tune PID controllers for each loop. Rate loop (innermost): dominates the handling quality. Start with P gain, increase until oscillation, back off 30%. Add D gain to damp oscillation. Add I gain to eliminate steady-state error from motor/prop imbalance. Attitude loop: P gain only (D is provided by the rate loop). Position loop: P gain for position hold stiffness, I for wind rejection, D for velocity damping. Tune in this order (inner first) because inner loop dynamics affect outer loop response. Use step response tests for rate and attitude loops, figure-8 flight for position loop.
3. Configure the state estimator. Fuse IMU (gyroscope and accelerometer) with GPS, magnetometer, and barometer using an EKF. Gyroscope: primary angular rate measurement, integrate for attitude between correction updates. Accelerometer: measures gravity direction for roll/pitch correction (unreliable during maneuvers, so reduce weight when acceleration is far from 1g). Magnetometer: heading reference, susceptible to magnetic interference (calibrate hard and soft iron, reduce weight near metal structures). GPS: position and velocity, 5-10 Hz update rate, 1-3m accuracy. Barometer: altitude, high-rate but affected by pressure changes and prop wash. Fuse with appropriate noise models for each sensor.
4. Design failsafe behaviors. GPS loss: hold position using last known GPS position with increasing uncertainty, land if GPS does not recover within timeout. RC link loss: execute return-to-launch at a safe altitude, land after a timeout, or continue the autonomous mission if configured. Low battery: alert, return-to-launch, forced landing at critical voltage to prevent damage. Motor failure: for hexacopter or octocopter, redistribute thrust to remaining motors (controllability analysis determines minimum motor count for each DOF). For quadcopter, a single motor failure means loss of yaw control; descend in controlled spin. Define the priority: land safely above all else.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
