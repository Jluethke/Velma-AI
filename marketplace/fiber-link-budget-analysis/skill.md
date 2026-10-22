# Fiber Link Budget Analysis

Compute the optical power budget for a fiber link: transmitter power, all losses, receiver sensitivity, and power margin.

## Inputs

- `link-requirements`: Data rate, distance, BER target, protocol (Ethernet, SONET/OTN, CWDM/DWDM), wavelength band
- `infrastructure-constraints`: Fiber type already installed (if brownfield), number of connectors and splices, environmental conditions

## Outputs

- `link-budget-table`: Transmitter power (dBm), connector losses (dB each), splice losses (dB each), fiber attenuation (dB/km * distance), receiver sensitivity (dBm at target BER), system margin (dB)
- `fiber-selection`: Fiber type (SMF-28, G.652.D, G.655, G.654.E for submarine, OM3/OM4/OM5 for multimode), attenuation at operating wavelength, chromatic dispersion coefficient

## Process

1. Select the wavelength band from the distance and data rate. Short reach (< 300m): 850nm multimode (VCSEL source, OM3/OM4 fiber). Metro (2-80km): 1310nm (zero dispersion in G.652) or 1550nm (lowest attenuation at 0.2 dB/km). Long-haul (> 80km): 1550nm with EDFA amplification.
2. Compute fiber attenuation loss: L_fiber = alpha * distance. For G.652.D: alpha = 0.35 dB/km at 1310nm, 0.20 dB/km at 1550nm. For multimode OM4: 3.0 dB/km at 850nm (bandwidth-distance product 4700 MHz*km for effective modal bandwidth).
3. Allocate connector and splice losses: standard single-mode connector = 0.3 dB (measured pair), fusion splice = 0.05 dB, mechanical splice = 0.2 dB. Count all connections including patch panels, ODF (optical distribution frame), and equipment connectors.
4. Look up receiver sensitivity for the transceiver at the target BER (typically 1e-12 pre-FEC or 1e-5 with FEC). Example: 10GBASE-LR SFP+: Tx = -1 to +2 dBm, Rx sensitivity = -14.4 dBm at 1e-12. 100GBASE-LR4: Tx = -1 to +2 dBm per lane, Rx = -10.6 dBm per lane.
5. Compute the system margin: Margin = P_tx - L_fiber - L_connectors - L_splices - P_rx_sensitivity. Require >= 3 dB margin for aging, temperature variation, and repair splices. If margin is negative, options include: higher Tx power, better Rx (APD vs PIN), optical amplifier (EDFA), or lower-loss fiber.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
