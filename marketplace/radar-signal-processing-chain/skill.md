# Radar Signal Processing Chain

Design the radar signal processing chain from raw ADC samples through pulse compression, Doppler filtering, CFAR detection, and target tracking.

## Inputs

- `waveform-specification`: Waveform parameters and matched filter design
- `radar-architecture`: Radar architecture and antenna configuration

## Outputs

- `processing-chain-design`: Complete signal processing pipeline with algorithms, computational requirements, and expected detection performance
- `tracking-algorithm`: Target tracking filter design with track initiation and maintenance logic

## Process

1. Pulse compression. Apply the matched filter (correlation of received signal with transmitted waveform replica) in the frequency domain: multiply the FFT of the received signal by the conjugate of the FFT of the reference, then IFFT. Apply the sidelobe reduction window. Output: range-compressed data for each pulse.
2. Doppler processing. Collect N pulses (a CPI) and form a range-Doppler map by FFT across the slow-time (pulse-to-pulse) dimension at each range bin. Apply a Doppler window (Chebyshev, Taylor) to reduce spectral sidelobes. The Doppler resolution is PRF/N and the unambiguous Doppler is +/-PRF/2.
3. CFAR detection. For each cell in the range-Doppler map, estimate the local noise/clutter level from surrounding reference cells. Cell-averaging CFAR (CA-CFAR): average the reference cells on both sides of the cell under test, multiply by a threshold factor T to achieve the desired Pfa. Variations: greatest-of CFAR (GO-CFAR) for clutter edges, smallest-of (SO-CFAR) for closely spaced targets, ordered-statistics CFAR (OS-CFAR) for inhomogeneous clutter.
4. Clustering and centroiding. Group adjacent CFAR detections into a single target report. Compute the centroid in range, Doppler, and angle (if applicable) weighted by detection amplitude. This produces one report per physical target per scan.
5. Target tracking. Associate new detections with existing tracks using a gating and assignment algorithm. Gate: use the predicted measurement from the track state and its covariance to define a validation region. Assignment: nearest-neighbor for sparse scenarios, global nearest-neighbor or joint probabilistic data association (JPDA) for dense scenarios. Update the track state with a Kalman filter (constant-velocity or interacting multiple model for maneuvering targets).
6. Track management. Initiate new tracks from detections not associated with existing tracks (M-of-N logic: require M detections in N scans to confirm). Delete tracks that miss more than K consecutive scans. Maintain a tentative/confirmed/deleted state machine. Output confirmed tracks with position, velocity, track quality, and ID.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
