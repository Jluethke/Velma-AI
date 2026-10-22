# Ripple And Noise Measurement

Measure output ripple and noise with proper bandwidth limiting, probe technique, and measurement point selection to avoid false readings from probe artifacts.

## Inputs

- `supply-specification`: Ripple and noise specification (peak-to-peak, RMS, bandwidth)
- `transient-response-data`: Dynamic performance data to correlate with ripple behavior under load

## Outputs

- `ripple-noise-data`: Measured peak-to-peak and RMS ripple at each load point, with fundamental switching frequency and harmonics identified
- `spectral-content`: FFT showing ripple frequency components, switching frequency, and any spurious emissions
- `measurement-technique-record`: Documentation of probe type, ground method, bandwidth limit, and measurement point for reproducibility

## Process

1. Use a tip-and-barrel probe technique: solder a short wire (less than 1cm) across the output capacitor and probe directly with the scope tip on one end and ground barrel on the other. This minimizes the ground loop area and eliminates ground lead inductance artifacts.
2. Set oscilloscope bandwidth limit to 20MHz (industry standard for ripple measurement, per JESD22-A106 and most supply specifications). Without the bandwidth limit, high-frequency noise from the scope and probe dominates the reading.
3. Measure at no-load, 25%, 50%, and 100% load. Record both peak-to-peak (from single acquisitions, or envelope mode over 10 seconds) and RMS (from at least 1000 acquisitions). The peak-to-peak value catches intermittent spikes; the RMS value represents the thermal noise contribution.
4. Run an FFT on the captured waveform to identify frequency components. The switching frequency fundamental and its harmonics reveal the converter's ripple. Broadband noise indicates component noise or insufficient output filtering. Spurs at unexpected frequencies suggest EMI coupling from other board circuits.
5. If the measured ripple exceeds the specification, differentiate between capacitor ESR ripple (triangular waveform at switching frequency, amplitude = ripple_current * ESR) and capacitance ripple (parabolic waveform, amplitude = ripple_current / (8 * f_sw * C)). The waveform shape tells you which dominates and therefore which to fix.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
