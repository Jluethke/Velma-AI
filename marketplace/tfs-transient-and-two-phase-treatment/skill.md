# Tfs Transient And Two Phase Treatment

Extend the network model to time-dependent operation and two-phase flow where those matter, adding fluid inertia, wave dynamics, and phase-fraction treatment to the steady network.

## Inputs

- `steady-state-solution`: The steady operating point used as the initial condition for a transient
- `component-models`: The component relations extended with inertia and phase behavior

## Outputs

- `transient-response`: The time history of pressures, flows, and temperatures through the event of interest
- `two-phase-treatment`: The phase model applied where vapor or cavitation appears, with its range of validity

## Process

1. Add fluid inertia for slow transients. The unsteady momentum balance adds the term (rho*L/A)*dQ/dt to each branch, so flows no longer respond instantly to pressure changes; integrate the node and branch equations in time from the steady initial condition to capture pump trips, valve closures, and load changes on the timescale of seconds.
2. Capture waterhammer for fast transients. A rapid valve closure sends a pressure wave at the acoustic speed a = sqrt(K/rho)/sqrt(1 + (K*D)/(E*t)), where K is the fluid bulk modulus and E and t the pipe wall modulus and thickness; the Joukowsky pressure rise for an instantaneous flow change dV is dP = rho*a*dV, which can be many times the operating pressure and sets burst and support loads. Resolve it with the method of characteristics on a pipe discretized to the wave speed and time step.
3. Choose the two-phase model by the flow regime. Use a homogeneous equilibrium model (treat the mixture as a single fluid with averaged properties) for well-mixed, near-equilibrium flows; use a drift-flux model where the phases move at different velocities, with the gas superficial velocity j_g = C0*j + Vgj capturing the slip through the distribution parameter C0 and drift velocity Vgj.
4. Handle cavitation and column separation in liquid transients. When the transient pressure drops to the vapor pressure, vapor cavities form and later collapse, producing severe secondary pressure spikes; include a vapor-cavity model at the affected nodes so the transient does not silently ignore a damaging event.
5. Match the time step to the fastest physics resolved. Slow inertial transients tolerate large steps, but waterhammer and the method of characteristics tie the time step to the wave speed and pipe segment length (dt = dx/a); verify stability and refine the time step until the peak pressures stop changing, as in any transient convergence check.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
