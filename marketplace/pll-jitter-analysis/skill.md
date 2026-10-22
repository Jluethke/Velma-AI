# Pll Jitter Analysis

Analyze the PLL output jitter from all noise sources (reference, PFD, charge pump, VCO, divider), compute the transfer functions, and verify the total jitter meets the specification.

## Inputs

- `loop-filter-values`: Loop filter components and transfer function
- `vco-phase-noise-estimate`: VCO free-running phase noise
- `charge-pump-schematic`: Charge pump noise spectral density

## Outputs

- `jitter-budget`: RMS and peak-to-peak jitter with breakdown by noise source
- `phase-noise-at-output`: Output phase noise profile showing each contributor and the total

## Process

1. Each noise source sees a different transfer function to the output. Reference and charge pump noise are shaped by the closed-loop transfer function H(s) = G(s)/(1+G(s)), which is low-pass with bandwidth equal to the loop bandwidth. VCO noise is shaped by the error transfer function E(s) = 1/(1+G(s)), which is high-pass.
2. Reference oscillator phase noise at the output: multiply by N^2 (voltage gain of N) and by |H(jw)|^2. This dominates at offset frequencies below the loop bandwidth. A lower-noise reference or lower N directly reduces this contribution.
3. Charge pump noise at the output: Icp noise current spectral density is (4*k*T*gamma*gm + K/(Cox*W*L*f)) for each current source transistor. Multiply by |Z(jw) * Kvco / (s * N)|^2 * |H(jw)|^2. The flicker noise component is the main source of close-in phase noise in the PLL.
4. VCO phase noise at the output: multiply by |E(jw)|^2. The VCO dominates at offsets above the loop bandwidth. Wider loop bandwidth suppresses more VCO noise but passes more reference and charge pump noise. The optimal loop bandwidth is where the reference/CP noise (multiplied by N^2) equals the VCO noise.
5. Sum all noise contributions (in power, not amplitude) to get the total output phase noise. Integrate from the jitter measurement bandwidth lower limit (typically 12 kHz for SONET, 1 MHz for PCIe) to the upper limit (typically fout/2). RMS jitter = sqrt(2 * integral of L(f) df) / (2*pi*fout).
6. Convert RMS jitter to peak-to-peak using the appropriate multiplication factor (typically 14x for BER of 10^-12, assuming Gaussian distribution). Compare to the specification. If the jitter budget is tight, identify the dominant contributor and optimize that block.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
