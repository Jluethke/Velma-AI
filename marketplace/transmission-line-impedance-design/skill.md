# Transmission Line Impedance Design

Calculate the characteristic impedance of PCB traces from the board stackup geometry and select the target impedance for each signal class.

## Inputs

- `signal-list`: All high-speed signal classes with data rate, edge rate, and impedance standard (DDR4: 40 ohm, PCIe: 85 ohm differential, USB: 90 ohm differential, Ethernet: 100 ohm differential)
- `stackup`: PCB layer count, dielectric material (FR-4, Megtron 6, Rogers), copper weight, dielectric thickness between layers

## Outputs

- `impedance-geometry`: Trace width and spacing for each signal class to achieve the target impedance on the assigned layer pair, calculated from the stackup
- `stackup-validation`: The final stackup with impedance values verified, layer assignments for each signal class, and reference plane assignments

## Process

1. Determine which signals need controlled impedance. Any signal where the trace length exceeds lambda/10 (where lambda = rise_time * propagation_speed / 3) must be treated as a transmission line. For a 1 ns rise time on FR-4 (propagation at about 6 inches/ns), the critical length is about 0.6 inches. Modern DDR4 and PCIe signals with sub-100ps rise times require controlled impedance for traces longer than 0.2 inches.
2. For a microstrip (trace on outer layer over a ground plane): Z0 = (87/sqrt(Er+1.41)) * ln(5.98*H/(0.8*W+T)) where H is dielectric height to reference plane, W is trace width, T is copper thickness, and Er is dielectric constant. For typical FR-4 (Er=4.3) with H=4mil and T=1.2mil, a 50-ohm single-ended trace is about 5.5 mil wide.
3. For a stripline (trace on inner layer between two ground planes): Z0 = (60/sqrt(Er)) * ln(4*B/(0.67*pi*(0.8*W+T))) where B is the total distance between the two reference planes. Stripline has lower emissions than microstrip (shielded by both planes) but slightly higher loss and is harder to probe.
4. For differential pairs, the differential impedance Zdiff = 2*Z0*(1-k) where k is the coupling coefficient between the two traces. Coupling depends on the trace spacing S relative to the dielectric height H. Tightly coupled pairs (S < 2*H) have k = 0.1 to 0.3, loosely coupled pairs (S > 3*H) have k < 0.05. For 100-ohm differential impedance, each trace has Z0 slightly above 50 ohm.
5. Validate with a 2D field solver (not just formulas) for production. The IPC-2141 formulas are approximations that diverge from measured impedance by 5 to 10 percent for edge cases (very wide traces, very thin dielectrics, high Er). Run the field solver on the final stackup and adjust trace widths to hit the target within +/- 10 percent (the typical PCB fabrication tolerance).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
