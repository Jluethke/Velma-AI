# Reactor Heat Management Design

Design the heat management system for the reactor to maintain target temperature and prevent runaway.

## Inputs

- `reactor-volume`: Reactor volume and dimensions
- `reactor-type`: Selected reactor type
- `rate-law`: Rate expression including temperature dependence
- `arrhenius-parameters`: Activation energy and pre-exponential factor

## Outputs

- `heat-duty`: Heat generation rate and required heat removal rate at design conditions
- `cooling-system-design`: Cooling jacket, internal coils, or external heat exchanger specification
- `stability-assessment`: Parametric sensitivity and runaway margin analysis

## Process

1. Calculate adiabatic temperature rise: delta_T_ad = (-delta_H_rxn * C_A0 * X) / (rho * Cp). This is the temperature increase if no heat is removed. Values above 50 to 100 K warrant careful thermal design.
2. For CSTR: construct the heat generation curve (S-shaped, from Arrhenius) and heat removal line (linear, from coolant and UA). Stable operation requires the removal line to intersect the generation curve with a steeper slope. Multiple intersections mean multiple steady states; identify the desired one and check that startup trajectory reaches it.
3. For PFR: solve the coupled mass and energy balances along the reactor length. For exothermic reactions, a hot spot forms; its magnitude depends on activation energy, feed temperature, and wall cooling. Use the Barkelew criterion or Morbidelli-Varma criterion to check parametric sensitivity near runaway.
4. Size the heat transfer area: Q = U * A * delta_T_lm. For jacketed reactors, U is typically 150 to 500 W/m2K depending on fluids and wall. For internal coils, higher area per volume but reduced mixing. External heat exchanger loop allows independent sizing but adds pumping and holdup.
5. Design safety interlocks: high-temperature alarm, coolant flow loss detection, emergency quench or dump. For batch reactors, calculate the time from coolant loss to runaway onset (thermal inertia) to determine the required response time for safety systems.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
