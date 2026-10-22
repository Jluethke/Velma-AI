# Clock Characterization Methodology

Characterize the atomic clock's stability, phase noise, and environmental sensitivity using standard metrology techniques.

## Inputs

- `clock-technology-selection`: Selected clock technology and its key parameters
- `physics-package-parameters`: Expected performance from technology selection

## Outputs

- `clock-performance-data`: Measured ADEV, phase noise, drift, and environmental coefficients
- `characterization-report`: Complete characterization with uncertainty analysis

## Process

1. Measure Allan deviation. Compare the clock under test against a reference clock of equal or better stability using a time interval counter or phase comparison system. Record phase difference samples at the base measurement rate (e.g., 1 Hz). Compute ADEV from the phase data using overlapping Allan variance: ADEV(tau) = sqrt(1/(2*(N-2*m)) * sum((x_{i+2m} - 2*x_{i+m} + x_i)^2)) where m=tau/tau_0. Plot ADEV vs tau on a log-log plot.
2. Identify noise types from the ADEV slope. White phase noise: ADEV proportional to tau^-1. White frequency noise (flicker floor): ADEV proportional to tau^-1/2. Flicker frequency noise: ADEV constant (flat). Random walk frequency: ADEV proportional to tau^1/2. Frequency drift: ADEV proportional to tau. Each noise type has a physical origin in the clock.
3. Measure phase noise L(f) in dBc/Hz using a phase noise measurement system (PLL-based or cross-correlation for low-noise clocks). This complements ADEV by showing the spectral distribution of noise. Convert between ADEV and L(f) using the transfer function for each noise type.
4. Measure temperature sensitivity. Step the temperature in a controlled chamber and measure the frequency change at each step after thermal settling. Compute the temperature coefficient in parts per unit per degree C. For Rb clocks, identify the zero-crossing temperature if the clock has a quadratic temperature characteristic.
5. Measure vibration sensitivity (g-sensitivity). Mount the clock on a vibration table and measure the induced phase noise during sinusoidal vibration at several frequencies and amplitudes. The g-sensitivity vector (Gamma) converts acceleration to fractional frequency: delta_f/f = Gamma dot g. Report the magnitude and direction of the sensitivity vector.
6. Measure drift rate from long-term data (weeks to months). Fit a linear or quadratic model to the frequency data after removing periodic components (diurnal, if present). Report drift in parts per unit per day or month. For clocks with significant drift, this sets the recalibration or steering interval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
