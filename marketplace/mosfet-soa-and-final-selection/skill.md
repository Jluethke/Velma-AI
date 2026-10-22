# Mosfet Soa And Final Selection

Verify the selected MOSFET against its safe operating area under all conditions including avalanche, linear mode, and short circuit, then finalize the component selection with part number and second source.

## Inputs

- `parallel-configuration`: Parallel MOSFET configuration if applicable
- `layout-symmetry-requirements`: Layout constraints for the selected configuration

## Outputs

- `soa-verification`: Safe operating area verification at worst-case: Vds vs Id point plotted against the SOA curves for DC and pulsed operation, confirming the operating point is within bounds
- `final-mosfet-selection`: Selected MOSFET part number with key parameters, second-source alternatives, and package selection rationale (thermal, size, parasitic)

## Process

1. Plot the operating point on the SOA diagram. The SOA shows the maximum Vds vs Id for DC, 10ms, 1ms, 100us, and single-pulse operation. During normal hard switching, the MOSFET traverses the full Vds range while carrying Id (the switching trajectory). This trajectory must stay within the 100us or shorter pulse boundary.
2. Check avalanche rating for unclamped inductive switching (UIS). If the MOSFET can see voltage spikes exceeding its Vds rating (e.g., from parasitic inductance without adequate snubbing), it must survive avalanche. The avalanche energy rating EAS from the datasheet must exceed the energy in the parasitic inductance: EAS > 0.5 * Lpar * Ipk^2 * (Vds_rated / (Vds_rated - Vbus)).
3. For linear-mode operation (hot-swap, inrush limiting): the MOSFET operates in the active region with both high Vds and high Id simultaneously. Check the SOA curves carefully, as silicon MOSFETs can suffer from thermal instability (current crowding) at high Vds in linear mode. Use a SOA-rated MOSFET if linear-mode operation exceeds 1ms.
4. Package selection. TO-220: through-hole, excellent thermal path to heat sink, high parasitic inductance. D2PAK: SMD equivalent of TO-220. QFN/PQFN: lowest parasitics (0.5nH vs 5-10nH for leaded), best for high-frequency (above 500kHz). LFPAK: low inductance, high current density. Select based on the thermal, parasitic inductance, and assembly requirements.
5. Finalize: record the primary part number, its key parameters (Vds, Rds(on) at 25C and 100C, Qg, Qgd, Rth_jc, package), at least one second-source alternative from a different manufacturer, and any application notes from the manufacturer for the selected topology.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
