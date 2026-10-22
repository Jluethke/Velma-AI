# Overvoltage Reverse Polarity Protection

Design protection against sustained overvoltage on the power input and reverse polarity connection, without excessive voltage drop or power loss during normal operation.

## Inputs

- `input-voltage-range`: Normal operating voltage range (e.g., 9 to 36V for automotive), maximum expected overvoltage (e.g., load dump 60V for 40ms in automotive), reverse voltage
- `current-range`: Normal operating current, maximum load current

## Outputs

- `overvoltage-circuit`: Protection topology (crowbar, clamp, foldback), component values, and the voltage seen by the downstream circuit during an overvoltage event
- `reverse-polarity-circuit`: Protection topology (series diode, P-FET, ideal diode controller), voltage drop and power dissipation during normal operation

## Process

1. Reverse polarity with a series diode: simple but wastes Vf * Iload (0.3 to 0.7V * current) continuously. A Schottky diode reduces Vf to 0.3V but leaks more reverse current at high temperature. For currents above 1A, the loss becomes significant.
2. Reverse polarity with a P-channel MOSFET: the MOSFET body diode conducts during normal polarity (Vgs = -Vin, turning on the FET), and blocks during reverse polarity (Vgs = 0, FET off). Forward voltage drop is I*Rds_on, typically 10 to 50 mV at rated current. This is 10 to 50x lower loss than a diode. The FET must be rated for the full reverse voltage on Vds.
3. Overvoltage clamp: a TVS diode across the input clamps transient overvoltage. For automotive load dump (ISO 7637-2 pulse 5: 60V for 400ms), the TVS must absorb significant energy: E = integral(V*I*dt). A 36V working voltage TVS clamping at 50V with 1A load for 400ms absorbs about 20 J, which exceeds most discrete TVS ratings. Use a series resistor to limit current, or use a dedicated transient voltage suppressor module.
4. For sustained overvoltage protection, an active clamp or a DC-DC converter with wide input range is more appropriate than a TVS. An active clamp uses a series FET that enters linear mode to regulate the output voltage when the input exceeds a threshold, dissipating the excess voltage as heat. The FET must survive the SOA (safe operating area) at the overvoltage condition.
5. Crowbar protection: a thyristor (SCR) fires when the voltage exceeds a threshold (set by a zener trigger), short-circuiting the input and blowing the upstream fuse. This is destructive (fuse must be replaced) but protects against high-energy overvoltage. Used in military and aerospace where the protected circuit is more valuable than the fuse.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
