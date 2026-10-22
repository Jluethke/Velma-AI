# Guidance Algorithm Design

Implement the guidance algorithm that computes the required thrust direction and cutoff time for orbit insertion.

## Inputs

- `navigation-error-budget`: Expected navigation accuracy
- `stage-mass-estimates`: Vehicle mass properties for trajectory prediction
- `target-orbit`: Desired orbit parameters at insertion

## Outputs

- `guidance-algorithm`: Selected algorithm (PEG, IGM, or other) with implementation specification
- `guidance-gains`: Algorithm tuning parameters for convergence and robustness
- `performance-envelope`: Off-nominal conditions the guidance can accommodate (engine out, low Isp, winds)

## Process

1. Powered Explicit Guidance (PEG): assumes constant thrust and gravity, solves for the thrust direction (two angles) and cutoff time that achieve the desired position and velocity at burnout. The solution is iterated every guidance cycle (1-10 Hz) as the state estimate is updated. Used on Space Shuttle, Falcon 9 upper stage.
2. Iterative Guidance Mode (IGM): similar to PEG but uses a more accurate vehicle model (accounts for changing mass, multi-phase burns). Solves a two-point boundary value problem numerically. Used on Saturn V (and its descendants) and Ariane.
3. Open-loop guidance for first stage: during atmospheric flight, the vehicle follows a pre-computed pitch profile (or gravity turn) because aerodynamic loads make closed-loop guidance dangerous (could command maneuvers that exceed structural limits). Closed-loop guidance begins after first stage separation or after exiting the atmosphere.
4. Q-alpha limiting: during atmospheric flight, the guidance must limit the product of dynamic pressure and angle of attack (Q-alpha), which is the aerodynamic bending load. If wind or navigation error causes Q-alpha to approach the structural limit, the guidance adjusts the pitch program to reduce angle of attack, accepting trajectory error to protect the structure.
5. Engine-out guidance: if an engine fails, the guidance must replan the trajectory with reduced thrust. On multi-engine stages, engine-out may still achieve orbit with a longer burn time (the vehicle has a lower T/W but the same total impulse minus one engine). The guidance must detect the failure and adapt within one guidance cycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
