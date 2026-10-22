# Neural Signal Type Specification

Define the target neural signal type, its amplitude range, bandwidth, and spatial resolution requirement to anchor every downstream design decision.

## Inputs

- `clinical-or-research-objective`: What the recording system must measure (e.g., single-unit spikes for BCI cursor control, ECoG for seizure localization, EEG for sleep staging)
- `implant-constraints`: Whether the system is non-invasive (scalp), minimally invasive (epidural/subdural), or fully implanted (intracortical), plus any size or weight limits

## Outputs

- `signal-specification`: Target signal type (EEG, ECoG, LFP, single-unit, EMG), amplitude range (microvolts to millivolts), bandwidth (0.1-100 Hz for EEG, 300-6000 Hz for spikes, DC-300 Hz for LFP), and spatial resolution requirement
- `channel-count-requirement`: Number of recording channels needed from spatial coverage analysis and information throughput requirement

## Process

1. Map the clinical or research objective to the neural signal type that carries the information. Single-unit spikes give the highest information per channel but require intracortical penetration. ECoG gives good spatial resolution (1-4 mm electrode spacing) without penetrating cortex. EEG is non-invasive but spatially blurred (centimeter-scale).
2. Define the amplitude range: EEG is 10-100 uV, ECoG is 50-500 uV, LFP is 0.1-1 mV, single-unit spikes are 50-500 uV at the electrode but can be as low as 20 uV for distant neurons. This range sets the amplifier input-referred noise floor target (must be at least 5x below signal for adequate SNR).
3. Define the bandwidth: EEG and LFP signals occupy DC to 300 Hz. Spike waveforms require 300-6000 Hz minimum, 300-10000 Hz preferred. Full broadband recording (0.1-10000 Hz) captures both but increases data rate. Sampling rate must be at least 2x the upper bandwidth (Nyquist), practically 3-5x for anti-aliasing filter roll-off.
4. Estimate channel count from coverage requirements. For BCI cursor control with intracortical arrays, 96-256 channels in motor cortex. For epilepsy monitoring with ECoG grids, 64-256 channels over suspected focus. For research EEG, 32-256 channels for source localization. Each channel multiplied by the data rate gives total throughput.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
