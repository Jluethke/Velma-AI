# Receiver Sensitivity Calculation

Calculate the receiver sensitivity from the noise floor, noise figure, required SNR, and implementation losses to determine the minimum detectable signal.

## Inputs

- `link-requirements`: Data rate, modulation, BER target, and noise bandwidth
- `receiver-hardware`: Receiver specifications: noise figure, bandwidth, implementation loss estimate, antenna type and gain, cable type and length

## Outputs

- `receiver-sensitivity`: Minimum detectable signal level in dBm at the required BER, with noise floor and SNR breakdown
- `receiver-gain-budget`: Receive-side gain and loss budget: antenna gain, cable loss, LNA noise figure contribution

## Process

1. Calculate thermal noise floor: N_dBm = -174 + 10*log10(bandwidth_Hz). The -174 dBm/Hz is kTB at 290 K (room temperature).
2. Add the receiver noise figure: this is the cascaded noise figure of the entire receive chain. Use the Friis noise figure equation: F_total = F1 + (F2-1)/G1 + (F3-1)/(G1*G2) + ... The LNA dominates if it has sufficient gain.
3. Calculate the required SNR from the modulation and BER target. Add implementation loss (typically 1 to 3 dB) to account for real-world impairments: phase noise, I/Q imbalance, quantization noise in the ADC, channel estimation error.
4. Receiver sensitivity = noise_floor + noise_figure + required_SNR + implementation_loss.
5. Calculate receive antenna gain and cable losses using the same method as the transmitter chain. The received signal at the demodulator input = signal at antenna - cable loss.
6. For the receiver gain budget: record antenna gain, cable loss, LNA gain, and any filter losses between antenna and demodulator.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
