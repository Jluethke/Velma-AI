# Soc Estimation Algorithm

Implement the state-of-charge estimation algorithm combining coulomb counting with model-based correction to achieve accuracy within 3 to 5 percent across operating conditions.

## Inputs

- `ocv-soc-curve`: OCV vs SOC lookup table at multiple temperatures
- `impedance-model`: Equivalent circuit model parameters vs SOC and temperature
- `sensor-specs`: Current sensor accuracy and offset, voltage sensor accuracy, temperature sensor accuracy

## Outputs

- `soc-algorithm`: The implemented SOC estimation method with state equations, tuning parameters, and expected accuracy vs conditions
- `initialization-strategy`: How SOC is initialized at power-on (from stored value, OCV lookup after rest, or forced calibration at full/empty)

## Process

1. Coulomb counting alone: SOC(t) = SOC(0) - (1/Qnom) * integral(I(t) dt). This drifts due to current sensor offset (even 10mA offset accumulates 36 mAh per hour) and uncertainty in the actual capacity Qnom (which changes with temperature and aging). Without correction, drift exceeds 10 percent SOC within hours.
2. Extended Kalman Filter (EKF) combines coulomb counting (prediction step) with the voltage model (correction step). State vector: x = [SOC, V_RC1, V_RC2]. Prediction: SOC_k+1 = SOC_k - (dt/(Qnom*3600))*I_k, V_RC1_k+1 = V_RC1_k * exp(-dt/tau1) + R1*(1-exp(-dt/tau1))*I_k. Measurement: V_terminal = OCV(SOC) - V_RC1 - V_RC2 - R0*I. The Kalman gain weights the model prediction vs the voltage measurement based on their respective noise covariances.
3. Tune the EKF process noise Q and measurement noise R. Process noise Q reflects the model uncertainty (larger Q makes the filter trust the voltage measurement more). Measurement noise R reflects the voltage sensor noise. Start with Q = diag([1e-6, 1e-8]) and R = [1e-4], then tune based on the SOC estimation error in validation tests.
4. The UKF (Unscented Kalman Filter) avoids the Jacobian calculation required by the EKF and handles the OCV nonlinearity more accurately. It propagates sigma points through the nonlinear state and measurement equations. For LFP cells with the flat OCV plateau, the UKF typically outperforms the EKF because the OCV function's near-zero derivative causes the EKF linearization to become inaccurate.
5. SOC initialization: after a rest period of at least 2 hours (so the cell has reached electrochemical equilibrium), measure OCV and look up SOC from the OCV-SOC table. If the vehicle was just turned off and back on (short rest), use the last stored SOC value. Calibrate to 100 percent when the charger signals end-of-charge (constant voltage phase current below C/20), and to 0 percent when the terminal voltage reaches the cutoff under load.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
