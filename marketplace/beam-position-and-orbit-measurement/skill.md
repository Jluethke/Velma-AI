# Beam Position And Orbit Measurement

Design beam position monitor (BPM) systems for orbit measurement and feedback in circular and linear accelerators.

## Inputs

- `beam-parameters`: Beam energy, current, bunch structure, and aperture
- `machine-lattice`: Accelerator optics and BPM locations

## Outputs

- `bpm-design`: BPM type, geometry, and signal processing electronics
- `resolution-and-accuracy`: Position resolution, absolute accuracy, and bandwidth
- `orbit-feedback-design`: Feedback loop bandwidth, corrector integration

## Process

1. Select BPM type: button pickup (broadband, simple, for bunched beams), stripline (directional, good for single-pass and circular), cavity BPM (highest resolution <1um, resonant at beam frequency, for linacs and FELs). Electrostatic for unbunched beams (DC current).
2. Calculate signal level: button BPM voltage ~ Z_0 * I_beam * A_button / (4 * pi * b^2) * bunch form factor where b is the beam pipe radius. Stripline: V ~ Z_c * I_beam * L / (4 * pi * b) for short bunches relative to stripline length.
3. Design signal processing: narrowband (heterodyne, for circular accelerators: high resolution at harmonic of revolution frequency) or broadband (direct digitization of bunch signal, for linacs and turn-by-turn in rings). Digital BPM electronics: 16-bit ADC, FPGA processing, difference-over-sum for position.
4. Calibrate: wire measurement (translate a wire across the BPM aperture, measure electrical center and sensitivity). Beam-based alignment (vary quadrupole strength, measure orbit change to find BPM-to-quad offset). Absolute accuracy ~100um, resolution ~1um for cavity BPM.
5. Design orbit feedback: measure orbit with BPMs (N_BPM > N_corrector for overdetermined system), compute corrector settings via response matrix inversion (SVD), apply correction. Bandwidth limited by corrector magnet response (typically 1-100 Hz). Slow orbit feedback for drift, fast for vibration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
