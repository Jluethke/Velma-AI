# Optical Power Budget Design

Calculate the optical power budget to verify adequate margin from transmitter to receiver across all loss contributors.

## Inputs

- `fiber-type-selection`: Fiber type and attenuation coefficient
- `link-distance`: Total fiber length including routing margin
- `wavelength-plan`: Operating wavelength and channel plan

## Outputs

- `power-budget-table`: Itemized loss budget from transmitter to receiver with margin
- `osnr-budget`: OSNR at receiver for amplified systems with margin allocation
- `amplifier-plan`: EDFA placement and gain for long-haul systems

## Process

1. Start with transmitter launch power. Typical values: SFP+ at 1310nm launches -8 to +0.5 dBm. DWDM tunable laser at +1 to +4 dBm. Calculate receiver sensitivity from the target BER (typically 1e-12 pre-FEC or 1e-3 with FEC), modulation format, and receiver noise. An APD at 10Gbps gives about -28 dBm at BER 1e-12. A coherent receiver at 100Gbps DP-QPSK needs OSNR of about 12dB (0.1nm reference bandwidth).
2. List all loss contributors. Fiber attenuation: length_km * attenuation_coefficient. Connector losses: 0.3-0.5 dB per mated pair. Fusion splice losses: 0.02-0.1 dB each. WDM multiplexer/demultiplexer insertion loss: 3-7 dB depending on channel count. Add a cable plant margin of 2-3 dB for future splices and aging.
3. For amplified systems, calculate OSNR. Each EDFA adds ASE noise. OSNR_total = P_ch - NF - 10*log10(N_spans) - 10*log10(h*nu*Bref) where NF is noise figure (typically 5-6dB), N_spans is the number of amplifiers. Allocate margin for nonlinear penalties (self-phase modulation, cross-phase modulation).
4. Verify the power budget: Available_power = P_tx - P_rx_sensitivity. Required_power = sum(all_losses). System_margin = Available_power - Required_power. Margin must be positive with at least 3dB for unamplified and adequate OSNR margin (typically 2-3dB) for amplified.
5. For DWDM, check per-channel power at the receiver. EDFA gain tilt across the C-band can cause 2-3dB variation. Gain-flattening filters (GFF) reduce this. Channel pre-emphasis at the transmit end compensates for residual tilt. Verify that the weakest channel meets the OSNR target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
