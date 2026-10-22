# Sliding Mode Control Design

Design a sliding mode controller that forces the system state onto a sliding surface where the dynamics are desirable and invariant to matched disturbances.

## Inputs

- `system-equations`: Nonlinear state equations with matched uncertainty/disturbance bounds
- `control-objectives`: Tracking objective and disturbance rejection requirement

## Outputs

- `sliding-mode-controller`: Sliding surface definition, reaching law, equivalent control, and switching control with chattering mitigation
- `invariance-guarantee`: Proven disturbance rejection bound and reaching time estimate

## Process

1. Define the sliding surface s(x) = 0 such that motion on the surface achieves the control objective. For tracking with relative degree r, use s = e^(r-1) + c_(r-2)*e^(r-2) + ... + c_0*e where e = y - y_ref and c_i place the sliding dynamics poles at desired locations.
2. Compute the equivalent control u_eq: the control that would keep s_dot = 0 if the system were exactly on the surface. This is the smooth component that cancels the nominal nonlinearity along the surface.
3. Add the switching control u_sw to drive the state to the surface: u_sw = -k * sign(s) where k > |d_max| + eta, with d_max being the bound on matched disturbance and eta a positive margin. This guarantees s * s_dot < 0 (reaching condition) which means the surface is reached in finite time t_reach <= |s(0)| / eta.
4. Mitigate chattering (high-frequency switching from sign function): replace sign(s) with sat(s/phi) where phi is a thin boundary layer. Inside the layer, the controller is continuous. The trade-off: larger phi reduces chattering but introduces steady-state error bounded by phi. Alternatively, use super-twisting algorithm: u = -k1 * |s|^(1/2) * sign(s) + integral(-k2 * sign(s)), which achieves second-order sliding mode with continuous control and finite-time convergence.
5. Verify the reaching condition analytically: substitute the control law into s_dot and show that s * s_dot < -eta * |s| for all disturbances within the assumed bounds. If the bound is uncertain, add margin or use adaptive sliding mode where the gain k adapts based on observed reaching rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
