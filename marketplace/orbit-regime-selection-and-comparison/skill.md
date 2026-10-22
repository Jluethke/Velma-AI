# Orbit Regime Selection And Comparison

Compare candidate orbit regimes quantitatively across coverage, access time, radiation dose, eclipse fraction, delta-v for orbit maintenance, and launch cost. Produce a scored comparison matrix.

## Inputs

- `altitude-range`: Acceptable altitude band from requirements analysis
- `inclination-constraints`: Required inclination range
- `eccentricity-bounds`: Circular vs elliptical constraints

## Outputs

- `candidate-orbits`: Ranked list of 2-4 candidate orbits with full Keplerian elements and performance scores
- `orbit-comparison-matrix`: Quantitative comparison across coverage, eclipse, radiation, maintenance delta-v, and launch cost

## Process

1. For each candidate orbit, compute the orbit period T = 2*pi*sqrt(a^3/mu) and ground track repeat cycle. For repeating ground track orbits, find altitude where the number of revolutions per day is a rational fraction (e.g., 15 + 1/16 rev/day for a 16-day repeat).
2. Calculate instantaneous access area using the Earth central angle rho = arccos(R_e / (R_e + h)) and the swath width from payload field of view. For a constellation, compute time-averaged revisit using Walker analysis or numerical simulation.
3. Estimate annual radiation dose at each candidate orbit using SPENVIS or equivalent. Total ionizing dose behind a reference 100-mil aluminum shield. Flag orbits that exceed typical component ratings (100 krad for rad-hard, 10-30 krad for commercial).
4. Compute orbit maintenance delta-v. For LEO, atmospheric drag makeup dominates: delta-v per year = integral of drag acceleration. Use the drag equation F_drag = 0.5 * rho * Cd * A * v^2 with the ballistic coefficient m/(Cd*A). For GEO, north-south station-keeping costs about 50 m/s per year.
5. Score each candidate orbit on a weighted matrix. Weight the criteria by mission priority (coverage vs cost vs radiation tolerance). Identify the Pareto-optimal candidates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
