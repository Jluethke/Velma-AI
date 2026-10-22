# Parameter Adaptation Law Design

Design the online parameter update law that drives the adaptive controller parameters toward values that achieve the control objective.

## Inputs

- `adaptive-architecture`: Selected adaptive control structure
- `plant-model`: Plant model class with uncertain parameters

## Outputs

- `adaptation-law`: Parameter update equation with adaptation gain, modification terms, and parameter bounds
- `stability-proof-sketch`: Lyapunov function and the conditions under which parameter convergence and signal boundedness are guaranteed

## Process

1. For direct MRAC: define the tracking error e = y - y_m (actual output minus reference model output). The adaptation law is theta_dot = -Gamma * phi * e where Gamma is the positive-definite adaptation gain matrix and phi is the regressor vector. The Lyapunov function V = e^T P e + (theta - theta*)^T Gamma^-1 (theta - theta*) where P solves the reference model Lyapunov equation.
2. Set adaptation gain Gamma: large Gamma gives fast adaptation but can cause oscillation (high-frequency chatter). Small Gamma gives slow adaptation and large transient tracking error. Start with Gamma that gives adaptation time constant on the order of the plant's dominant time constant. For each parameter, the diagonal element Gamma_ii scales inversely with the expected magnitude of the corresponding regressor element squared.
3. Add stability-assurance modifications to prevent parameter drift when persistent excitation is absent: sigma-modification (adds -sigma*Gamma*theta to the adaptation law, which keeps parameters bounded at the cost of small steady-state error), projection (clips parameters to a known convex set containing the true values), or dead zone (stops adaptation when the tracking error is below the noise floor).
4. For L1 adaptive: the adaptation law is the same high-gain form (fast parameter estimation), but the adaptive signal passes through a low-pass filter C(s) before reaching the plant. The filter bandwidth sets the trade-off: wider bandwidth means better disturbance rejection but less filtering of adaptation transients. Design C(s) so that ||G(s)(1-C(s))||_infinity is small (reference tracking is preserved) and ||C(s)||_1 * ||theta||_infinity < 1 (L1 stability condition).
5. Verify persistent excitation condition: for parameter convergence (not just signal boundedness), the regressor phi must be persistently exciting (its correlation matrix integral over any window is positive definite). In practice, PE is guaranteed only when the reference signal is sufficiently rich. Without PE, parameters remain bounded (due to sigma-modification or projection) but may not converge to true values.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
