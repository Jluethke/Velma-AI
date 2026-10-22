# Sonar Signal Processing

Design the sonar signal processing chain for detection, classification, and localization of underwater targets or features.

## Inputs

- `array-design`: Array geometry and beamforming output
- `sonar-performance-budget`: Expected signal and noise levels

## Outputs

- `sonar-processing-chain`: Complete processing pipeline from beamformed data through detection and display
- `detection-classification-performance`: Expected detection and classification performance in the operational environment

## Process

1. Active sonar processing. Transmit the designed waveform (CW ping, HFM chirp, or coded sequence). After transmission, apply the matched filter to the beamformed receive data for each beam. The output is a range-bearing map for each ping. For HFM (hyperbolic FM), the matched filter automatically compensates for Doppler, unlike LFM where range-Doppler coupling must be resolved.
2. Passive sonar processing. Narrowband: compute the power spectral density of each beam's output using FFT. Display as frequency vs bearing (LOFAR display). Detection of narrowband tonals (machinery lines) at specific frequencies indicates a man-made source. Broadband: compute the total power in a frequency band for each beam. Display as bearing vs time (BTR). DEMON (Detection of Envelope Modulation on Noise) processing extracts propeller blade rate from the amplitude modulation of cavitation noise.
3. Normalization and detection. Apply time-varying gain (TVG) to compensate for transmission loss with range: TVG(R) = 20*log10(R) + 2*alpha*R for active sonar. Normalize the background using a CFAR-like algorithm adapted for the sonar reverberation environment. Reverberation (backscatter from the ocean surface, bottom, and volume) often exceeds noise and limits detection performance.
4. Classification. After detection, analyze the target echo characteristics: highlight/shadow pattern in imaging sonar, target strength vs aspect, echo duration, spectral content. For mine hunting: shape-based classification from high-resolution imaging sonar (100+ kHz). For ASW: Doppler shift, bearing rate, tonal frequencies, and broadband characteristics.
5. Display design. Active: plan position indicator (PPI) showing range-bearing, A-scope showing amplitude vs range for a selected beam. Passive: bearing-time record (BTR) for broadband, LOFAR (frequency-bearing) for narrowband, DEMON for blade rate analysis. The display must allow the operator to distinguish targets from reverberation, biological noise, and other contacts.
6. Document the processing chain with computational requirements (MFLOPS for each stage), expected detection ranges in representative environments (deep water, shallow water, Arctic), and classification confidence levels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
