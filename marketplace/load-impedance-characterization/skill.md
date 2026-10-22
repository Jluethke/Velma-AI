# Load Impedance Characterization

Measure or extract the complex load impedance at the operating frequency and characterize its variation across the required bandwidth.

## Inputs

- `load-description`: Description of the load to be matched: antenna, amplifier input, filter port, or other RF component
- `frequency-requirements`: Center frequency, bandwidth, and return loss target across the band

## Outputs

- `load-impedance-data`: Complex impedance Z = R + jX at the center frequency and at band edges, or S11 data across frequency
- `smith-chart-position`: Normalized impedance plotted on the Smith chart: r and x circles, distance from center (reflection coefficient magnitude)

## Process

1. Measure the load impedance using a calibrated VNA. If measurement is not available, extract from the component datasheet or simulation S-parameters.
2. Record S11 (or Z) at the center frequency and at regular intervals across the required bandwidth. The impedance variation across the band determines the matching difficulty.
3. Normalize the impedance to the system impedance (typically 50 ohms): z = Z/Z0. Plot on the Smith chart.
4. Calculate the reflection coefficient: Gamma = (Z - Z0)/(Z + Z0). The magnitude |Gamma| indicates how far from matched the load is. |Gamma| = 0 is perfect match, |Gamma| = 1 is total reflection.
5. Convert to return loss: RL = -20*log10(|Gamma|). The target return loss (typically 10 to 20 dB) defines the acceptable matching circle on the Smith chart.
6. Note the Q of the load impedance: Q = |X|/R. High-Q loads (Q > 5) require more matching sections or accept narrower bandwidth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
