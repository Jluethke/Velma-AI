# Sonar Performance Prediction

Predict sonar detection performance using the sonar equation, propagation modeling, and target characterization.

## Inputs

- `sound-speed-profile`: Sound speed vs depth
- `bottom-properties`: Bottom type and reflection characteristics
- `ambient-noise-spectrum`: Ambient noise levels
- `system-frequency`: Sonar operating frequency and bandwidth

## Outputs

- `detection-range-prediction`: Predicted detection range for specified target and conditions
- `transmission-loss-field`: TL vs range and depth from propagation model for the environment
- `sonar-equation-budget`: Complete sonar equation showing each term's contribution to the signal excess

## Process

1. Apply the sonar equation. For passive sonar: SE = SL - TL - NL + DI - DT where SL = source level of the target, TL = one-way transmission loss, NL = noise level, DI = receiving array directivity index, DT = detection threshold. For active sonar: SE = SL - 2TL + TS - NL + DI - DT where TS = target strength.
2. Calculate transmission loss with a propagation model matched to the environment and frequency. Ray tracing (valid when range >> depth, frequency > 1 kHz): traces rays through the sound speed profile, accounts for bottom and surface reflections. Normal modes (valid for low frequency, range-independent environments): sums modal contributions. Parabolic equation (PE: handles range-dependent environments, standard for many Navy applications).
3. Estimate target strength from the target's physical size and shape. For a submarine: TS is typically 15-25 dB depending on aspect, frequency, and hull type. For a mine: TS is 5-15 dB. For a surface ship: 15-25 dB. Target strength varies with aspect angle; broadside is highest.
4. Calculate the array directivity index DI = 10*log10(N) for N-element array with half-wavelength spacing (isotropic elements). For a line array: DI = 10*log10(2L/lambda) where L is array length. Beamwidth is approximately lambda/L radians.
5. Set detection threshold based on desired probability of detection Pd and probability of false alarm Pfa. For a single observation: DT = 5*log10(d(Pd, Pfa)). Typical: DT = 5-10 dB for Pd = 0.5, Pfa = 10^-4. Detection range is where signal excess transitions from positive to negative.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
