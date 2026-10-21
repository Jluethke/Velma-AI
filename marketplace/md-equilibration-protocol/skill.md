# Md Equilibration Protocol

Equilibrate the system through NVT then NPT ensembles to reach stable temperature and pressure.

## Inputs

- `minimized-coordinates`: Energy-minimized structure
- `system-topology`: Topology file
- `target-conditions`: Target temperature (K) and pressure (bar)

## Outputs

- `equilibrated-coordinates`: System at stable temperature and pressure, ready for production
- `equilibration-metrics`: Temperature, pressure, density, and energy traces over the equilibration

## Process

1. Run NVT equilibration with position restraints on solute to stabilize temperature
2. Run NPT equilibration to converge the density and box volume at the target pressure
3. Check that temperature, pressure, and density have plateaued within acceptable variance
4. Release restraints gradually and confirm the system remains stable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
