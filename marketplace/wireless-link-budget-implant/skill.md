# Wireless Link Budget Implant

Calculate the wireless data link budget for transmitting neural data through tissue, selecting the modulation scheme and data rate from the channel count and compression strategy.

## Inputs

- `telemetry-design`: Required data rate after compression, link range through tissue, BER target
- `implant-constraints`: Available power for transmitter, antenna size constraint, SAR limit

## Outputs

- `link-budget-analysis`: Transmit power, path loss through tissue, receiver sensitivity, link margin, and achievable data rate
- `modulation-coding-selection`: Selected modulation (OOK, FSK, BPSK, QPSK), coding (convolutional, LDPC), and protocol

## Process

1. Estimate path loss through tissue. For inductive near-field (13.56 MHz) at 1-2 cm separation through skin and skull: coupling loss is dominated by coil geometry and alignment, typically 20-30 dB. For far-field UWB (3-10 GHz) through 1 cm tissue: path loss = free-space path loss + tissue attenuation. Tissue attenuation at 4 GHz: approximately 3-4 dB/cm for skin, 5-7 dB/cm for bone, 1-2 dB/cm for brain. Total one-way loss through 1 cm skin + 0.5 cm bone: approximately 7-10 dB above free-space.
2. Calculate link budget: Received power (dBm) = Transmit power (dBm) + TX antenna gain (dBi) - Path loss (dB) + RX antenna gain (dBi). For an implant transmitting at -10 dBm (0.1 mW, well within SAR limits) with a small patch antenna (-15 dBi implant, 0 dBi external), and 40 dB total path loss at 4 GHz: received power = -10 + (-15) - 40 + 0 = -65 dBm. Receiver sensitivity for 10 Mbps BPSK at BER 10^-6: approximately -80 dBm with a low-noise front end. Link margin = -65 - (-80) = 15 dB. Adequate for reliable operation with fading margin.
3. Select modulation scheme from power and data rate constraints. For low-power implants (below 1 mW TX): OOK (on-off keying) is simplest but spectral inefficient. FSK: slightly more complex, better noise immunity. BPSK/QPSK: best spectral efficiency but requires coherent receiver. For high data rates (above 10 Mbps), use OFDM over a UWB channel for multipath resilience. Add forward error correction: convolutional code (rate 1/2, constraint length 7) adds 3 dB coding gain. LDPC codes add 5-6 dB but require more decoding power.
4. Verify SAR compliance. Calculate the power deposited in tissue: SAR = sigma x |E|^2 / (2 x rho), where sigma is tissue conductivity, E is the electric field, rho is tissue density. For a small antenna radiating 0.1 mW in tissue with sigma = 0.5 S/m, rho = 1000 kg/m3: the peak SAR must be below 1.6 W/kg averaged over 1 g (FCC) or 2 W/kg over 10 g (ICNIRP). Run an EM simulation (FDTD or FEM) with a realistic head phantom model to verify. At 0.1 mW transmit, SAR is typically well below limits, but antenna near-field can create hotspots.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
