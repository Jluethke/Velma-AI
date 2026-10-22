# Launch Vehicle Loads Analysis

Define the load cases and calculate the design loads for every structural component of the launch vehicle.

## Inputs

- `trajectory-design`: Ascent trajectory with velocity, acceleration, and altitude vs time
- `stage-mass-estimates`: Mass breakdown by component and location
- `vehicle-geometry`: Vehicle dimensions, station numbering, and component locations

## Outputs

- `load-case-table`: All design load cases (max-Q, max acceleration, staging, landing) with axial, shear, and bending loads at each station
- `design-load-envelopes`: Envelope of maximum loads at each structural station across all load cases
- `coupled-loads-analysis`: Dynamic amplification factors from vehicle flexibility and thrust oscillation

## Process

1. Identify all load cases: liftoff (thrust transient + acoustic), max-Q (aerodynamic + thrust + gust), max acceleration (near burnout, highest g-load), staging (separation dynamics, venting), engine shutdown transient, and for reusable vehicles, entry and landing loads.
2. Static loads at each station: axial load = thrust - weight - drag (integrated from tip to station). Lateral loads from angle of attack at max-Q combined with wind gust (typically 1.4x mean wind for design). The maximum bending moment is usually at the interstage or payload adapter.
3. Coupled loads analysis (CLA): the vehicle is not rigid. Structural flexibility amplifies dynamic loads from engine thrust oscillation, wind gusts, buffet, and separation events. Build a finite element model and apply forcing functions. Dynamic amplification factors of 1.2-2.0 are common.
4. Engine-out case (for multi-engine stages): sudden loss of one engine creates an asymmetric thrust that generates yaw/pitch moments and shifts the CG. The control system must compensate, and the structure must survive the transient loads during engine-out and the sustained asymmetric flight.
5. Thermal loads: cryogenic propellant tanks contract when filled (LOX at 90K, LH2 at 20K). Differential thermal contraction between the tank and the surrounding structure generates thermal stress. This drives the design of tank skirts and attachment fittings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
