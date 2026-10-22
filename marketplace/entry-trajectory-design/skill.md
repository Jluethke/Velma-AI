# Entry Trajectory Design

Design the entry trajectory to manage the trade between peak heating, total heat load, g-load, and landing accuracy.

## Inputs

- `entry-conditions`: Entry interface velocity and flight path angle
- `tps-zone-map`: TPS capability (maximum allowable heat flux and heat load)
- `structural-limits`: Maximum allowable g-load for structure and payload

## Outputs

- `entry-flight-profile`: Altitude, velocity, flight path angle, and g-load vs time
- `bank-angle-schedule`: Bank angle modulation for range and cross-range control
- `landing-footprint`: Achievable landing area from dispersed entry conditions

## Process

1. The entry flight path angle at the atmosphere interface (typically 120 km altitude) sets the initial character of the entry. Steep entry (gamma > 5 degrees): high peak g-load and heating rate, short duration, low total heat load. Shallow entry (gamma < 2 degrees): lower peak values but longer entry, higher total heat load, risk of skip-out.
2. For lifting entry vehicles (L/D > 0.3), bank angle modulation controls the vertical component of lift, which controls the deceleration rate and therefore heating and g-load. Full lift-up: maximum deceleration altitude, minimum heating. Full lift-down: deeper penetration, higher g-load. Bank angle schedule is the primary control variable.
3. The guidance challenge: the entry trajectory must thread between four constraints simultaneously: (1) peak heat flux below TPS limit, (2) total heat load below TPS mass design, (3) peak g-load below structural/human limit, (4) arrive at the landing site with acceptable accuracy. Bank angle and angle of attack are the two controls.
4. For ballistic entry (capsules with no lift modulation): the entry corridor is narrow. Too steep = excess g-load (Apollo limit: 10g). Too shallow = skip-out. The corridor width depends on entry velocity and vehicle ballistic coefficient (m/CdA). Higher L/D widens the corridor.
5. Cross-range: banking to one side and then the other (bank reversals) allows the vehicle to steer laterally. The Space Shuttle had 2,000 km cross-range capability from its L/D of 1.1. A capsule with L/D of 0.3 has about 100 km of cross-range. Cross-range determines how many orbits must pass before a landing opportunity exists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
