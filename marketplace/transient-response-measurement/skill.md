# Transient Response Measurement

Measure power supply dynamic response to load steps including voltage deviation, recovery time, and overshoot/undershoot using proper oscilloscope technique with bandwidth limiting.

## Inputs

- `supply-specification`: Power supply transient response specification (deviation, recovery time, step current)
- `load-regulation-data`: Steady-state regulation data to establish baseline output voltage at each load point

## Outputs

- `transient-response-data`: Voltage deviation (peak undershoot/overshoot), recovery time to within regulation band, and settling behavior for each load step
- `load-step-waveforms`: Captured oscilloscope traces showing output voltage and load current during each transient event
- `dynamic-performance-assessment`: Comparison of measured transient performance to specification limits with margin analysis

## Process

1. Configure the electronic load for current-step transient mode. Set the low and high current levels, slew rate (typically 1A/us or as specified), and duty cycle (50% at a rate slow enough for full recovery between steps, typically 100Hz to 1kHz).
2. Measure output voltage with an oscilloscope using a short ground connection (spring-tip ground or solder-in ground point) directly at the supply output capacitor terminals. A 6-inch ground lead adds enough inductance to ring at the transient edge and corrupt the measurement.
3. Set oscilloscope bandwidth limit to 20MHz for ripple and noise measurements per standard practice. This filters high-frequency probe artifacts while passing the supply's actual transient response. For supplies specified to higher bandwidth, use the spec value.
4. Capture both the load-on (undershoot) and load-off (overshoot) transients. Measure peak voltage deviation from the pre-transient baseline, time to recovery within the steady-state regulation band, and any secondary ringing.
5. Test at the worst-case operating point: typically maximum load step at minimum input voltage for undershoot, and at maximum input voltage for overshoot. Verify that the output capacitor ESR/ESL does not dominate the transient (calculate: V_esr = I_step * ESR, V_esl = L_esl * dI/dt).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
