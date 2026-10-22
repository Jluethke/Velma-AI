# Pad Systems Design

Design the launch pad systems: flame deflector, sound suppression, umbilicals, and strongback.

## Inputs

- `vehicle-configuration`: Vehicle size, thrust, and propellant types
- `launch-site`: Pad location and existing infrastructure
- `turnaround-requirement`: Time between launches for multi-mission capability

## Outputs

- `flame-deflector-design`: Deflector geometry, water flow rate, and material specification
- `umbilical-system`: Fluid, electrical, and data connections between pad and vehicle
- `launch-mount-design`: Hold-down and release mechanism specification
- `sound-suppression-system`: Water deluge system flow rate and nozzle layout

## Process

1. Flame deflector: redirects the engine exhaust away from the vehicle. A flame trench with a deflector surface (wedge or bucket shape) directs the exhaust horizontally. The deflector surface must withstand exhaust temperatures (3,000+ K) and velocities (2,000+ m/s). Refractory concrete over steel, with water cooling. The flame trench for a heavy-lift vehicle is typically 10-20 m deep.
2. Sound suppression water deluge: acoustic energy from the rocket exhaust at launch can damage the vehicle and payload (140-180 dB at the pad). Water injected into the exhaust plume at and just after ignition absorbs acoustic energy. Flow rates of 100,000-1,000,000 liters per minute are typical. The water system must start before engine ignition and continue through liftoff.
3. Umbilicals: provide propellant, pressurant gas, electrical power, data, and conditioning (air or nitrogen purge for payload fairing) to the vehicle while on the pad. At T-0 or shortly before, umbilicals disconnect. Quick-disconnect fittings must separate cleanly and retract away from the vehicle. A hung umbilical (one that fails to disconnect) can damage the vehicle or pull it off course.
4. The strongback or erector: supports the vehicle during pad operations, provides access for personnel, and retracts at launch. For a vehicle erected vertically on the pad, the strongback holds the vehicle against wind loads and provides alignment. At T-0, the strongback releases and retracts (SpaceX Falcon 9 strongback retracts just before launch; some designs fall back).
5. Hold-down and release: the vehicle is held on the pad during engine start and health check (T-3 to T-0). Explosive bolts or hydraulic release clamps. The hold-down force must exceed the maximum engine thrust during the health check. Release must be nearly simultaneous at all hold-down points (within milliseconds) to avoid lateral forces on the vehicle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
