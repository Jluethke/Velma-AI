# Radiated Emissions Estimation

Estimate radiated emissions using near-field probes and current probes to predict whether the product will pass radiated emissions limits, without an anechoic chamber.

## Inputs

- `conducted-emissions-scan`: Conducted emissions data showing switching and clock harmonics
- `applicable-standard`: Radiated emissions limits (typically 30MHz to 1GHz or higher)

## Outputs

- `near-field-scan-results`: H-field and E-field probe measurements at key locations on the board, identifying the highest-emission areas
- `cable-radiation-estimate`: Common-mode current on cables measured with a current probe, converted to estimated far-field emission level
- `radiated-risk-assessment`: Predicted radiated emission levels vs limit with estimated margin, flagging frequencies likely to fail

## Process

1. Use an H-field near-field probe (small loop, typically 10-20mm diameter) close to the board surface (less than 5mm gap) and scan across the board while monitoring the spectrum analyzer. Map the locations of highest emissions. H-field probes are good for identifying current loops (switching converter loops, clock distribution).
2. Use an E-field near-field probe (monopole or dipole, typically 5-10mm) to find locations of high voltage radiation. E-field hot spots indicate traces or components with fast voltage transitions driving parasitic capacitance to the ground plane.
3. Measure common-mode current on each cable using a current probe (clamp-on ferrite with a secondary winding, or a Fischer F-33 style probe). Common-mode cable current is the dominant source of radiated emissions for most products. Convert current to estimated field strength: E = 60 * I_cm * f * L / (r * c) where L is cable length, r is measurement distance, and c is speed of light.
4. For the highest-risk frequencies, calculate the estimated far-field emission from the near-field measurements using the maximum field strength and an empirical near-to-far-field correlation factor. This is approximate (typically plus or minus 10dB) but sufficient to identify pass/fail risk.
5. For immunity pre-testing, use a bulk current injection probe on cables and an ESD simulator on enclosure seams and connector shields. While these do not replicate the formal test setup exactly, they identify the weakest points before the compliance lab visit. Focus on the interfaces that face outside the product boundary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
