# Stability Verification Method

Verify loop stability across all operating conditions (input voltage range, load range, temperature) using Bode plots, step responses, and Nyquist criteria for edge cases.

## Inputs

- `compensator-transfer-function`: Designed compensator with component values
- `loop-gain-analysis`: Nominal loop gain Bode plot

## Outputs

- `stability-across-conditions`: Phase and gain margin at each corner of the operating range (min/max Vin, min/max load), with worst-case condition identified
- `transient-response-prediction`: Predicted output voltage deviation for specified load step, calculated from loop gain bandwidth and output capacitance

## Process

1. Recalculate the plant transfer function at all four corners: (Vin_min, Iout_min), (Vin_min, Iout_max), (Vin_max, Iout_min), (Vin_max, Iout_max). The plant changes significantly: DC gain varies with Vin (buck) or D (boost), resonance frequency shifts with load, and damping changes.
2. Plot loop gain T(s) at each corner with the fixed compensator. The compensator is designed at one operating point (typically worst case for phase margin) and must provide adequate stability everywhere else. Minimum phase margin across all corners must exceed 30 degrees (45 preferred).
3. For current-mode control, verify slope compensation adequacy across the full duty cycle range. At D > 0.5 without sufficient slope compensation, the current loop becomes unstable (subharmonic oscillation at fsw/2). Check: Se/Sf > 0.5 at maximum duty cycle.
4. Predict transient response. For a load step delta_I, the initial voltage deviation is delta_V = delta_I * ESR (fast, within one switching cycle) plus delta_V_cap = delta_I / (C * 2*pi*fc) (slow, limited by bandwidth). Total peak deviation = ESR step + bandwidth-limited droop. Verify this meets the output voltage tolerance.
5. Document the worst-case operating point for phase margin, the transient response prediction, and any conditional stability risks. If any corner fails, iterate on the compensator design: adjust zero/pole placement or reduce crossover frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
