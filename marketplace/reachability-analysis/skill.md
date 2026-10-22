# Reachability Analysis

Compute the set of states from which safety can be guaranteed regardless of disturbances, and the set of states from which no control can prevent constraint violation.

## Inputs

- `system-model`: System dynamics with bounded disturbance
- `safe-set-definition`: Constraint set to remain within
- `actuator-limits`: Control input bounds

## Outputs

- `backward-reachable-set`: Set of states from which the system can be driven into the safe set (or kept safe) despite worst-case disturbance
- `safety-envelope`: The maximal controlled-invariant subset of the safe set: states from which a controller exists to keep the system safe forever

## Process

1. Formulate the Hamilton-Jacobi reachability problem: define V(x,t) as the value function where V >= 0 means the state can be kept safe and V < 0 means no controller can prevent constraint violation. V satisfies the HJ PDE: dV/dt + min_u max_d [DV * (f + g*u + d)] = 0 with terminal condition V(x,T) = h(x).
2. Solve the HJ PDE numerically on a grid (toolbox: helperOC or BEACLS). Grid resolution determines accuracy but computation scales exponentially with state dimension (practical for systems up to 4-5 states, approximate methods for higher).
3. For higher-dimensional systems, use decomposition (partition the system into lower-dimensional subsystems with conservative coupling bounds) or zonotope-based reachability (scales better but gives over-approximations).
4. The zero level set {x : V(x,0) = 0} is the boundary of the backward reachable set. Inside this set, the optimal safe controller is u*(x) = argmin_u max_d [DV * (f + g*u + d)]. This is the last-resort controller that prevents constraint violation.
5. Use the reachable set as the safety envelope: the runtime assurance system monitors whether the current state is inside the reachable set (safe) or approaching its boundary (intervention needed). When the state reaches the boundary, the safe controller overrides the nominal controller.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
