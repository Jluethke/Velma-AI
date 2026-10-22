# Propulsion Sizing Verification

Verify total impulse, lifetime throughput, margins, and disposal compliance.

## Inputs

- `propellant_mass`: Loaded propellant to check against total impulse.
- `thruster_layout`: Firing scheme whose throughput must be qualified.
- `mission_lifetime`: Duration over which the system must last.

## Outputs

- `sizing_verification`: Confirmation the system meets total impulse with margin.
- `lifetime_margin`: Throughput and firing-count margin against qualification.
- `disposal_compliance`: Confirmation the disposal delta-v is included.

## Process

1. Check the loaded propellant delivers the required total impulse with at least 5 percent margin after residuals.
2. Confirm the thrusters are qualified for the required throughput and firing count; electric thrusters have erosion-limited life and chemical thrusters have pulse-count limits.
3. Re-run the rocket equation with the latest dry-mass growth, since mass growth raises the propellant needed for the same delta-v.
4. Confirm the disposal delta-v (reorbit or deorbit) is inside the budget and not consumed by stationkeeping.
5. Record the margins and the qualification basis so the propulsion sizing is traceable through the design reviews.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
