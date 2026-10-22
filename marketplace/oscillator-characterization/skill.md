# Oscillator Characterization

Characterize an oscillator's stability and noise using Allan deviation and phase noise measurements.

## Inputs

- `oscillator-under-test`: Oscillator type and nominal specifications
- `reference-standard`: Available reference oscillator for comparison measurement

## Outputs

- `stability-profile`: Allan deviation plot from 0.01s to 10,000s averaging time with identified noise types
- `phase-noise-spectrum`: Phase noise spectral density L(f) from 1 Hz to 1 MHz offset

## Process

1. Select the measurement method based on the oscillator frequency and the reference available. For RF oscillators (5 MHz, 10 MHz): use a frequency counter with a better reference, or a dual-mixer time-difference (DMTD) system for the highest resolution. For microwave: use a phase detector (mixer at quadrature). The reference must be at least 3x better than the DUT at the averaging times of interest, or use the three-cornered-hat method with three oscillators to separate individual contributions.
2. Measure phase data. Record the phase difference between the DUT and the reference at a high rate (e.g., 1 Hz or faster). For a frequency counter: read the time interval at 1 Hz, accumulate for N seconds per data point. For DMTD: the beat frequency is mixed down to a low frequency for precise phase measurement with sub-picosecond resolution.
3. Compute Allan deviation. From the phase data x(t) sampled at interval tau_0: ADEV(tau) = sqrt(1/(2*(N-2*m)*tau^2) * sum((x_{i+2m} - 2*x_{i+m} + x_i)^2)) where m = tau/tau_0 and N is the number of phase samples. Use overlapping Allan deviation for improved confidence. Compute for tau from tau_0 to N*tau_0/3. Plot on log-log axes.
4. Identify noise types from the ADEV slope. tau^-1: white phase modulation (WPM). tau^-1/2: white frequency modulation (WFM). tau^0 (flat): flicker frequency modulation (FFM), the flicker floor. tau^+1/2: random walk of frequency (RWFM). tau^+1: frequency drift. Each has a physical origin: WFM from thermal noise in the oscillator sustaining circuit, FFM from 1/f noise in the active device, RWFM from random walk in the resonator frequency (temperature, aging).
5. Measure phase noise L(f). For direct spectrum method: downconvert the oscillator to baseband and measure the power spectral density of the phase fluctuations. For PLL method: phase-lock a clean reference to the DUT, the PLL error voltage is proportional to phase noise within the loop bandwidth. Cross-correlation method: use two independent references and correlate to reject their noise, improving measurement noise floor by 5*log10(N_averages) dB.
6. Document the results. Allan deviation plot with error bars (chi-squared confidence intervals). Phase noise plot L(f) in dBc/Hz. Identify the dominant noise type at each averaging time. Note the flicker floor (best stability) and the averaging time at which it occurs. For clocks to be disciplined, note the crossing point between the local oscillator ADEV and the reference ADEV, which sets the optimal loop bandwidth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
