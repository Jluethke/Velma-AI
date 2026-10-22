# Constellation Deployment And Phasing

Plan the constellation deployment sequence from launch through orbit raising, phasing, and commissioning of each satellite to its operational slot.

## Inputs

- `constellation-design`: Walker notation, orbital elements per slot, total satellite count
- `launch-manifest`: Number of satellites per launch, launch vehicle injection orbit, deployment sequence

## Outputs

- `deployment-plan`: Orbit raising and phasing maneuver sequence for each satellite to reach its operational slot
- `commissioning-schedule`: Timeline for each satellite from deployment through checkout to operational status

## Process

1. Design the orbit raising strategy from the injection orbit to the operational orbit. If the launch vehicle inserts into a lower parking orbit, each satellite uses its own propulsion to raise to the operational altitude. Calculate the Hohmann transfer delta-v and the propellant mass required. For electric propulsion, calculate the spiral time from the thrust and Isp.
2. Design the phasing strategy. Satellites deployed from the same launch into the same plane must spread to their required phase spacing. Lower the orbit of trailing satellites (or raise leading satellites) to create a differential drift rate: delta_omega = -3/2 * n * delta_a / a. The phasing time equals the required phase angle divided by delta_omega. Calculate the total delta-v for the phasing maneuver pair (lower, drift, raise).
3. For multi-plane constellations, use differential RAAN precession from J2 to spread planes. Deploy to different altitudes; the J2 precession rate difference (delta_RAAN/dt = -3/2 * J2 * n * (R_e/a)^2 * cos(i) * delta_a_correction) provides the required RAAN drift. This takes weeks to months but saves propellant versus direct plane change.
4. Plan the commissioning sequence for each satellite: deploy solar arrays and antennas, acquire attitude, establish communication with the ground, check out subsystems (power, thermal, ADCS, payload), upload operational software and configuration, verify pointing accuracy, validate payload data quality, declare operational.
5. Establish the constellation management plan: monitor relative spacing, plan maintenance maneuvers to correct drift from differential drag, define the spare satellite strategy (in-orbit spares, ground spares, or on-demand launch), and set up the automated orbit determination and maneuver planning pipeline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
