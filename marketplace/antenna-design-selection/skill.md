# Antenna Design Selection

Select or design the antenna to meet the gain, bandwidth, size, and polarization requirements for the wireless system.

## Inputs

- `link-budget-table`: Required antenna gain (Tx and Rx), operating frequency and bandwidth
- `physical-constraints`: Available volume, ground plane size, mounting (PCB trace, external, chip antenna), polarization requirement

## Outputs

- `antenna-selection`: Antenna type (PCB trace, chip, wire, patch, helical), dimensions, gain pattern, return loss (S11 < -10 dB across the band), and efficiency
- `matching-network`: Impedance matching components (LC network) to transform the antenna impedance to 50 ohm at the operating frequency

## Process

1. Antenna size scales with wavelength. At 2.4 GHz, lambda = 12.5 cm, so a quarter-wave monopole is 3.1 cm. At 915 MHz, lambda = 33 cm, so a quarter-wave monopole is 8.2 cm. If the available space is smaller than lambda/4, the antenna will be electrically small and the efficiency drops (radiation resistance decreases while loss resistance stays constant).
2. PCB trace antenna (inverted-F, meandered monopole): zero additional cost, 0 to 2 dBi gain, but requires a ground plane clearance area (no copper pour) of at least lambda/4 x lambda/10 around the antenna. The ground plane IS part of the antenna; its size and shape affect the radiation pattern and impedance. Minimum ground plane size for reasonable efficiency: lambda/4 x lambda/4.
3. Chip antenna (ceramic): compact (3 to 8 mm), 0 to 1 dBi gain, requires a matching network and specific ground plane keep-out per the manufacturer's datasheet. Less efficient than a well-designed PCB trace antenna but easier to implement. The matching network (pi or L network of capacitors and inductors) tunes the antenna impedance to 50 ohm; the component values are frequency-specific and must be verified on the actual PCB.
4. Patch antenna: directional (6 to 9 dBi gain in the broadside direction), useful when the communication partner is in a known direction. Size is lambda/2 x lambda/2 (6 cm x 6 cm at 2.4 GHz). Bandwidth is narrow (1 to 5 percent for a standard patch; wider with stacked or slotted designs). Polarization is set by the feed point location (linear) or with two feeds in quadrature (circular).
5. Impedance matching: measure the antenna impedance with a VNA (vector network analyzer) on the actual PCB (not on a test board, because the ground plane affects impedance). Design an L-network or pi-network to transform the measured impedance to 50 ohm. The matching bandwidth determines the usable frequency range: a narrowband match (high Q) gives better efficiency at the center frequency but less bandwidth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
