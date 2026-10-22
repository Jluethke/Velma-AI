# Mbd Simulation And Force Extraction

Run the multibody dynamics simulation and extract joint forces, accelerations, and loads for structural analysis.

## Inputs

- `mbd-model`: Complete multibody model
- `operating-scenario`: Driving inputs (motor torque profile, road profile, applied loads) and simulation duration

## Outputs

- `motion-results`: Body positions, velocities, and accelerations over time for all bodies
- `force-results`: Joint reaction forces and moments, actuator forces, and contact forces over time, formatted for FEA load input

## Process

1. Choose the integration method: for stiff systems (high stiffness contacts, flexible bodies), use an implicit integrator (BDF, HHT-alpha) which is stable at large time steps but requires solving a nonlinear system at each step. For non-stiff systems, explicit integrators (RK45) are simpler but require small time steps for stability.
2. Set the time step and output interval: the integration time step should resolve the highest frequency in the system (at least 10x the highest natural frequency for implicit, limited by stability for explicit). The output interval can be coarser than the integration step; record at the Nyquist rate of the highest frequency of interest.
3. Run the simulation: monitor energy balance (kinetic + potential + dissipated should equal work input), constraint violation (joint constraint equations should be satisfied to within numerical tolerance, typically 1e-6 to 1e-10), and check for singularities (configurations where the Jacobian loses rank).
4. Extract joint forces: at each joint, report the reaction force and moment in the joint coordinate system. These are the loads that the connected structure must carry. For fatigue analysis of joint pins, bearings, or mounting points, extract the complete force time history over the duty cycle.
5. For flexible body loads: if a body was modeled as flexible (Craig-Bampton), extract the modal participation factors and interface forces. These can be mapped back to the FE mesh for detailed stress analysis. This coupling (multibody loads to FEA stress) is the critical link between system-level dynamics and component-level durability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
