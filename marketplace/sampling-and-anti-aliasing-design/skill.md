# Sampling And Anti Aliasing Design

Design the sampling front-end including the track-and-hold circuit, analyze kT/C noise and aperture jitter limits, and specify the anti-aliasing filter.

## Inputs

- `selected-architecture`: ADC architecture with sampling rate and resolution
- `input-bandwidth`: Signal bandwidth

## Outputs

- `sampling-capacitor-size`: Minimum sampling capacitor from kT/C noise constraint
- `aperture-jitter-budget`: Maximum tolerable aperture jitter for the target SNR
- `anti-aliasing-filter-spec`: Filter order, cutoff, and attenuation requirements

## Process

1. Calculate the minimum sampling capacitor from kT/C noise: SNR_kTC = 10*log10(Vsig^2 / (kT/C)). For ENOB bits with full-scale sine wave: C_min = 12*kT / (Vfs^2 * 10^(-SNR/(10))). At room temperature with 1V full-scale and 12 ENOB, C_min is approximately 0.3 pF.
2. Calculate the aperture jitter limit: SNR_jitter = -20*log10(2*pi*fin*tj), where fin is the input frequency and tj is the RMS aperture jitter. For 14 bits at 100 MHz input, tj must be less than 0.12 ps. This sets the clock quality requirement.
3. The total SNR is: 1/SNR_total = 1/SNR_quantization + 1/SNR_kTC + 1/SNR_jitter + 1/SNR_distortion. Each must be at least 6 dB better than the target to avoid significant degradation when combined.
4. Design the anti-aliasing filter. The filter must attenuate out-of-band signals so that aliased components are below the noise floor. Attenuation at fs/2 must be at least SNDR + 10 dB. For sigma-delta with high OSR, the anti-aliasing requirements are relaxed because the first Nyquist zone is much narrower.
5. For the track-and-hold switch, calculate the on-resistance from settling time: the switch must settle to within 0.5 LSB in the available tracking time. Time constant tau = Ron * C_sample. Settling to N bits requires N*ln(2)*tau. Size the switch transistor width accordingly.
6. Account for switch nonlinearity: the MOSFET on-resistance varies with signal voltage (body effect and Vgs modulation). Use bootstrapped switches (gate voltage tracks the input) for >10-bit linearity, or transmission gates for lower resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
