# Ripple And Noise Characterization

Measure output voltage ripple and noise using proper technique to separate switching-frequency ripple from high-frequency noise and random noise, producing a specification-grade measurement.

## Inputs

- `current-sensor-selection`: Current measurement setup for correlated ripple analysis
- `current-measurement-setup`: Complete current measurement configuration

## Outputs

- `ripple-measurement`: Switching-frequency ripple: peak-to-peak and RMS at fundamental and harmonics, measured with 20MHz bandwidth limit per industry standard. Separation of capacitive (ESR) and inductive (ESL) contributions
- `noise-measurement`: High-frequency noise components: common-mode spikes, ringing at switching transitions, broadband noise floor. Measured with full probe bandwidth to characterize the complete output spectrum

## Process

1. Set up the measurement. AC couple the oscilloscope (or use DC couple and math subtract the DC offset). Use a 1x probe or active probe for maximum sensitivity. Apply the tip-and-barrel grounding technique. Place the probe tip and ground directly across the output capacitor terminals or the load terminals (these may differ due to PCB trace impedance).
2. Measure switching-frequency ripple. Set the scope bandwidth limit to 20MHz. This is the industry standard (per JESD22-A, Mil-Std-461) and removes high-frequency spikes that are not true output ripple. Measure peak-to-peak voltage. The ripple waveform shape reveals its source: triangular ripple = ESR * delta_IL (capacitor ESR driven), sawtooth with spikes = ESL * di/dt at the switching transitions (capacitor ESL driven).
3. Measure high-frequency noise. Remove the 20MHz bandwidth limit. The full-bandwidth measurement shows switching transition spikes (typically 10-100ns duration, 10-200mV amplitude) and ringing. These are caused by parasitic inductance in the output capacitor and PCB traces ringing with parasitic capacitance. Quantify the spike amplitude and ringing frequency.
4. Frequency-domain analysis. Use the scope FFT function or transfer the waveform to a PC for spectrum analysis. The ripple spectrum shows peaks at fsw and its harmonics (2*fsw, 3*fsw, etc.). The noise floor between harmonics indicates random noise. The spectrum is useful for identifying specific noise sources and verifying filter effectiveness.
5. Load transient test. Step the load from 10% to 90% of rated current and measure the output voltage excursion. The initial spike (within the first switching cycle) is determined by output capacitance ESR and ESL. The droop/overshoot after the spike is determined by the control loop bandwidth. Measure both the spike amplitude and the settling time to within the regulation band.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
