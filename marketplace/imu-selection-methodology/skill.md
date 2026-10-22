# Imu Selection Methodology

Select an inertial measurement unit by matching sensor-grade performance to navigation accuracy requirements.

## Inputs

- `navigation-accuracy-requirement`: Position and attitude accuracy targets over mission duration
- `operating-environment`: Vibration, temperature, shock, and size/weight/power constraints

## Outputs

- `imu-grade-selection`: Selected IMU technology (MEMS, FOG, RLG, HRG) with performance justification
- `sensor-error-budget`: Gyro bias stability, ARW, accel bias, VRW values and their allocation to position error

## Process

1. Define position accuracy requirement at end of mission or navigation leg without external aiding (free-inertial drift budget).
2. Calculate allowable gyro drift rate: for a navigation-grade system, 1 deg/hr gyro drift yields roughly 1 nmi/hr position error. Scale linearly for the target accuracy and mission duration.
3. Map drift rate requirement to IMU technology. MEMS: 1-100 deg/hr (tactical). FOG: 0.001-1 deg/hr (navigation to tactical). RLG: 0.001-0.01 deg/hr (navigation). HRG: 0.0001-0.001 deg/hr (strategic/marine).
4. Check accelerometer bias requirement: 1 mg bias produces ~0.5 m position error per second squared. For 1-hour free-inertial, micro-g class bias is required for sub-km accuracy.
5. Evaluate angular random walk (ARW) and velocity random walk (VRW). ARW drives short-term attitude noise; VRW drives short-term velocity noise. Both matter for aided navigation Kalman filter performance.
6. Compare bandwidth requirements. Vibrating structure gyros (HRG, MEMS) have limited bandwidth. RLG and FOG handle high dynamics. Match to platform dynamics (missile: >100 Hz, ship: <10 Hz).
7. Evaluate SWaP constraints. MEMS: <50g, <1W. FOG: 0.5-5 kg, 5-15W. RLG: 5-15 kg, 15-50W. HRG: 3-10 kg, 10-30W.
8. Document the selected IMU with its datasheet parameters, the error budget allocation showing how each error source contributes to position/attitude error, and the cost-performance trade-off rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
