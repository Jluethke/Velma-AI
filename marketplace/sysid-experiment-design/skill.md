# Sysid Experiment Design

Design the excitation signal and data collection plan to capture the plant dynamics within the frequency range and amplitude range relevant to the control problem.

## Inputs

- `plant-description`: Physical description of the system to be identified, including known dynamics, actuator and sensor locations, and operating range
- `control-objectives`: What the model will be used for: controller design bandwidth, simulation fidelity requirements, or monitoring

## Outputs

- `excitation-signal-spec`: Signal type (PRBS, multisine, chirp, step sequence), amplitude, duration, sampling rate, and frequency content coverage
- `data-collection-plan`: Sensor channels to record, anti-aliasing filter settings, number of experiments, and steady-state settling requirements between runs

## Process

1. Determine the frequency range of interest from the desired closed-loop bandwidth. The excitation must cover at least 0.1x to 10x the target crossover frequency.
2. Select signal type: PRBS for broadband coverage with flat spectrum; multisine for precise frequency content control and leakage-free spectral analysis; chirp for swept-sine equivalent with smooth transition; step sequence for time-domain intuition and nonlinearity detection.
3. Set signal amplitude large enough for acceptable signal-to-noise ratio but small enough to stay in the linear operating region. If the system is nonlinear, plan multiple amplitude levels to check linearity.
4. Choose sampling rate at least 10x the highest frequency of interest (not just 2x Nyquist) to capture transient shape. Specify anti-aliasing filter cutoff at 0.4x the sampling rate.
5. Plan experiment duration: for PRBS, at least 5 to 10 periods of the slowest time constant. For multisine, integer number of periods for leakage-free DFT. Include settling time before recording.
6. Plan at least two independent datasets: one for estimation, one for validation. If the system drifts, interleave estimation and validation runs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
