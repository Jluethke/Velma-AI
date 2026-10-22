# Mpc Constraint Formulation

Translate physical actuator limits, safety limits, and operational limits into the constraint matrices for the QP.

## Inputs

- `discrete-prediction-model`: Plant model
- `mpc-tuning-parameters`: Horizons and weights
- `physical-constraints`: Actuator limits (min/max, rate limits), output safety limits, and state constraints

## Outputs

- `constraint-matrices`: Input constraints (u_min, u_max, delta_u_min, delta_u_max), output constraints (y_min, y_max), and soft constraint slack weights
- `feasibility-analysis`: Assessment of whether the constraint set is always feasible and strategy for infeasible cases

## Process

1. Formulate hard constraints on inputs from actuator physical limits. These are always hard because the actuator cannot exceed them regardless of what the optimizer requests.
2. Formulate input rate constraints from actuator slew rate limits. Rate constraints prevent the optimizer from demanding instantaneous large changes that the actuator cannot track.
3. Formulate output constraints. Decide which are hard (safety-critical: must never be violated) and which are soft (desirable but can be temporarily violated with penalty). Most output constraints should be soft to guarantee feasibility.
4. For soft constraints, add slack variables with a penalty weight in the cost function. Set the penalty weight high enough that the optimizer violates the soft constraint only when no feasible solution exists within it. Typical penalty: 10x to 100x the corresponding output weight Q_ii.
5. Analyze feasibility: given the constraint set and plant dynamics, determine if there exist initial conditions from which no feasible input sequence exists. For input-constrained systems, check that the target setpoint is reachable within the input limits (steady-state feasibility). For output-constrained systems, ensure the plant can be steered away from constraint boundaries fast enough.
6. Implement constraint softening or constraint tightening strategy: soften output constraints by default; tighten input constraints slightly (1% to 5% margin) to provide margin for numerical issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
