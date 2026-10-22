# Transmitter Chain Analysis

Calculate the effective isotropic radiated power (EIRP) from the transmitter power amplifier output through all losses to the antenna.

## Inputs

- `link-requirements`: Structured link requirements including frequency and data rate
- `transmitter-hardware`: Transmitter specifications: PA output power, cable type and length, connector count, filter insertion loss, antenna type and gain

## Outputs

- `eirp-calculation`: EIRP in dBm with itemized breakdown: PA power, cable loss, connector losses, filter loss, antenna gain
- `transmitter-loss-budget`: Total transmitter-side losses in dB with each contributor itemized

## Process

1. Record the power amplifier output power in dBm. Convert from watts if needed: P_dBm = 10*log10(P_watts/0.001).
2. Calculate cable loss: loss_dB = attenuation_per_meter * length. Use manufacturer data at the operating frequency, not DC or low-frequency ratings. For coaxial cable, attenuation increases with sqrt(frequency) due to skin effect.
3. Add connector losses: typically 0.1 to 0.5 dB per mated pair depending on connector type and frequency. N-type at 2 GHz is about 0.15 dB. SMA at 10 GHz is about 0.3 dB.
4. Add any filter insertion loss in the transmit path. Bandpass filters typically add 1 to 3 dB depending on selectivity.
5. Add the transmit antenna gain in dBi. For a parabolic dish, G = 10*log10(eta * (pi*D/lambda)^2) where eta is aperture efficiency (0.55 to 0.70 typical). For a patch antenna, gain is typically 5 to 8 dBi.
6. EIRP = PA_output_dBm - cable_loss - connector_loss - filter_loss + antenna_gain_dBi.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
