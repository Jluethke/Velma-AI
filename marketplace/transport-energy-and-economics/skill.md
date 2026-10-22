# Transport Energy And Economics

Analyze energy consumption, operating costs, and financial viability of the high-speed transport system.

## Inputs

- `propulsion-specification`: Propulsion power, efficiency, and energy recovery capability
- `passenger-flow-model`: Daily ridership, load factors, and service frequency

## Outputs

- `energy-analysis`: Energy consumption per passenger-km, annual energy cost, regeneration fraction, and comparison to competing modes
- `financial-model`: Capital cost, operating cost, revenue projection, and cost recovery timeline

## Process

1. Calculate energy per trip. Integrate propulsion power over the speed-distance profile: acceleration phase (high power), cruise (drag power), braking (regeneration). Energy = integral of (F_propulsion * v) dt. Subtract regenerated braking energy (typically 20 to 40% recovery for electric propulsion). Add hotel loads (HVAC, lighting, doors) and infrastructure loads (pumps, guideway systems, stations).
2. Express as energy per passenger-km. Divide trip energy by (seats * load factor * distance). Compare to competing modes: airline (1.5 to 3.0 MJ/pax-km), automobile (2.0 to 3.5 MJ/pax-km), conventional rail (0.3 to 0.8 MJ/pax-km). High-speed rail typically 0.3 to 0.6 MJ/pax-km. Reduced-pressure tube systems target below 0.2 MJ/pax-km due to low drag.
3. Calculate annual energy cost from annual service-km, energy per km, and electricity tariff. Consider time-of-use pricing: shift energy-intensive operations (tube pumping, pre-cooling) to off-peak. Solar PV along guideway: estimate generation from exposed area, local irradiance, and capacity factor. Net energy cost after self-generation.
4. Build capital cost estimate. Infrastructure: guideway or tunnel per km (heavily variable: $50M to $500M per km for tunnel, $30M to $80M per km for elevated). Vehicles: per unit. Systems: signaling, communications, power supply, station fit-out. Land acquisition. Contingency (30 to 50% for novel technology). Total capital cost for the project.
5. Build financial model. Revenue from ridership * fare. Operating cost: energy, maintenance (infrastructure and vehicles, typically 2 to 4% of capital per year), staff, insurance. Farebox recovery ratio target. Project finance structure: debt service coverage ratio (DSCR > 1.3 for bankability). Sensitivity analysis: ridership variation, cost overrun, interest rate. Benefit-cost ratio including travel time savings, emission reduction, accident avoidance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
