# Radar Waveform Design

Design the radar waveform to achieve the required range resolution, velocity resolution, and ambiguity performance.

## Inputs

- `radar-architecture`: Selected radar type and key parameters
- `performance-budget`: Required SNR, range, and resolution

## Outputs

- `waveform-specification`: Pulse width, bandwidth, PRF, modulation type, and ambiguity function characterization
- `signal-processing-requirements`: Matched filter design, Doppler processing, and computational load

## Process

1. Determine range resolution: delta_R = c / (2*B) where B is the signal bandwidth. For 1 m resolution, B = 150 MHz. For 15 m resolution, B = 10 MHz. Unmodulated pulse: B ~ 1/tau, so 1 us pulse gives 150 m resolution. To get fine resolution with long pulses (for energy on target), use pulse compression.
2. Design the pulse compression waveform. Linear FM (chirp): sweep bandwidth B over pulse duration T. Time-bandwidth product T*B gives the pulse compression ratio (processing gain in SNR). A 10 us pulse with 100 MHz bandwidth gives TB = 1000, range resolution = 1.5 m, and 30 dB processing gain. Range sidelobes from matched filter are -13.2 dB for rectangular weighting; apply a window (Hamming, Taylor) to reduce sidelobes to -35 to -50 dB at the cost of ~1 dB SNR loss and ~20% resolution widening.
3. Select the PRF. Low PRF (unambiguous in range, ambiguous in Doppler): range = c / (2*PRF). Medium PRF: ambiguous in both range and Doppler, resolved by PRF agility (Chinese Remainder Theorem or M-of-N coincidence). High PRF (unambiguous in Doppler, ambiguous in range): used for look-down/shoot-down where target Doppler is the primary discriminant against ground clutter.
4. Analyze velocity resolution: delta_V = lambda / (2*T_coh) where T_coh is the coherent processing interval (CPI). For X-band (lambda = 3 cm) with 10 ms CPI, delta_V = 1.5 m/s. Longer CPI improves velocity resolution but requires target acceleration to be less than delta_V/T_coh during the CPI.
5. Compute the ambiguity function: chi(tau, fd) = |integral(u(t) * u*(t-tau) * exp(j*2*pi*fd*t) dt)|^2. The ambiguity function completely characterizes the waveform's resolution and ambiguity properties in range-Doppler space. For LFM: a sheared ridge showing range-Doppler coupling. For phase-coded waveforms (Barker, polyphase): a thumbtack with low sidelobes.
6. Document the waveform specification, the matched filter or correlation processing required, the expected range and Doppler sidelobes, and the computational requirements for real-time processing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
