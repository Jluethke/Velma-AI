# Relief System Design

Size the pressure relief system for the process to prevent overpressure in all credible scenarios.

## Inputs

- `process-pid`: P&ID with vessel design pressures and operating conditions
- `hazop-worksheets`: Overpressure scenarios from HAZOP

## Outputs

- `relief-device-sizing`: Relief valve or rupture disk size for each protected vessel
- `relief-scenarios`: Governing scenario for each relief device with required relief rate
- `disposal-system-design`: Flare, scrubber, or atmospheric vent design for relieved fluids

## Process

1. Identify all overpressure scenarios per API 521: blocked outlet, fire case, control valve failure, thermal expansion, chemical reaction runaway, tube rupture in heat exchanger, utility failure, and check valve failure. Determine the required relief rate for each scenario.
2. The governing case is the scenario requiring the largest relief rate. For fire case, use API 521 wetted area method: Q = 21000 * F * A_w^0.82 (BTU/hr) where F is the environmental factor (insulation, drainage) and A_w is the wetted area up to 25 feet height.
3. Size the relief valve per API 520: A = W / (C * K_d * P_1 * K_b * K_c) * sqrt(T*Z/M) for gas service. For liquid service, A = Q / (K_d * K_w * K_c) * sqrt(G / (P_1 - P_2)). Select the next standard orifice size from API 526.
4. Design the inlet piping so that the pressure drop is less than 3% of the set pressure (to prevent chatter). Design the outlet piping to keep the built-up back pressure within the valve's capability (conventional valve: 10% of set, balanced bellows: 30%, pilot operated: 50%).
5. Design the disposal system: for toxic or flammable fluids, route to a flare system. Size the flare header for the simultaneous contingency (not all scenarios at once; typically the largest single contingency plus 50% of the next largest). Calculate the required flare tip diameter for stable flame and radiation limits at grade level (API 521 radiation model).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
