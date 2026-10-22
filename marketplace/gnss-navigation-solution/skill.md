# Gnss Navigation Solution

Compute position, velocity, and time from the tracked satellite measurements using least-squares or Kalman filter estimation.

## Inputs

- `tracking-loop-design`: Code and carrier tracking loop outputs (pseudorange, delta-range, carrier phase measurements)
- `acquisition-algorithm`: Satellite signal acquisition providing satellite visibility

## Outputs

- `navigation-algorithm`: Position/velocity/time estimation algorithm with DOP analysis and accuracy prediction
- `integrity-monitoring`: RAIM algorithm for fault detection and exclusion

## Process

1. Form the pseudorange observation equation: rho_measured = |r_sat - r_user| + c*dt_user + c*dt_iono + c*dt_tropo + multipath + noise. Four unknowns (x, y, z, dt_user) require minimum 4 satellites. Each additional satellite is redundancy for accuracy and integrity.
2. Apply corrections. Satellite clock: from broadcast ephemeris. Ionospheric delay: Klobuchar model (broadcast, removes ~50%), dual-frequency (L1-L2 or L1-L5, removes ~99%), SBAS (removes ~80%). Tropospheric delay: Saastamoinen or Hopfield model using surface meteorological data. Satellite orbit: broadcast ephemeris (~1 m) or precise ephemeris (2-5 cm from IGS).
3. Solve by weighted least squares: linearize about an approximate position, form the H matrix (direction cosines from user to each satellite), compute delta_x = (H'*W*H)^-1 * H'*W * delta_rho. Iterate until convergence (typically 3-5 iterations from a cold start). The weight matrix W reflects measurement quality (elevation-dependent weighting suppresses low-elevation multipath).
4. Compute DOP (Dilution of Precision). G = (H'*H)^-1 gives the geometry matrix. PDOP = sqrt(g11+g22+g33), HDOP and VDOP for horizontal and vertical components. PDOP < 3 is good geometry. DOP * UERE (User Equivalent Range Error) = position error estimate.
5. For kinematic applications, implement a Kalman filter with state vector [position, velocity, clock bias, clock drift]. The process model uses constant-velocity or constant-acceleration dynamics. Measurements are pseudorange and delta-range (Doppler). The Kalman filter provides smoother solutions and bridges short measurement gaps.
6. Implement RAIM (Receiver Autonomous Integrity Monitoring). With 5+ satellites, compute the residuals after the least-squares solution. The sum-of-squared residuals follows a chi-squared distribution. Compare to a threshold set by the allowable false alarm rate. With 6+ satellites, perform fault detection and exclusion: remove each satellite in turn and check if the residual drops below threshold to identify the faulty measurement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
