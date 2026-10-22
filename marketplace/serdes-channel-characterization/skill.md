# Serdes Channel Characterization

Characterize the physical channel (PCB traces, connectors, cables) using S-parameter measurements or simulation to determine loss, crosstalk, and impedance discontinuities.

## Inputs

- `board-layout-data`: PCB stackup, trace lengths, via counts, connector specifications, and any cable segments in the serial link path
- `data-rate-target`: Target line rate in Gbps, encoding type, and protocol standard (PCIe gen, Ethernet speed, custom)

## Outputs

- `channel-loss-profile`: Insertion loss (dB) vs frequency from DC to Nyquist, return loss, near-end and far-end crosstalk, and impedance profile along the channel
- `channel-compliance-assessment`: Whether the channel meets the protocol's reference channel specification, and margin or deficit at Nyquist frequency

## Process

1. Measure or simulate the channel S-parameters (S21 for insertion loss, S11 for return loss, S31/S41 for crosstalk). The frequency range must extend to at least the Nyquist frequency of the data rate (half the line rate) and preferably to the third harmonic.
2. Plot insertion loss (S21 magnitude in dB) vs frequency. The loss at Nyquist determines how much the received eye is closed. Most serial protocols specify a maximum insertion loss at Nyquist: PCIe Gen3 allows approximately 23dB, Ethernet 25G allows approximately 20dB.
3. Check return loss (S11): it should be below -10dB across the signal bandwidth. High return loss indicates impedance discontinuities (via transitions, connector interfaces, stub lengths) that create reflections and close the eye.
4. Measure or extract via stub lengths. A via stub creates a resonant notch at f = c / (4 * stub_length * sqrt(er)). If this notch falls within the signal bandwidth, it can catastrophically degrade the link. Back-drilling the stub is the physical fix.
5. Assess crosstalk from adjacent lanes. Far-end crosstalk (FEXT) from aggressor lanes reduces the available eye opening. If FEXT exceeds the protocol budget, increase lane-to-lane spacing or add guard traces.
6. Compare measured channel characteristics against the protocol's reference channel model. If the channel exceeds the reference loss, the SERDES equalization must compensate for the additional loss, which reduces margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
