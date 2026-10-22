# Tank Structural Design

Design propellant tank structures for internal pressure, axial compression, and bending loads while minimizing mass.

## Inputs

- `load-case-table`: Design loads at tank stations
- `propellant-combination`: Propellant type determines operating temperature and internal pressure
- `vehicle-geometry`: Tank diameter and length constraints

## Outputs

- `tank-wall-design`: Wall construction type, thickness, and material specification
- `dome-design`: Tank dome shape, thickness, and boss configuration
- `tank-mass-estimate`: Structural mass of each tank including domes, bosses, and attachments
- `proof-test-requirements`: Proof pressure and load test levels for qualification

## Process

1. Three approaches to tank design: (1) Pressure-stabilized monocoque: the tank wall carries flight loads only when pressurized (Atlas, Centaur). Lightest possible, but collapses if pressure is lost. (2) Skin-stringer-frame: conventional semi-monocoque with longerons and ring frames (Saturn S-IC). Heavier but structurally resilient. (3) Isogrid/orthogrid: machined integral stiffening pattern on tank wall. Intermediate weight and stiffness.
2. Wall thickness sizing: the wall must resist hoop stress from internal pressure (sigma = P*r/t) AND axial compression from vehicle bending and thrust loads. For thin-walled cylinders, axial compression is limited by buckling, not material yield. Buckling knockdown factor for monocoque cylinders is 0.6-0.8 of classical theory.
3. Material selection: Al 2219-T87 is the standard for LOX tanks (good weldability, good fracture toughness at cryogenic temperature). Al-Li 2195 (27% lower density than 2219, higher strength) is used on modern vehicles (SLS, Falcon 9 upper stage). CFRP composite tanks save 30-40% mass but are challenging for cryogenic service (microcracking, permeation).
4. Dome design: ellipsoidal domes (typically 1.4:1 to 2:1 ratio) minimize the combined mass of dome and cylindrical section. Hemispherical domes minimize dome stress but waste volume. The common bulkhead (shared wall between LOX and fuel tanks) eliminates an intertank section and one dome, saving significant mass and length (Saturn S-IV, Centaur).
5. Proof testing: each flight tank is pressurized to 1.10-1.25 times the maximum expected operating pressure at the maximum expected flight temperature. This screens for manufacturing defects that would cause failure below design load. The proof test is the final acceptance criterion before flight.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
