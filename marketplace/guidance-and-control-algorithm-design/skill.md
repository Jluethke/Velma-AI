# Guidance And Control Algorithm Design

Design the guidance algorithm for powered flight (iterative guidance, explicit guidance, or powered explicit guidance), the attitude control system for each flight phase, and the dispersions analysis.

## Inputs

- `navigation-design`: Navigation system with error characteristics
- `error-budget`: Navigation error contributions

## Outputs

- `guidance-algorithm`: Guidance law parameters, steering commands, throttle profile, and shutdown criteria
- `dispersions-analysis`: Monte Carlo trajectory dispersions showing 3-sigma orbit insertion errors and abort trigger thresholds

## Process

1. Select the guidance algorithm. Open-loop (pre-programmed pitch profile): simplest, used for sounding rockets and first-stage atmospheric flight where aerodynamic loads dominate. Closed-loop iterative guidance mode (IGM): solves the boundary value problem in real time to steer to the target orbit, used for upper stages. Powered explicit guidance (PEG): simplified analytical guidance that converges to the optimal steering for vacuum flight.
2. Design the first-stage guidance. During atmospheric flight, the vehicle follows a gravity turn trajectory with a pre-programmed pitch profile optimized for the nominal trajectory. The pitch rate is limited by the Q-alpha constraint: the product of dynamic pressure and angle of attack must not exceed the structural limit. An active Q-alpha limiter adjusts the pitch command to keep Q-alpha within bounds during wind shear.
3. Design the upper-stage guidance. The IGM or PEG algorithm computes the time-to-go and the required thrust direction to reach the target state (position and velocity). The algorithm iterates: predict the state at cutoff given the current steering, compute the error from the target, and update the steering. Convergence typically requires 2-5 iterations. Shutdown is triggered when the predicted velocity at cutoff matches the target within the navigation accuracy.
4. Design the attitude control system. During powered flight: thrust vector control (TVC) using hydraulic or electromechanical gimbal actuators. Size the gimbal angle authority to handle the expected CG offset, thrust misalignment, and wind-induced moments. The TVC bandwidth must be above the rigid-body control frequency but below the first bending mode. Implement gain scheduling as mass and moment of inertia change during the burn.
5. Run the dispersions analysis. Monte Carlo simulation with 3000+ cases, varying: wind profile (monthly wind pair sets), thrust variation (+/- 3 sigma), specific impulse variation, mass properties errors, aerodynamic coefficient uncertainties, navigation errors, separation timing, actuator response. The 3-sigma orbit insertion errors must be within the target orbit tolerance. Use the 99.7th percentile results to set abort trigger thresholds (if the vehicle deviates beyond recoverable dispersions, terminate thrust or separate the payload for abort).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
