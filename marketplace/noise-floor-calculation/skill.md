# Noise Floor Calculation

Calculate the thermal noise floor for the receiver bandwidth and convert the system sensitivity requirement into a noise figure budget.

## Inputs

- `receiver-requirements`: Required sensitivity (dBm), signal bandwidth (Hz), modulation type, and required SNR
- `operating-conditions`: Ambient temperature, antenna noise temperature contribution (sky noise for satellite, ground noise for terrestrial)

## Outputs

- `noise-floor-analysis`: Thermal noise floor in dBm, required SNR, and the maximum allowable system noise figure to achieve the sensitivity target
- `noise-temperature-budget`: System noise temperature breakdown: antenna noise temperature, feed loss contribution, and receiver noise temperature

## Process

1. Calculate thermal noise power: N = kTB where k = 1.38e-23 J/K, T = system noise temperature in Kelvin, B = bandwidth in Hz. In dBm: N_dBm = -174 + 10*log10(B_Hz) at T = 290 K (room temperature, 17 C).
2. The required receiver sensitivity = noise floor + required SNR. Therefore, the maximum system noise figure = sensitivity_target - (-174 + 10*log10(B)) - required_SNR.
3. For systems with a non-room-temperature antenna (satellite earth stations, radio telescopes): use system noise temperature. T_sys = T_antenna + T_feed_loss + T_receiver. T_antenna is the noise temperature seen by the antenna (2.7 K cosmic background for a space-pointing antenna, up to 290 K for an antenna seeing the ground).
4. Convert between noise figure and noise temperature: F = 1 + T_e/T_0 where T_0 = 290 K. NF_dB = 10*log10(F). A 1 dB noise figure corresponds to T_e = 75 K. A 0.5 dB NF is 35 K.
5. Account for the feed loss between antenna and LNA. A lossy feed at temperature T contributes noise: T_feed = (L - 1) * T_physical, where L is the loss factor (not in dB). This directly adds to system noise temperature before the LNA.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
