# Channel Loss Characterization

Measure or simulate the channel's S-parameters (insertion loss, return loss, crosstalk) and convert to time-domain impulse response for ISI analysis.

## Inputs

- `channel-topology`: Physical description: TX package, PCB traces, connectors, cables, backplane, RX package with lengths and via counts
- `data-rate`: Line rate in Gbps (e.g., 10.3125 Gbps for 10GbE, 25.78125 Gbps for 100GbE per lane)
- `nyquist-frequency`: Half the data rate in GHz, the fundamental frequency of the NRZ signal

## Outputs

- `insertion-loss-profile`: S21 magnitude vs frequency showing total channel loss, with loss at Nyquist frequency highlighted
- `return-loss-profile`: S11 magnitude vs frequency showing impedance discontinuities
- `crosstalk-profiles`: Near-end (S31) and far-end (S41) crosstalk from adjacent channels
- `impulse-response`: Time-domain impulse response via IFFT of S21, showing pre-cursor and post-cursor ISI taps

## Process

1. Simulate the channel S-parameters from DC to at least 2.5x the Nyquist frequency (e.g., to 32 GHz for a 25 Gbps NRZ link). Include every discontinuity: package ball/pin, package trace, board via, PCB trace (with loss tangent), connector, cable, and receiving package.
2. Extract insertion loss at Nyquist: this is the single most important number. Protocol specs define maximum allowable insertion loss at Nyquist (e.g., IEEE 802.3 defines channel operating margin budgets). Typical thresholds: 10 dB is easy for most SerDes, 20 dB needs equalization, 30+ dB needs strong TX and RX equalization.
3. Check return loss: impedance mismatches create reflections that arrive at the receiver as ISI. Return loss should be better than -10 dB (ideally -15 dB) across the band. A resonance dip at a specific frequency indicates a stub or impedance discontinuity at a specific location; calculate the location from f_resonance = c/(4*L*sqrt(Dk)).
4. Convert S21 to time-domain impulse response via IFFT. The main cursor is the desired signal; pre-cursors and post-cursors are ISI. Count significant post-cursors (amplitude > 1% of main cursor). This count determines how many DFE taps the receiver needs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
