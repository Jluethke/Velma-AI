# Silicon Photonic Modulator Design

Design the optical modulator for high-speed data encoding: Mach-Zehnder interferometer with carrier depletion phase shifter, traveling-wave electrode, and driver interface.

## Inputs

- `waveguide-design`: Waveguide dimensions and effective index at the operating wavelength
- `pic-requirements`: Modulation bandwidth, data rate, modulation format, extinction ratio, insertion loss budget

## Outputs

- `modulator-design`: MZI arm length, phase shifter doping profile (p-n junction position, doping concentrations), V-pi * L product, 3dB electro-optic bandwidth, insertion loss, extinction ratio
- `electrode-design`: Traveling-wave electrode geometry (CPW: signal width, gap, ground), impedance (target 50 ohm), RF loss, velocity matching (n_RF vs n_group_optical), termination

## Process

1. The carrier-depletion MZM uses a reverse-biased p-n junction embedded in the waveguide. Applying reverse bias widens the depletion region, changing the free-carrier concentration and thus the refractive index via the Soref-Bennett relations: delta_n = -8.8e-22 * delta_N_e - 8.5e-18 * (delta_N_h)^0.8 at 1550nm.
2. Design the p-n junction: lateral junction at the center of the waveguide for maximum overlap with the optical mode. P-type doping: 5e17 to 2e18 /cm^3. N-type: 3e17 to 1e18 /cm^3. Higher doping gives larger delta_n per volt but higher optical loss from free carrier absorption. Typical trade-off: V-pi*L = 1-2 V*cm with 5-10 dB/cm phase shifter loss.
3. For 50 Gbaud operation, design a traveling-wave electrode. The RF and optical signals co-propagate along the phase shifter. Velocity matching: n_RF (from the CPW geometry and oxide cladding) must equal n_group_optical (~4.2). Since n_RF in oxide is ~2, use a slow-wave electrode (capacitively loaded transmission line) to increase n_RF.
4. Impedance matching: the CPW characteristic impedance with the loaded junction capacitance must be 50 ohm for impedance matching to the driver. Z_loaded = sqrt(L_line / (C_line + C_junction)). The junction capacitance per unit length depends on the doping and bias: C_j = epsilon_Si * W / x_d where x_d is the depletion width.
5. Compute the 3dB electro-optic bandwidth from the RF loss, velocity mismatch, and impedance mismatch: the bandwidth is limited by the slowest of these three effects. For a 4mm phase shifter with good velocity matching and 50-ohm termination, typical 3dB bandwidth is 35-50 GHz, supporting 50-100 Gbaud with PAM-4 or higher modulation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
