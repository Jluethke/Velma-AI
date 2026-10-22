# Coherent Receiver Design

Design the coherent optical receiver: local oscillator, 90-degree hybrid, balanced detectors, ADC, and DSP algorithms for carrier recovery and equalization.

## Inputs

- `wdm-channel-plan`: Per-channel modulation format, symbol rate, target OSNR
- `amplification-scheme`: Expected OSNR at receiver input

## Outputs

- `receiver-specification`: Local oscillator linewidth, 90-degree hybrid CMRR, photodetector bandwidth and responsivity, ADC sample rate and ENOB, DSP clock rate and algorithm chain
- `system-performance`: Achieved BER vs OSNR, implementation penalty, maximum reach with the selected FEC

## Process

1. Specify the local oscillator (LO) laser: linewidth requirement depends on the modulation format. DP-QPSK: < 1 MHz (tolerant). DP-16QAM: < 100 kHz. DP-64QAM: < 10 kHz. Tunable external cavity laser or integrated tunable laser assembly (ITLA) for flex-grid operation.
2. The 90-degree optical hybrid mixes the signal with the LO in four phase states (0, 90, 180, 270 degrees) for both polarizations. Output: 8 optical signals to 4 balanced photodetector pairs (I and Q for X and Y polarizations). Specify CMRR > 20 dB and phase error < 5 degrees.
3. Balanced photodetectors: bandwidth >= 0.75 * symbol_rate (for Nyquist-shaped signals). Responsivity > 0.6 A/W at 1550nm (InGaAs PIN). The balanced detection cancels the LO RIN and common-mode ASE-ASE beat noise.
4. ADC: sample rate >= 2 * symbol_rate (Nyquist). ENOB >= 5 for DP-QPSK, >= 6 for DP-16QAM, >= 7 for DP-64QAM. Interleaved ADC architectures achieve 64-128 GSa/s at 6 ENOB in current CMOS.
5. DSP processing chain: (1) IQ imbalance correction (Gram-Schmidt orthogonalization), (2) chromatic dispersion compensation (frequency-domain FIR filter), (3) clock recovery (Gardner timing error detector), (4) adaptive equalization and polarization demux (CMA for pre-convergence, then decision-directed LMS for 16QAM+), (5) carrier frequency estimation (FFT-based), (6) carrier phase estimation (Viterbi-Viterbi for QPSK, blind phase search for 16QAM), (7) FEC decoding (soft-decision LDPC, overhead 15-25%).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
