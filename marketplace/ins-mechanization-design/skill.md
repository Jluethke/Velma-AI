# Ins Mechanization Design

Implement the strapdown inertial navigation mechanization equations that convert raw IMU measurements into position, velocity, and attitude.

## Inputs

- `imu-grade-selection`: Selected IMU technology and its specifications
- `sensor-error-budget`: Gyro and accelerometer error parameters

## Outputs

- `mechanization-algorithm`: Complete strapdown mechanization equations including attitude update, velocity update, and position update
- `computational-requirements`: Update rates, floating-point precision requirements, and processing load estimate

## Process

1. Define the reference frame convention: body frame (b), navigation frame (n, typically NED or ENU), Earth-Centered Earth-Fixed (ECEF), or Earth-Centered Inertial (ECI). For most terrestrial navigation, mechanize in the local-level navigation frame (NED).
2. Implement the attitude update. The body-to-nav direction cosine matrix (DCM) or quaternion propagation integrates the gyro measurements minus the transport rate and Earth rate. Use quaternion normalization to prevent drift. For high rotation rates, use the Bortz equation or equivalent for coning compensation.
3. Implement the velocity update. Transform specific force from body to navigation frame using the current DCM/quaternion: v_dot_n = C_b_n * f_b + g_n - (2*omega_ie_n + omega_en_n) x v_n. The gravity model matters: for navigation grade, use the Somigliana formula for normal gravity with free-air correction. For tactical, constant g is often sufficient.
4. Implement sculling compensation: the cross-coupling between rotation and specific force that creates velocity errors in a vibrating environment. This requires high-rate IMU data (typically 100-400 Hz) even if the navigation solution outputs at a lower rate.
5. Implement the position update. Integrate velocity to get latitude, longitude, and altitude. Account for the Earth's curvature: d(lat)/dt = v_N / (R_M + h), d(lon)/dt = v_E / ((R_N + h) * cos(lat)), d(h)/dt = -v_D. Use the WGS-84 ellipsoid parameters for meridional (R_M) and transverse (R_N) radii of curvature.
6. Set the computational update rates. Attitude: 100-400 Hz to capture coning. Velocity: same rate with sculling compensation. Position: can run at 1-50 Hz. Output: typically 1-100 Hz depending on application. Verify that the processor can sustain the required throughput with margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
