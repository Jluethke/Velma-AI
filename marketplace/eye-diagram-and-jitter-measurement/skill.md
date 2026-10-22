# Eye Diagram And Jitter Measurement

Measure eye diagrams and decompose jitter into its components using a bit error rate tester or real-time oscilloscope to assess high-speed serial link quality.

## Inputs

- `s-parameter-data`: Channel S-parameters for loss and reflection context
- `channel-loss-budget`: Insertion loss characterization of the channel

## Outputs

- `eye-diagram-data`: Measured eye diagram with eye height, eye width, and compliance mask overlay
- `jitter-decomposition`: Total jitter (Tj) decomposed into random jitter (Rj, RMS), deterministic jitter (Dj, peak-to-peak), with Dj further split into data-dependent (DDj), duty-cycle distortion (DCD), bounded uncorrelated (BUj), and periodic (Pj)
- `ber-estimate`: Estimated bit error rate at the target BER from jitter components: Tj(BER) = Dj + 2*N*Rj where N is the number of sigma for the target BER (e.g., 14.07 sigma for BER=1e-12)

## Process

1. For BERT-based measurement: configure the pattern generator to transmit PRBS-31 (longest standard PRBS, stresses the channel with the widest range of bit sequences). Set the data rate to match the link specification. Connect through the channel under test to the BERT receiver. Lock the receiver CDR and measure the bathtub curve (BER vs sampling point).
2. For oscilloscope-based measurement: capture at least 1 million unit intervals (UIs) of data with the oscilloscope sampling at or above the Nyquist rate. Apply software CDR recovery. Overlay all captured bits to form the eye diagram. The eye opening at the center gives the eye height (voltage margin) and eye width (timing margin).
3. Decompose jitter: separate random jitter (Rj) from deterministic jitter (Dj) using a dual-Dirac model fit to the jitter histogram tails. Rj is Gaussian with unbounded tails; Dj is bounded. The total jitter at a target BER is: Tj(BER) = Dj_pp + 2 * N(BER) * Rj_rms, where N(1e-12) = 14.07, N(1e-15) = 15.88.
4. Further decompose Dj into its components: DDj (data-dependent jitter from ISI, correlates with bit pattern, caused by channel bandwidth limitation), DCD (duty-cycle distortion, systematic offset between rising and falling edge crossings), BUj (bounded uncorrelated, typically from crosstalk), and Pj (periodic, from power supply coupling or clock modulation).
5. Compare the measured eye to the compliance mask for the interface standard (PCIe, USB, Ethernet, etc.). The mask defines the minimum eye opening at the specified BER. If the eye fails the mask, use the jitter decomposition to identify the dominant contributor and target the fix: DDj suggests channel equalization needed, Rj suggests noise reduction, Pj suggests power supply or clock cleanup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
