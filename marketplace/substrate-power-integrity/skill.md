# Substrate Power Integrity

Design the power delivery network in the substrate including plane design, decoupling, and via transitions.

## Inputs

- `substrate-stackup`: Layer stackup with power and ground plane assignments
- `power-requirements`: Current per supply voltage, transient current amplitude and slew rate

## Outputs

- `pdn-design`: Power plane shapes, via arrays, and decoupling capacitor placement
- `pdn-impedance`: Simulated PDN impedance profile from DC to maximum frequency

## Process

1. Calculate target impedance: Z_target = V_ripple / I_transient. For a 1V supply with 5% ripple budget and 10A transient, Z_target = 50mV / 10A = 5 mohm. This is extremely low and must be met from DC to GHz.
2. Design plane pair: closely spaced power-ground plane pair provides high-frequency decoupling through plane capacitance. C_plane = Er * E0 * Area / thickness. For 20um dielectric, 10mm x 10mm die shadow: ~15 nF.
3. Place decoupling capacitors: 100nF MLCC (0201) in die shadow area for mid-frequency, 10uF (0402) at substrate edge for low-frequency. Account for capacitor series resonance (ESL determines the frequency where capacitor impedance rises).
4. Design power via arrays: low-inductance via transitions from die bump to power plane. Use via arrays (not single vias) with adjacent ground vias to minimize loop inductance. L_via approximately 0.2-0.5 nH per via.
5. Simulate full PDN: die model (on-die decoupling + current source) + package model (bumps, vias, planes, caps) + board model. Verify impedance below target across the full frequency range. Fix any anti-resonance peaks by adjusting capacitor values or adding damping.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
