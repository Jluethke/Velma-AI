# Low Thrust Spiral And Gravity Assist

Evaluate electric-propulsion spiral transfers and planetary gravity assists as alternatives to impulsive burns.

## Inputs

- `transfer_requirements`: Thrust class, mass, and time window.
- `transfer_comparison`: Impulsive baseline cost to compare against.

## Outputs

- `low_thrust_profile`: Continuous-thrust delta-v and the spiral transfer duration.
- `gravity_assist_options`: Candidate flybys and the velocity change each can supply for free.

## Process

1. For a continuous low-thrust spiral between circular orbits the delta-v approaches the speed difference: dv = |sqrt(mu/r1) - sqrt(mu/r2)|, independent of thrust magnitude.
2. The Edelbaum result for a combined altitude and plane change is dv = sqrt(v1^2 + v2^2 - 2*v1*v2*cos(pi/2 * di)); electric propulsion absorbs large plane changes far more cheaply than impulsive burns.
3. Spiral transfer time t = (spacecraft mass * dv) / thrust; a 2000 kg vehicle with 0.2 N thrust needing 2 km/s takes about 2.0e7 s, roughly 230 days, so schedule is the binding constraint.
4. A gravity assist changes the heliocentric velocity by turning the v-infinity vector: the turn angle satisfies sin(delta/2) = 1 / (1 + rp * vinf^2 / mu_planet), so a closer flyby and a slower approach turn more.
5. A single Earth or Venus flyby can add on the order of several km/s to an interplanetary trajectory at no propellant cost, which is why outer-planet missions chain multiple assists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
