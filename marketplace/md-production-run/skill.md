# Md Production Run

Run the production simulation and collect trajectory frames for analysis.

## Inputs

- `equilibrated-coordinates`: Equilibrated starting point
- `system-topology`: Topology file
- `simulation-goal`: Target property dictating run length and frame output interval

## Outputs

- `trajectory-file`: Trajectory with coordinates saved at regular intervals
- `energy-log`: Time series of potential energy, kinetic energy, temperature, and pressure
- `run-parameters`: Timestep, total time, thermostat, barostat, and output frequency used

## Process

1. Configure the production run parameters: timestep, total length, output frequency
2. Launch the simulation with the chosen thermostat and barostat settings
3. Monitor for instabilities (energy drift, temperature excursions, box collapse)
4. Collect the trajectory, energy log, and checkpoint files

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
