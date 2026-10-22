# Thermal Boundary Condition Definition

Define the thermal boundary conditions that represent how heat leaves the system, including ambient conditions, airflow, and mounting interfaces.

## Inputs

- `heat-source-map`: Component heat sources with power and location
- `total-system-dissipation`: Aggregate power per mode

## Outputs

- `boundary-conditions`: Complete set of thermal boundary conditions: ambient temperature, airflow velocity profile, cold plate temperature, radiation surfaces, and conduction paths to chassis
- `convection-coefficients`: Calculated or estimated convection coefficients for each surface and airflow condition

## Process

1. Define the ambient temperature specification. Use the maximum rated ambient, not the typical. For outdoor electronics, account for solar loading by adding up to 20C to the air temperature for surfaces in direct sun.
2. For forced convection: calculate Reynolds number from airflow velocity, characteristic length, and air properties at the film temperature. Use Nusselt correlations (flat plate: Nu = 0.664 * Re^0.5 * Pr^(1/3) for laminar, Nu = 0.037 * Re^0.8 * Pr^(1/3) for turbulent) to get h in W/(m^2*K). Typical board-level h values: 5-25 W/(m^2*K) for natural convection, 25-100 for moderate forced air.
3. For natural convection: calculate Grashof number from temperature difference and characteristic length. Use the Rayleigh number (Ra = Gr * Pr) and appropriate correlation for the surface orientation. Vertical plate: Nu = 0.59 * Ra^0.25 for 10^4 < Ra < 10^9.
4. For conduction to chassis or cold plate: measure or estimate the thermal resistance of each mounting interface. A bolted joint typically has 0.5-5 C*cm^2/W depending on surface finish, contact pressure, and interface material.
5. For radiation: calculate the view factor between the board/enclosure surface and the surroundings. For a board inside a sealed box radiating to the enclosure walls, use the enclosed body approximation. Radiation becomes significant above 80C surface temperature or in vacuum.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
