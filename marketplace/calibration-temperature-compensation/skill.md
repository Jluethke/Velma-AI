# Calibration Temperature Compensation

Design the calibration and temperature compensation procedures to achieve the required measurement accuracy across the full operating temperature range.

## Inputs

- `accuracy-spec`: Required measurement accuracy (e.g., +/- 0.5 percent FS) over the temperature range (-40 to 85C)
- `sensor-thermal-behavior`: Sensor sensitivity TC (ppm/C), offset TC, bridge resistance TC if applicable
- `conditioning-circuit`: Amplifier gain TC, reference voltage TC, ADC gain and offset TC

## Outputs

- `calibration-procedure`: Number of calibration points, calibration algorithm (linear 2-point, polynomial, or lookup table), and the calibration coefficients storage format
- `temperature-compensation`: Hardware compensation (bridge completion resistors with matching TC, reference resistor) and/or software compensation (temperature-dependent correction polynomial)

## Process

1. Two-point calibration corrects offset and gain errors: apply two known inputs (zero and full-scale), record the ADC outputs, and compute gain = (FS_actual - zero_actual) / (ADC_FS - ADC_zero) and offset = zero_actual - gain * ADC_zero. This corrects linear errors but not nonlinearity.
2. Multi-point calibration with polynomial fit: apply 5 to 10 known inputs across the measurement range, fit a polynomial y = a0 + a1*x + a2*x^2 + ... of degree sufficient to reduce residual error below the accuracy spec. A third-order polynomial typically corrects sensor nonlinearity to better than 0.05 percent FS. Store the coefficients in EEPROM.
3. Temperature compensation for a resistive bridge: the bridge sensitivity TC is typically -0.1 to -0.3 percent/C for silicon strain gauges and -0.02 percent/C for metal foil gauges. Hardware compensation: add a resistor with matched TC in series with the excitation to reduce the excitation voltage as temperature rises, compensating the sensitivity increase. The compensation resistor value is R_comp = R_bridge * (TC_bridge / TC_comp).
4. Software temperature compensation: measure the temperature with a sensor near the measurement sensor, then apply a correction: V_corrected = V_measured * (1 + alpha * (T - T_cal)) where alpha is the temperature sensitivity coefficient determined during temperature characterization. For higher accuracy, use a 2D lookup table indexed by temperature and raw measurement.
5. End-to-end calibration validation: after calibration, sweep the input across the full range at -40C, 25C, and 85C, and verify the error stays within the accuracy spec at every point. If the error exceeds spec at temperature extremes, the temperature compensation model needs more terms (higher-order polynomial or a lookup table with finer temperature resolution).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
