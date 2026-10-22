# Side Channel Lab Setup

Configure the evaluation laboratory for side-channel measurement: select oscilloscope bandwidth and sample rate, position current probes or shunt resistors for power measurement, select and position near-field EM probes, configure trigger synchronization with cryptographic operations, and verify baseline noise floor.

## Inputs

- `target-device-description`: Device under test: IC type, package, clock frequency, cryptographic algorithm implemented
- `evaluation-objectives`: What to evaluate: key recovery feasibility, leakage presence, countermeasure effectiveness

## Outputs

- `measurement-setup`: Documented lab configuration: probe placement, oscilloscope settings, trigger configuration, noise floor characterization
- `acquisition-parameters`: Sample rate, number of traces planned, alignment trigger point, bandwidth settings

## Process

1. Select oscilloscope bandwidth at minimum 5x the device clock frequency. Set sample rate to at least 2.5x bandwidth (oversampling for alignment).
2. For power analysis: choose between shunt resistor (1-10 ohm in Vdd path for current measurement) and current probe (wider bandwidth but lower sensitivity). Place shunt as close to device power pin as possible to minimize parasitic coupling.
3. For EM analysis: select near-field probe size based on spatial resolution needed (smaller probe = better resolution but weaker signal). H-field probes for current loops, E-field probes for voltage nodes. Map the die surface to locate cryptographic core.
4. Configure trigger from a GPIO toggle or communication bus event that marks the start of the cryptographic operation. Verify trigger jitter is below 1 sample period.
5. Acquire 100 test traces and compute noise floor: SNR = 20*log10(signal_rms / noise_rms). Verify SNR is sufficient for the planned attack (DPA typically needs SNR > 0.01 per trace, compensated by sqrt(N) averaging).
6. Document the setup with photographs and configuration files for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
