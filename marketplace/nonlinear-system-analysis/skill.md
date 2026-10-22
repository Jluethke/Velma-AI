# Nonlinear System Analysis

Analyze the nonlinear system to determine its structure, equilibria, stability properties, and which nonlinear control technique is appropriate.

## Inputs

- `system-equations`: Nonlinear state equations dx/dt = f(x) + g(x)*u, output y = h(x)
- `control-objectives`: What output to track, what accuracy, and what disturbances to reject

## Outputs

- `system-analysis`: Equilibria, relative degree, zero dynamics, controllability form, and recommended control approach
- `technique-selection`: Which nonlinear control method fits this system and why alternatives were ruled out

## Process

1. Find equilibria by solving f(x_eq) + g(x_eq)*u_eq = 0 with h(x_eq) = y_desired. Check stability of each equilibrium by linearizing and computing eigenvalues of the Jacobian.
2. Compute the relative degree: differentiate the output h(x) until the input u appears. r = number of differentiations. If r = n (state dimension), the system is fully feedback linearizable. If r < n, there are (n-r) internal dynamics (zero dynamics) that must be analyzed for stability.
3. Check if the zero dynamics are stable (minimum phase). If yes, feedback linearization or backstepping are viable. If the zero dynamics are unstable (non-minimum phase), feedback linearization fails and you must use techniques that do not cancel the unstable dynamics (output redefinition, approximate linearization within a stable region, or sliding mode on a different surface).
4. Assess the system structure: strict-feedback form (triangular) enables backstepping; matching condition (uncertainty enters through the same channel as control) enables sliding mode; Euler-Lagrange structure enables passivity-based control.
5. Select technique: feedback linearization for well-modeled systems with stable zero dynamics; sliding mode for systems with matched uncertainty and need for invariance to disturbances; backstepping for strict-feedback cascaded systems; Lyapunov redesign for systems where a nominal controller exists but disturbance tolerance is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
