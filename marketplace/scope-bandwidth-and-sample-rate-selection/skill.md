# Scope Bandwidth And Sample Rate Selection

Determine the required oscilloscope bandwidth from the signal's rise time and the sample rate from Nyquist criteria, accounting for Gaussian vs flat-top response roll-off differences.

## Inputs

- `signal-specification`: Signal characteristics: frequency, rise time, amplitude, expected waveform shape
- `measurement-objective`: What parameter is being measured: timing, amplitude, rise time, jitter, or protocol decode

## Outputs

- `required-bandwidth`: Minimum oscilloscope bandwidth calculated from signal knee frequency (0.35/rise_time for Gaussian, 0.45/rise_time for flat-top)
- `required-sample-rate`: Minimum sample rate (at least 4x bandwidth for sin(x)/x interpolation, 2.5x for linear interpolation)
- `measurement-bandwidth-budget`: Cascaded bandwidth from probe and scope (BW_system = 1/sqrt(1/BW_probe^2 + 1/BW_scope^2))

## Process

1. Calculate the signal knee frequency from the fastest edge: f_knee = 0.35 / t_rise for 10-90% rise time, or 0.40 / t_rise for 20-80% definition.
2. Apply the 5x rule: select a scope bandwidth at least 5x the fundamental frequency, or at least 3x f_knee for rise time measurements with less than 3% error.
3. Determine if Gaussian or flat-top response matters. Gaussian rolls off gradually so a signal near the bandwidth limit sees amplitude attenuation. Flat-top holds amplitude to the cutoff but rings on fast edges.
4. Calculate required sample rate. For accurate waveform reconstruction with sin(x)/x interpolation, 4x bandwidth minimum. For rise time and amplitude-only measurements, 2.5x bandwidth suffices.
5. Compute the cascaded system bandwidth from probe and scope bandwidth specifications. The system bandwidth is always less than either component alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
