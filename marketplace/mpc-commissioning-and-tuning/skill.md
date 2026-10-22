# Mpc Commissioning And Tuning

Commission the MPC controller on the real system, validate closed-loop performance, and refine tuning from operational data.

## Inputs

- `solver-configuration`: Complete MPC implementation ready to run
- `discrete-prediction-model`: The model used inside MPC
- `physical-constraints`: Actual plant limits for safety monitoring

## Outputs

- `commissioned-mpc`: Tuned and validated MPC controller running on the real plant
- `performance-report`: Tracking error, constraint satisfaction, computational load, and comparison to design specifications

## Process

1. Before closing the loop, run the MPC optimizer open-loop with recorded plant data to verify it produces reasonable control actions. Check that the solver converges, constraints are satisfied, and the predicted trajectory is physically plausible.
2. Close the loop at reduced performance first: increase R and S weights to make the controller conservative, then gradually reduce them toward the design values while monitoring closed-loop behavior.
3. Verify constraint satisfaction: log every instance where a constraint becomes active (input saturates or output approaches limit). Active constraints are normal and expected; violated hard constraints indicate a formulation error.
4. Measure actual closed-loop bandwidth and compare to design target. If too slow, reduce R or S. If too oscillatory, check model accuracy (closed-loop oscillation often indicates model mismatch rather than weight error).
5. Monitor solver computation time distribution. The 99th percentile must be below the sample time. If it is not, reduce N_c, simplify constraints, or move to a faster solver.
6. After initial commissioning, update the plant model from closed-loop data (use indirect identification or inject small perturbations on top of the control signal). Re-estimate the model periodically to track plant changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
