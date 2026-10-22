# Constellation Design Analysis

Design a multi-satellite constellation for the selected orbit regime: determine the number of orbital planes, satellites per plane, phasing, and inter-plane spacing using Walker notation or custom geometry.

## Inputs

- `candidate-orbits`: Ranked orbits from regime selection
- `orbit-comparison-matrix`: Quantitative comparison data

## Outputs

- `constellation-geometry`: Walker notation (i:T/P/F) or custom description with all orbital elements per satellite
- `coverage-analysis-results`: Time-averaged and worst-case revisit time, coverage percentage, contact duration statistics
- `orbit-maintenance-budget`: Annual delta-v for drag makeup, station-keeping, and constellation maintenance maneuvers

## Process

1. Select constellation type. Walker delta patterns distribute satellites uniformly across planes with equal RAAN spacing of 360/P degrees and a relative phase offset of F*360/T degrees. Walker star patterns use 180/P degree RAAN spacing for polar orbits. For non-uniform coverage requirements, custom patterns may outperform Walker.
2. Size the constellation. Minimum satellites for continuous single-coverage of a latitude band can be estimated from the street-of-coverage width and the number of orbital planes. For LEO global coverage, the Streets of Coverage formula gives N_planes = ceil(pi / (2 * lambda_street)) where lambda_street is the half-street width from the Earth central angle.
3. Run coverage simulation. For each point in a ground grid at the required latitude resolution, compute the access intervals over one constellation repeat period. Record the maximum revisit gap, mean revisit, and contact duration statistics. Vary the Walker F parameter to minimize worst-case revisit.
4. Compute differential drag effects within the constellation. Satellites at slightly different altitudes due to deployment dispersions will drift in mean anomaly. Calculate the differential drag acceleration and the required correction maneuvers to maintain phasing within tolerance.
5. Produce the orbit maintenance budget. Sum contributions from atmospheric drag makeup (dominant in LEO), east-west station-keeping (dominant for GEO), differential precession correction (for non-sun-synchronous LEO), and end-of-life disposal maneuver. Express as delta-v per year and propellant mass using the rocket equation with the selected propulsion system Isp.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
