# Cascaded Ip3 Calculation

Calculate the cascaded third-order intercept point of the receiver chain, identifying which stage limits the overall linearity.

## Inputs

- `receiver-architecture`: Block diagram with gain and IP3 for each stage
- `critical-intermod-products`: Identified IM products to protect against

## Outputs

- `cascaded-ip3`: System IIP3 and OIP3 with the contribution from each stage shown
- `linearity-limiting-stage`: The stage that contributes most to the overall IM3, with the fraction of total IM power from each stage

## Process

1. For cascaded stages, the overall IIP3 (referred to the system input) is: 1/IIP3_total = 1/IIP3_1 + G1/IIP3_2 + G1*G2/IIP3_3 + ... where all quantities are in linear power (not dBm).
2. Convert each stage's IP3 and gain to linear: IIP3_linear = 10^(IIP3_dBm/10), G_linear = 10^(G_dB/10).
3. Apply the cascade formula. Each term represents one stage's contribution to the system IM3. The stage with the largest term is the linearity bottleneck.
4. High gain before a nonlinear stage amplifies the signals, making the IM products from that stage larger. This is why the LNA's linearity often limits the system: it has maximum gain preceding it (the antenna gain and any pre-amplifier).
5. The mixer is typically the most nonlinear component. Its contribution is weighted by all the gain before it. If the mixer limits, options include: reduce LNA gain, use a higher-IP3 mixer, or add attenuation before the mixer (at the cost of degraded noise figure).
6. Calculate the OIP3 = IIP3 + total system gain. The OIP3 determines the intermodulation level at the output for a given output signal level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
