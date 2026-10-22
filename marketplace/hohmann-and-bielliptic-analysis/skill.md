# Hohmann And Bielliptic Analysis

Compute the two-burn Hohmann transfer and the three-burn bi-elliptic transfer, then identify which is cheaper for the orbit ratio.

## Inputs

- `transfer_requirements`: Radii, speeds, and time window from the requirement definition.

## Outputs

- `hohmann_solution`: Two-burn Hohmann delta-v values and transfer time.
- `bielliptic_solution`: Three-burn bi-elliptic delta-v and the intermediate apoapsis that minimizes it.
- `transfer_comparison`: Crossover assessment of Hohmann versus bi-elliptic for the given radius ratio.

## Process

1. Hohmann transfer ellipse semi-major axis a_t = (r1 + r2) / 2.
2. First burn dv1 = sqrt(mu/r1) * (sqrt(2*r2/(r1+r2)) - 1); second burn dv2 = sqrt(mu/r2) * (1 - sqrt(2*r1/(r1+r2))); total dv = dv1 + dv2; transfer time t = pi * sqrt(a_t^3 / mu).
3. Worked case low Earth orbit r1 = 6678 km to geostationary r2 = 42164 km: dv1 = 2.42 km/s, dv2 = 1.47 km/s, total = 3.89 km/s, time = 5.27 hours.
4. Bi-elliptic transfer raises apoapsis to an intermediate radius rb beyond r2, performs a small burn there, then lowers periapsis: three burns with the second done at low speed far out.
5. Bi-elliptic beats Hohmann when r2/r1 is greater than 11.94; between 11.94 and 15.58 the result depends on rb; above 15.58 bi-elliptic almost always wins, at the cost of much longer transfer time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
