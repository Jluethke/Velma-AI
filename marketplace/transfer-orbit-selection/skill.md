# Transfer Orbit Selection

Compare transfer orbit options (Hohmann, bi-elliptic, general two-impulse, low-thrust spiral) for a given initial and target orbit, evaluating delta-v cost, transfer time, and operational complexity.

## Inputs

- `initial-orbit`: Keplerian elements of the departure orbit
- `target-orbit`: Keplerian elements of the destination orbit
- `spacecraft-propulsion`: Thrust level, Isp, propellant mass available, engine restart capability

## Outputs

- `transfer-options`: Ranked list of transfer strategies with delta-v, transfer time, and number of burns
- `selected-transfer`: Chosen transfer with full burn sequence definition

## Process

1. For coplanar circular-to-circular transfers, compute the Hohmann transfer delta-v: delta_v1 = sqrt(mu/r1) * (sqrt(2*r2/(r1+r2)) - 1) and delta_v2 = sqrt(mu/r2) * (1 - sqrt(2*r1/(r1+r2))). Transfer time is half the transfer orbit period.
2. Evaluate bi-elliptic transfer when r2/r1 > 11.94 (always cheaper than Hohmann) or in the range 11.94 > r2/r1 > sqrt(2)+1 (may be cheaper depending on intermediate apoapsis). The bi-elliptic uses three burns but the total delta-v can be less for large orbit ratio changes.
3. For plane changes, the delta-v for a simple plane change is 2*v*sin(theta/2) where theta is the plane change angle. Combined plane change with orbit raising at apoapsis is always cheaper: perform the plane change where velocity is lowest. Calculate the optimal split between the two burns.
4. For low-thrust transfers (electric propulsion), compute the spiral delta-v. For circular-to-circular, delta_v = sqrt(mu/r1) - sqrt(mu/r2), which is less than Hohmann delta-v but transfer time is much longer. Use Edelbaum's approximation for combined orbit raising and plane change: delta_v = sqrt(v1^2 + v2^2 - 2*v1*v2*cos(pi/2 * delta_i)).
5. For each option, calculate propellant mass from the rocket equation m_prop = m_dry * (exp(delta_v / (g0*Isp)) - 1). Compare total delta-v, transfer time, number of engine restarts, and operational risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
