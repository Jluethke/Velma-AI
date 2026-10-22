# Observability And Estimator Selection

Analyze what states can be estimated from the available measurements and select the estimator structure.

## Inputs

- `system-model`: State-space model (A, B, C, D) or nonlinear equations
- `sensor-configuration`: Which outputs are measured, sensor noise characteristics, and sample rates

## Outputs

- `observability-analysis`: Observable and unobservable subspaces, observability Gramian condition number, and sensor sufficiency assessment
- `estimator-architecture`: Selected estimator type (Luenberger, KF, EKF, UKF, particle filter) with rationale

## Process

1. Check observability: for linear systems, compute the observability matrix O = [C; CA; CA^2; ...; CA^(n-1)] and its rank. Full rank means all states are observable. If rank-deficient, identify the unobservable modes from the null space of O.
2. For nonlinear systems, check local observability using the observability rank condition: compute dh, dL_f h, dL_f^2 h, ... and check if they span R^n. Nonlinear systems can be locally observable even if the linearization is not, and vice versa.
3. Compute the observability Gramian for the linear case: W_o = integral(exp(A^T t) C^T C exp(At) dt). The condition number of W_o indicates estimation difficulty: well-conditioned means all states are equally easy to estimate; ill-conditioned means some states converge slowly. The eigenvector of W_o with the smallest eigenvalue is the hardest-to-estimate direction.
4. Select estimator: Luenberger observer for deterministic linear systems with known noise characteristics. Kalman filter when sensor and process noise covariances are known or can be estimated. EKF for mildly nonlinear systems (linearization is adequate). UKF for moderately nonlinear systems (avoids Jacobian computation, better captures nonlinear propagation). Particle filter for strongly nonlinear or non-Gaussian problems (computationally expensive, use only when EKF/UKF fail).
5. For multi-rate sensors (different sample rates), design the estimator to run at the fastest rate with measurement updates occurring only when each sensor provides data. This is handled naturally in the Kalman filter prediction-update structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
