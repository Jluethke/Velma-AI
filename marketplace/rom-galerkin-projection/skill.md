# Rom Galerkin Projection

Project the governing equations onto the reduced basis to obtain a small system of equations for the mode amplitudes, precomputing the reduced operators offline.

## Inputs

- `pod-basis`: The reduced basis onto which the equations are projected
- `full-order-model`: The governing operators of the high-fidelity model

## Outputs

- `reduced-operators`: The precomputed small matrices and tensors of the projected system
- `reduced-system`: The low-dimensional system of equations for the modal amplitudes

## Process

1. Represent the state in the reduced basis as u approximately equal to Phi*a, where Phi holds the k retained modes and a is the vector of k modal amplitudes. The reduced model solves for a, which has dimension k on the order of tens, instead of u, which has dimension n on the order of millions.
2. Project the governing equation by Galerkin. For a semi-discrete system du/dt = A*u + f, substitute u = Phi*a and require the residual to be orthogonal to the basis, left-multiplying by Phi^T: da/dt = (Phi^T*A*Phi)*a + Phi^T*f. The reduced operator Phi^T*A*Phi is a small k by k matrix.
3. Precompute every basis-dependent operator offline. The reduced matrices Phi^T*A*Phi and the projected forcing Phi^T*f depend only on the basis and the operators, not on the online parameter or time, so compute them once and store them; the online solve then touches only small k-sized objects.
4. Handle parameter dependence with an affine decomposition. When the operator depends on parameters as A(p) = sum theta_q(p)*A_q, project each A_q once offline to get small reduced blocks, and assemble the reduced operator online as sum theta_q(p)*(Phi^T*A_q*Phi); this keeps the online cost independent of the full dimension n.
5. Confirm the reduced system reproduces a training case before trusting it. Run the reduced model at a parameter and time already in the snapshot set and compare the reconstructed state Phi*a to the stored full-order solution; a large error here means the basis or the projection is wrong, not that the reduced model is merely extrapolating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
