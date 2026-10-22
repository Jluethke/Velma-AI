# Transfer Selection And Tradeoff

Build the delta-v versus time versus propellant trade table and recommend the transfer that fits the mission.

## Inputs

- `hohmann_solution`: Impulsive two-burn baseline.
- `bielliptic_solution`: Three-burn alternative for large radius ratios.
- `plane_change_strategy`: Inclination-change placement and cost.
- `low_thrust_profile`: Electric-propulsion option.
- `gravity_assist_options`: Flyby opportunities.

## Outputs

- `recommended_transfer`: Chosen transfer method with its delta-v, time, and propellant mass fraction.
- `transfer_rationale`: Why this method wins given the mission constraints.

## Process

1. Tabulate each candidate by total delta-v, transfer time, and propellant mass fraction mp/m0 = 1 - exp(-dv / (g0 * Isp)).
2. Hohmann is optimal for adjacent orbits (radius ratio below about 11.9) and when transfer time must stay short.
3. Bi-elliptic wins only for very large radius ratios and when the longer transfer time is acceptable.
4. Low-thrust electric propulsion wins when propellant mass dominates and the schedule allows months, since high Isp (1500 to 4000 s) shrinks mp dramatically.
5. Gravity assists win for interplanetary targets where no chemical stage could supply the required delta-v; otherwise pick the impulsive option with the lowest delta-v that meets the time limit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
