# Dynamic Range Calculation

Calculate the spurious-free dynamic range, blocking dynamic range, and useful dynamic range from the noise figure and IP3.

## Inputs

- `cascaded-ip3`: System IIP3
- `cascaded-noise-figure`: System noise figure (if available from noise-figure-analysis chain, otherwise input directly)
- `receiver-requirements`: Bandwidth and BER/SNR requirements

## Outputs

- `dynamic-range-analysis`: SFDR, BDR, MDS (minimum detectable signal), and the input power range from MDS to the compression or IM-limited level
- `agc-requirements`: Required automatic gain control range and strategy if the signal dynamic range exceeds the instantaneous dynamic range

## Process

1. Calculate the noise floor: MDS = -174 + 10*log10(BW) + NF + required_SNR (all in dB). This is the minimum detectable signal.
2. Spurious-free dynamic range (SFDR): the range of input power over which the desired signal is above the noise floor and the IM3 products are below the noise floor. SFDR = 2/3 * (IIP3 - MDS) for third-order limited systems. In dB: SFDR = 2/3 * (IIP3_dBm - (-174 + 10*log10(BW) + NF)).
3. Blocking dynamic range (BDR): the ratio of the strongest tolerable interferer (at the 1 dB compression point) to the minimum detectable signal. BDR = P1dB_input - MDS. Typically P1dB is about 10 dB below IIP3 for a weakly nonlinear device.
4. If the required signal dynamic range (ratio of strongest to weakest expected signal) exceeds the SFDR, automatic gain control (AGC) is needed. The AGC range must cover the difference. Determine whether front-end AGC (before LNA, preserves linearity at the cost of sensitivity) or IF AGC (after mixing, preserves sensitivity at the cost of linearity) is more appropriate.
5. Plot the full dynamic range picture: noise floor, MDS, SFDR boundary, 1 dB compression, and IM3 intercept on a single power-in vs. power-out chart. This visualization shows all the operating limits and the useful operating range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
