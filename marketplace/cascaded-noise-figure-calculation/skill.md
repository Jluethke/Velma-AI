# Cascaded Noise Figure Calculation

Calculate the cascaded noise figure of the receiver chain using the Friis equation, identifying which stages dominate the system noise performance.

## Inputs

- `noise-floor-analysis`: System noise figure budget
- `receiver-chain-components`: Ordered list of receiver stages with gain (dB) and noise figure (dB) for each: LNA, cable, filter, mixer, IF amplifier, etc.

## Outputs

- `cascaded-noise-figure`: System noise figure calculated from the Friis equation, with the contribution of each stage shown separately
- `stage-contribution-analysis`: Percentage noise contribution from each stage, identifying which stages dominate and which are negligible

## Process

1. Convert all gains and noise figures from dB to linear: G_linear = 10^(G_dB/10), F_linear = 10^(NF_dB/10).
2. Apply the Friis equation: F_total = F1 + (F2-1)/G1 + (F3-1)/(G1*G2) + (F4-1)/(G1*G2*G3) + ... Each term represents the noise contribution of that stage referred to the input.
3. Calculate the percentage contribution of each stage: contribution_k = (Fk-1)/(G1*G2*...*Gk-1) / (F_total - 1) * 100%.
4. The first stage (LNA) dominates if it has reasonable gain (> 10 dB). In a well-designed receiver, the LNA contributes 70 to 90% of the system noise. Stages after 20+ dB of gain contribute less than 1%.
5. A lossy component (cable, filter) before the LNA is devastating. A 3 dB loss before the LNA adds 3 dB to the system noise figure regardless of the LNA quality. This is why the LNA should be as close to the antenna as possible.
6. Convert the result back to dB: NF_system_dB = 10*log10(F_total). Compare to the noise figure budget. If the system NF exceeds the budget, identify which stage to improve (usually the LNA NF or the pre-LNA losses).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
