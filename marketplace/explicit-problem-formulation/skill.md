# Explicit Problem Formulation

Determine if explicit dynamics is the right method, define the time scale, and set up the initial conditions.

## Inputs

- `impact-scenario`: Physical event: impactor geometry, mass, velocity, target geometry, materials, and the response to predict (deformation, energy absorption, failure pattern)
- `analysis-requirements`: Required fidelity in deformation shape, peak force history, and energy absorption

## Outputs

- `explicit-setup`: Time scale, mass scaling decision, initial velocities, and gravity specification
- `method-justification`: Why explicit is chosen over implicit, and the expected stable time step

## Process

1. Explicit vs implicit decision: explicit integration is preferred when the event duration is short (milliseconds to seconds), the deformation is large (elements distort significantly), contact is complex (multiple bodies, sliding, separation), and material failure occurs. Implicit is better for slow quasi-static loading where inertia does not matter.
2. Estimate the stable time step: delta_t_stable = L_min / c where L_min is the smallest element characteristic length and c is the speed of sound in the material (c = sqrt(E/rho) for solids). For steel (c ~ 5000 m/s) with 5mm elements, delta_t ~ 1 microsecond. The total simulation time divided by the stable time step gives the number of time steps.
3. Mass scaling: for quasi-static problems simulated with explicit (metal forming), artificially increase the material density to increase the stable time step. The criterion: kinetic energy must remain below 5-10% of the internal energy throughout the simulation. If kinetic energy grows too large, the solution has dynamic effects that are not physical.
4. Set initial conditions: initial velocity for impactors, initial stress state if the component is preloaded (pretensioned bolts, pressurized vessels), and gravity for drop tests. Ensure the initial configuration has no element penetrations (initial contact overlap causes instability).
5. Define the total simulation time: long enough to capture the event and any post-event response (rebound, oscillation). For crash (50-100ms), drop tests (time to peak deformation + rebound), or blast (2-5x the positive phase duration).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
