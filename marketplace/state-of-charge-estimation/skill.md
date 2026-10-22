# State Of Charge Estimation

Implement state of charge estimation using coulomb counting, OCV lookup, and Kalman filter fusion to achieve accurate SOC under all operating conditions.

## Inputs

- `balancing-method`: Cell balancing approach (affects per-cell monitoring requirements)
- `balancing-circuit-design`: Balancing circuit with current sensor placement

## Outputs

- `soc-algorithm`: SOC estimation algorithm specification: coulomb counting with OCV correction at rest periods, and extended Kalman filter for continuous estimation during operation
- `sensor-requirements`: Current sensor accuracy (hall effect, shunt resistor + amplifier), voltage measurement resolution, temperature sensor placement and accuracy

## Process

1. Implement coulomb counting as the baseline: SOC(t) = SOC(t0) + (1/Qnom) * integral(I * eta_c * dt) from t0 to t. Where eta_c is the coulombic efficiency (~99.5% for lithium-ion charge, 100% for discharge). The integral accumulates current over time. Error sources: current measurement offset (even 10mA offset accumulates to 0.24Ah per day), and capacity (Qnom) uncertainty.
2. Add OCV-based correction. When the pack rests for 30+ minutes (current near zero, voltage settling), read the cell voltage and look up SOC from the OCV(SOC) table. Reset the coulomb counter to this value. For LFP chemistry: the OCV curve is very flat from 20-80% SOC (only 50mV change), making OCV-based estimation poor in the middle range. For NMC: the OCV curve has better slope throughout.
3. Implement the extended Kalman filter (EKF). State vector: [SOC, V_rc1, V_rc2]. Measurement: terminal voltage Vt = OCV(SOC) - I*Rs - V_rc1 - V_rc2. Process model: SOC(k+1) = SOC(k) - (dt*I)/(3600*Qnom), V_rc1(k+1) = V_rc1(k)*exp(-dt/tau1) + R1*I*(1-exp(-dt/tau1)). The EKF fuses the coulomb counting (process model) with voltage measurement (observation model), weighting them by their respective noise covariances.
4. Tune the EKF. Process noise Q reflects confidence in coulomb counting: higher Q = more weight on voltage measurement. Measurement noise R reflects voltage sensor accuracy and model error. Start with Q = diag([1e-6, 1e-4, 1e-4]) and R = [1e-4] and tune against test data. The EKF should converge to within 3% SOC error within 10 minutes of operation regardless of initial SOC guess.
5. Specify the sensors. Current measurement: shunt resistor with instrumentation amplifier (accuracy 0.1-0.5% of reading) or hall-effect sensor (1-3% accuracy but galvanic isolation). Voltage measurement: the BMS monitor IC (e.g., LTC6813, MAX17853) measures each cell voltage to 1-2mV accuracy. Temperature: NTC thermistor per cell group, accuracy +/-1C, placed on the cell surface midway between tabs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
