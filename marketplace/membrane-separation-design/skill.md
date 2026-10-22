# Membrane Separation Design

Design a membrane separation system from membrane selection through module configuration and fouling management.

## Inputs

- `feasible-methods`: Membrane identified as a feasible method
- `mixture-composition`: Feed composition and conditions
- `separation-targets`: Permeate and retentate purity targets

## Outputs

- `membrane-specification`: Membrane material, module type, and operating conditions
- `system-design`: Number of stages, recycle configuration, and total membrane area
- `fouling-management-plan`: Cleaning protocol and membrane replacement schedule

## Process

1. Select membrane type: microfiltration (0.1 to 10 um pore, particle removal), ultrafiltration (1 to 100 nm, macromolecules), nanofiltration (less than 2 nm, divalent ion rejection), reverse osmosis (nonporous, salt rejection above 99%), gas separation (solution-diffusion), pervaporation (for azeotrope breaking).
2. Select module configuration: spiral wound (most common, good area per volume, moderate fouling tolerance), hollow fiber (highest area per volume, good for gas separation), tubular (best fouling tolerance, highest cost), plate-and-frame (for viscous or particulate-laden feeds).
3. Calculate required membrane area: A = Q_permeate / (J * recovery). Where J is the flux (L/m2/hr) at operating conditions. Flux depends on transmembrane pressure, temperature, and concentration polarization. Use manufacturer's data corrected for the actual feed composition.
4. Design for concentration polarization: calculate the mass transfer coefficient from the Sherwood number correlation for the module geometry. The ratio of wall concentration to bulk concentration (polarization modulus) should be kept below 1.5 to 2.0 by limiting recovery per pass and maintaining cross-flow velocity.
5. Plan for fouling: specify pretreatment (prefiltration, pH adjustment, biocide for biofouling), cleaning protocol (frequency, chemicals: acid for inorganic scale, caustic for organics, enzymatic for biofouling), and membrane replacement schedule (typical life 3 to 7 years for RO, 5 to 10 for UF).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
