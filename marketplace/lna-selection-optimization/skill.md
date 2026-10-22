# Lna Selection Optimization

Select and optimize the low noise amplifier to minimize system noise figure while meeting linearity and stability requirements.

## Inputs

- `cascaded-noise-figure`: System NF and stage contributions
- `noise-floor-analysis`: NF budget target
- `receiver-requirements`: Frequency, bandwidth, linearity (IP3), and stability requirements

## Outputs

- `lna-selection`: Selected LNA device or design with noise figure, gain, IP3, and stability parameters
- `noise-linearity-tradeoff`: Analysis of the noise figure vs. linearity trade-off for the selected LNA, showing the optimal bias point

## Process

1. Survey available LNA devices or transistors for the operating frequency. Key parameters: noise figure, associated gain, IP3 (or P1dB), DC power, and stability (K-factor > 1 for unconditional stability).
2. The optimal noise match is NOT the same as the conjugate match for maximum gain. Every transistor has an optimum source impedance for minimum noise (Gamma_opt on the Smith chart). The noise figure increases as the source impedance deviates from Gamma_opt, tracing constant noise circles on the Smith chart.
3. If minimum noise figure is the priority, match the source to Gamma_opt and accept the gain penalty. If gain is also needed, find the compromise source impedance that stays inside the acceptable noise circle while providing adequate gain.
4. Check stability: calculate the K-factor and delta (or mu-factor) at the operating frequency and out of band. K > 1 and |delta| < 1 means unconditionally stable. If conditionally stable, add stabilizing elements (resistive loading) but check their noise contribution.
5. Optimize the LNA bias point. Lower drain current typically gives lower noise figure but also lower IP3. Find the bias point that meets both the NF and linearity (IP3) requirements. If both cannot be met simultaneously, consider a two-stage approach: low-noise first stage, high-linearity second stage.
6. Verify that the LNA gain is sufficient to suppress the noise contribution of subsequent stages. Typically 15 to 20 dB of LNA gain makes downstream stages negligible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
