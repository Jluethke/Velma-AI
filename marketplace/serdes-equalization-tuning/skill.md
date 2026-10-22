# Serdes Equalization Tuning

Configure transmitter pre-emphasis and receiver equalization to open the data eye for the characterized channel, using eye diagram analysis and BER measurement.

## Inputs

- `channel-loss-profile`: Channel insertion loss, return loss, and crosstalk characterization
- `channel-compliance-assessment`: Channel loss relative to protocol reference

## Outputs

- `equalization-settings`: TX pre-emphasis taps (pre-cursor, main cursor, post-cursor), RX CTLE settings (peaking frequency, gain), and DFE tap values with the resulting eye opening measurements
- `eye-diagram-results`: Eye diagram captures at the receiver with measured eye height, eye width, jitter components (Rj, Dj, Tj), and BER at the target confidence level

## Process

1. Start with TX pre-emphasis. The transmitter boosts high-frequency content to compensate for channel loss. Configure the TX emphasis taps: post-cursor emphasis compensates for ISI from the previous bit, pre-cursor emphasis compensates for ISI from the next bit. Start with the vendor's recommended settings for the channel loss range.
2. Tune TX emphasis iteratively: increase post-cursor emphasis until the far-end eye opens. Excessive emphasis reduces eye height (because it attenuates the main cursor). Find the sweet spot where eye width and height are balanced. Use the FPGA's built-in IBERT or equivalent eye scan tool to visualize the eye.
3. Configure RX continuous-time linear equalizer (CTLE). CTLE is a high-pass filter that boosts high-frequency signal components to compensate for the channel's low-pass characteristic. Set the peaking frequency near Nyquist and adjust the gain. Too much CTLE gain amplifies crosstalk and noise.
4. If the channel loss exceeds what CTLE can compensate, enable the decision-feedback equalizer (DFE). DFE uses feedback from previously decided bits to cancel ISI from those bits. DFE taps are typically auto-adapted by the SERDES hardware. Verify convergence by monitoring the tap values over time; they should stabilize.
5. Measure the resulting eye diagram. Key metrics: eye height (vertical opening at the sampling point, in mV), eye width (horizontal opening at the decision threshold, in UI), total jitter at the target BER (e.g., Tj at 1e-12 BER), and jitter decomposition into random jitter (Rj, Gaussian) and deterministic jitter (Dj, bounded).
6. Verify BER. Run a PRBS pattern (PRBS-7, PRBS-23, or PRBS-31 depending on the protocol) for a sufficient duration to establish the target BER. For 1e-12 BER, transmit at least 1e13 bits (approximately 1000 seconds at 10Gbps). Any errors indicate insufficient equalization or a channel defect.
7. Document the final equalization settings. These settings are specific to this board and channel; different board revisions or cable lengths require re-tuning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
