# Wdm System Architecture

Design the wavelength division multiplexing architecture: channel plan, multiplexer/demultiplexer, optical amplification, and OSNR management.

## Inputs

- `dispersion-analysis`: Dispersion budget per channel to verify channel spacing is compatible
- `compensation-plan`: Per-channel or per-band compensation strategy

## Outputs

- `wdm-channel-plan`: Center wavelengths (ITU grid), channel spacing, number of channels, per-channel data rate, total system capacity
- `amplification-scheme`: EDFA placement, gain per span, noise figure, OSNR at receiver, Raman pump power and wavelength if hybrid amplification

## Process

1. Select the channel spacing from the per-channel data rate and modulation format. 10G NRZ: 100 GHz spacing (0.8nm) on 50 GHz ITU grid with guard band. 100G DP-QPSK: 50 GHz spacing. 400G DP-16QAM: 75 or 100 GHz spacing. Flex-grid: 12.5 GHz granularity for spectral efficiency.
2. Design the EDFA chain. Each span: fiber loss (0.2 dB/km * span_length). EDFA gain = span loss. EDFA noise figure: NF = 5-6 dB for a two-stage design with mid-stage access for DCF or WSS. The ASE noise accumulates: OSNR at receiver = P_ch - NF - 10*log10(N_spans) - 10*log10(h*v*B_ref) where B_ref = 12.5 GHz (0.1nm).
3. Verify the OSNR meets the modulation format requirement. DP-QPSK requires ~12 dB OSNR at 1e-3 BER (before FEC). DP-16QAM requires ~18 dB. DP-64QAM requires ~24 dB. Add 2 dB margin for aging and nonlinear penalty.
4. For long-haul systems (> 1000km), consider Raman amplification to improve OSNR. Backward-pumped Raman: the gain is distributed along the fiber, reducing the effective noise figure. Typical Raman gain: 10-15 dB with pump at 1450nm for signal at 1550nm. This reduces the required EDFA gain and improves OSNR by 3-5 dB.
5. Design the ROADM (reconfigurable optical add-drop multiplexer) nodes for network flexibility. Wavelength selective switch (WSS) with port count matching the node degree. Specify the passband width, adjacent channel isolation (> 25 dB), and the cascadability (number of ROADM passes before filter narrowing degrades the signal).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
