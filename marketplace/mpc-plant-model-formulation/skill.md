# Mpc Plant Model Formulation

Formulate or obtain the discrete-time state-space prediction model used inside the MPC optimizer.

## Inputs

- `plant-model`: Continuous-time transfer function or state-space model of the plant
- `control-objectives`: Tracking, regulation, or economic objectives and the constraint set

## Outputs

- `discrete-prediction-model`: Discrete-time state-space model (A, B, C, D) at the chosen sample time, augmented with disturbance model if needed
- `mpc-sample-time-rationale`: Chosen sample time and why it balances prediction accuracy against computational load

## Process

1. Discretize the continuous plant model using zero-order hold at a sample time between 1/10 and 1/30 of the desired closed-loop rise time. Faster sampling improves prediction but increases QP size.
2. If the plant is nonlinear, decide between linear MPC with successive linearization (adequate if operating near a setpoint) and nonlinear MPC (needed if the operating range spans significant nonlinearity). Linear MPC is preferred when it works because the QP is convex and solution time is predictable.
3. For offset-free tracking of step disturbances, augment the model with integrating disturbance states on the outputs. Design a state estimator (Kalman filter or Luenberger observer) to estimate both plant states and disturbance states from measured outputs.
4. Verify the augmented model is observable (disturbance states are observable from outputs). If not, restructure the disturbance model.
5. For gain-scheduled MPC (nonlinear plant approximated by multiple linear models), define the scheduling variable and the operating points. At each point, store (A_i, B_i, C_i) and interpolate or switch based on the scheduling variable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
