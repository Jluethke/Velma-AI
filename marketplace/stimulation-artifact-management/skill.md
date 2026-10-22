# Stimulation Artifact Management

Design the artifact blanking and recovery strategy for systems that must simultaneously record neural signals during active stimulation.

## Inputs

- `stimulation-parameters`: Waveform timing and amplitude
- `amplifier-specification`: Recording amplifier bandwidth, recovery time, and dynamic range

## Outputs

- `artifact-management-design`: Blanking timing, recovery strategy (sample-and-hold, fast recovery amplifier, template subtraction), and residual artifact specification
- `recording-during-stimulation-protocol`: Achievable recording quality during active stimulation with specified parameters

## Process

1. Characterize the stimulation artifact. During a stimulation pulse (100 us at 3 mA through a 10 kOhm electrode), the voltage at the electrode reaches 30 V peak, saturating any neural recording amplifier (full-scale typically 1-5 mV). The artifact has three phases: (1) the stimulation pulse itself (100 us), (2) electrode polarization recovery (exponential decay, 0.5-5 ms time constant depending on electrode material and charge), (3) amplifier recovery from saturation (0.1-10 ms depending on AC coupling time constant).
2. Design hardware blanking: disconnect the recording input during the stimulation pulse plus a short margin (total blank window: stimulation pulse width + 100-500 us for electrode discharge). During blanking, hold the amplifier output at its pre-blank value (sample-and-hold) to prevent a transient when reconnecting. For 130 Hz stimulation with 500 us total blank window, 6.5% of data is blanked, acceptable for LFP recording (most information is below 100 Hz) but can miss some spikes.
3. Design post-artifact recovery. Minimize AC coupling time constants: use DC-coupled or very short time constant (10 ms) amplifiers to reduce exponential recovery artifacts. Add a fast-recover circuit that resets the AC coupling capacitor after each blank window. For remaining artifacts, use template subtraction: average the artifact waveform over 50-100 stimulation cycles (triggered on the stimulation sync signal) and subtract the template from each individual artifact.
4. Validate recording quality during stimulation. Record known neural signals (spike-generating cortex during movement) with and without stimulation. Compare SNR, spike detection rate, and LFP power spectra. The residual artifact after blanking and template subtraction should be below the neural noise floor (less than 5 uV RMS in the spike band, less than 10 uV in the LFP band). If not met, increase blank window or add more averaging to template subtraction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
