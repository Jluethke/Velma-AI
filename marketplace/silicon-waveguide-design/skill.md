# Silicon Waveguide Design

Design the silicon waveguide cross-section and routing for single-mode operation, low loss, and efficient coupling to fiber or other external interfaces.

## Inputs

- `pic-requirements`: Operating wavelength (1310nm or 1550nm), number of channels, modulation bandwidth, detector bandwidth, integration density
- `foundry-process`: SOI wafer (220nm Si on 2um BOX typical), available etch depths (full etch, partial etch for rib), minimum feature size, metal layers

## Outputs

- `waveguide-design`: Cross-section dimensions (width, height, slab thickness for rib), effective index, group index, propagation loss (dB/cm), bend radius for < 0.01 dB loss per 90-degree bend
- `fiber-coupling-design`: Grating coupler: period, duty cycle, etch depth, coupling efficiency, 1dB bandwidth, angle. Or edge coupler: taper tip width, mode size at facet, coupling loss to SMF-28

## Process

1. For the standard 220nm SOI platform at 1550nm: strip waveguide (full etch) width 450-500nm for single-mode TE. The cutoff for the first higher-order mode occurs at ~600nm width. Propagation loss: 2-3 dB/cm for strip, 0.5-1 dB/cm for rib (partial etch, 90nm slab).
2. Compute the effective index using the effective index method or a 2D mode solver: n_eff ~ 2.4 for 500nm x 220nm strip at 1550nm (TE fundamental). Group index: n_g = n_eff - lambda * (dn_eff/d_lambda) ~ 4.2. The high group index increases the sensitivity to fabrication variations.
3. Minimum bend radius: for strip waveguide, R_min ~ 5um for < 0.01 dB per bend (the high index contrast provides strong confinement). For rib waveguide, R_min ~ 20-50um. Use Euler bends (clothoid spirals) instead of circular bends for lower mode mismatch loss at the straight-to-bend transition.
4. Grating coupler design: period Lambda = lambda / (n_eff_grating - n_clad * sin(theta)) where theta is the fiber angle (typically 8-12 degrees off-vertical to avoid back-reflection). Duty cycle ~ 50%. Coupling efficiency: -3 to -5 dB for standard single-etch, -1 to -2 dB for dual-etch or apodized designs. 1dB bandwidth: 30-40nm.
5. Edge coupler design: taper the waveguide from 500nm width down to a ~150nm tip over 200-500um length. The mode expands as the waveguide narrows, matching the 10um mode field diameter of SMF-28. Use an SiN overlay waveguide to capture the expanded mode. Coupling loss: 1-2 dB with good alignment. Edge couplers are polarization-insensitive and broadband, but require facet preparation (dicing, polishing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
