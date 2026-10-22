# Jitter Decomposition And Budgeting

Decompose total jitter into its components (random, deterministic, periodic, data-dependent), allocate jitter budgets, and verify the link meets timing margin.

## Inputs

- `equalized-eye`: Equalized eye diagram
- `data-rate`: Line rate for UI to time conversion
- `tx-fir-coefficients`: TX settings that affect DJ through ISI residual

## Outputs

- `jitter-decomposition`: Breakdown: Tj = Rj (rms, converted to peak-peak at target BER) + Dj_pp (Dj = DDJ + DCD + PJ + BUJ)
- `timing-margin`: Remaining timing margin in ps and fraction of UI after jitter allocation at target BER
- `jitter-budget-table`: Budget showing each jitter source, its allocation, and the margin per source

## Process

1. Measure or simulate total jitter (Tj) at the receiver sampling point. Tj decomposes into random jitter (Rj, Gaussian, unbounded) and deterministic jitter (Dj, bounded). Separate them using a dual-Dirac model or tail-fit method on the jitter histogram.
2. Convert Rj (rms) to peak-peak at the target BER: Rj_pp = 2 * Q * Rj_rms, where Q = 7.03 for BER = 1e-12, Q = 7.94 for BER = 1e-15. Then Tj_pp = Rj_pp + Dj_pp. This is the total timing uncertainty.
3. Decompose Dj into: data-dependent jitter (DDJ, caused by ISI residual after equalization), duty cycle distortion (DCD, caused by threshold offset), periodic jitter (PJ, from power supply noise or crosstalk coupling at specific frequencies), and bounded uncorrelated jitter (BUJ, everything else).
4. Calculate timing margin: the equalized eye width at the target BER contour minus Tj_pp. Express as fraction of UI: for a 25 Gbps link (UI = 40 ps), if equalized eye width at 1e-12 is 32 ps and Tj_pp is 24 ps, margin is 8 ps = 0.2 UI. Protocol specs define minimum margin (typically 0.1 to 0.3 UI depending on the spec). If margin is insufficient, identify the dominant jitter source and attack it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
