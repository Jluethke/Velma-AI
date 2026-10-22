# Esd Device Selection And Design

Select and size ESD protection devices (diodes, ggNMOS, SCR, DTSCR) for each I/O based on the design window and parasitic capacitance budget.

## Inputs

- `esd-design-window`: Design window for each I/O type
- `io-voltage-domains`: I/O types with speed and capacitance constraints

## Outputs

- `esd-device-designs`: Sized ESD protection devices for each I/O with estimated parasitic capacitance
- `esd-current-paths`: Current path diagram for each ESD stress combination (pin-to-pin, pin-to-VDD, pin-to-VSS)

## Process

1. Dual-diode protection: the simplest scheme. A diode from pad to VDD (forward-biased during positive ESD) and a diode from VSS to pad (forward-biased during negative ESD). Requires a VDD-to-VSS power clamp to provide the return path. Diode capacitance is approximately 1-2 fF per um of perimeter.
2. Grounded-gate NMOS (ggNMOS): used as the primary ESD device on pads with dedicated ground. Triggers via avalanche breakdown of the drain junction (typically 7-10 V in thin oxide processes). Snapback reduces the holding voltage to 3-5V. Width must be large enough that the current per unit width does not exceed the safe operating current (It2), typically 5-10 mA/um.
3. Silicon-controlled rectifier (SCR): highest ESD protection per unit area due to regenerative PNPN action. Very low on-resistance (0.5-1 Ohm). However, trigger voltage is high (>15V for a basic SCR) and holding voltage is very low (1-2V, latch-up risk). Diode-triggered SCR (DTSCR) uses a trigger diode string to lower the trigger voltage to within the design window.
4. For high-speed I/O (multi-GHz): parasitic capacitance of ESD devices degrades signal integrity. Target < 200 fF for multi-Gbps interfaces. Use smaller devices with lower capacitance and rely on distributed ESD (multiple small devices along the I/O path) or T-coil bandwidth extension.
5. Size each device: calculate the required width from It2 * W > I_peak_esd. Add 50% margin. Calculate parasitic capacitance from the device width and per-unit-width capacitance. Verify that the total I/O capacitance (ESD + pad + package) does not exceed the signal integrity budget.
6. Draw the complete current path for each stress combination. For example, positive ESD on pin A relative to VSS: current flows through the pad diode to VDD, through the VDD-VSS power clamp to VSS. Every segment of this path must be sized to carry the ESD current without metal fusing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
