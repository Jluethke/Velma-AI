# Intermodulation Product Prediction

Predict all intermodulation products that fall in the receiver band from the two-tone test or from the system frequency plan, identifying which are problematic.

## Inputs

- `frequency-plan`: System frequencies: desired signal, LO, IF, and any known interferers with their power levels
- `receiver-architecture`: Receiver block diagram showing each nonlinear stage: LNA, mixer, IF amplifier, ADC

## Outputs

- `intermod-product-map`: Table of intermodulation products (order, input frequencies, output frequency, power level estimate) that fall within or near the receiver IF band
- `critical-intermod-products`: The specific IM products that limit system performance, ranked by power level at the receiver IF

## Process

1. For two input signals at f1 and f2, the intermodulation products of order n appear at frequencies m*f1 + n*f2 where |m| + |n| = order. Third-order products at 2f1-f2 and 2f2-f1 are closest to the fundamental signals and hardest to filter.
2. Calculate the IM product frequencies for all pairs of signals in the frequency plan up to at least 5th order. Include the desired signal, LO harmonics, and any known interferers.
3. For a mixer, the spurious products at m*RF + n*LO map to the IF band when m*f_RF + n*f_LO = f_IF. Use a mixing spur chart (published by mixer manufacturers) to identify which m,n products have significant amplitude.
4. Estimate the power level of each IM product. For third-order products in an amplifier: P_IM3 = 3*P_in - 2*OIP3 (all in dBm). For fifth-order: P_IM5 = 5*P_in - 4*OIP5. The IM products grow at (order) dB per dB of input power.
5. Rank the products by their power level at the IF output. The product with the highest level relative to the desired signal sets the spurious-free dynamic range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
