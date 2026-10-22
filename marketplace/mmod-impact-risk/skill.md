# Mmod Impact Risk

Estimate micrometeoroid and orbital-debris flux and the probability of no penetration.

## Inputs

- `orbit_parameters`: Orbit that sets the debris and meteoroid flux.
- `spacecraft_geometry`: Exposed area and critical-component locations.
- `mission_lifetime`: Duration over which impact risk accrues.

## Outputs

- `mmod_flux`: Micrometeoroid and debris flux versus particle size.
- `penetration_probability`: Probability of no penetration for critical items.
- `shielding_recommendation`: Bumper and standoff recommendation.

## Process

1. Take the meteoroid flux from a meteoroid environment model and the debris flux from a debris model, each giving flux versus particle size and direction.
2. Compute the probability of no penetration PNP = exp(-flux * exposed area * time) for the critical items, and set a target such as 0.95.
3. Apply ballistic-limit equations to find the particle size that defeats a given wall at hypervelocity (typical impact speeds 7 to 15 km/s).
4. Recommend a Whipple shield where needed: a thin bumper at a standoff shatters and spreads a particle so the rear wall survives, defeating far larger particles than a single wall.
5. Concentrate protection on critical components (pressure vessels, propellant tanks, crew volume) to meet the penetration target at acceptable mass.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
