# Lyapunov Based Controller Synthesis

Design a controller using a Lyapunov function to guarantee stability, combining control Lyapunov functions with constructive design procedures.

## Inputs

- `system-equations`: Nonlinear state equations
- `control-objectives`: Stabilization, tracking, or regulation objective
- `technique-selection`: Confirmation that Lyapunov-based or backstepping approach is appropriate

## Outputs

- `lyapunov-controller`: Control law u(x) with the associated Lyapunov function V(x) proving stability
- `stability-certificate`: Mathematical proof of stability type (asymptotic, exponential, ISS) and the region of attraction estimate

## Process

1. For backstepping (strict-feedback systems): start from the innermost subsystem, design a virtual control and Lyapunov function for that subsystem, then step back to the next subsystem treating the previous virtual control as the state to be regulated. At each step, augment the Lyapunov function with the new tracking error. The final step produces the actual control input.
2. For CLF-based design (general affine systems): find a control Lyapunov function V(x) such that for all x != 0, there exists u making V_dot < 0. Sontag's universal formula gives u = -(L_f V + sqrt((L_f V)^2 + (L_g V)^4)) / (L_g V) when L_g V != 0. This is smooth away from the origin and achieves asymptotic stability.
3. For ISS (input-to-state stability) design: find V(x) such that V_dot <= -alpha(|x|) + gamma(|w|) where w is the disturbance. This guarantees the state remains bounded proportionally to the disturbance magnitude. The ISS gain gamma characterizes disturbance rejection.
4. Estimate the region of attraction: for a local Lyapunov function, the largest level set V(x) = c that is contained within the region where V_dot < 0. Maximize c subject to V_dot < 0 for all x in the level set. LMI methods can compute this for polynomial systems.
5. For implementation, evaluate V(x) and its gradient in real-time if a monitoring function is needed (e.g., to detect when the state approaches the region of attraction boundary and switch to a fallback controller).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
