# Rom Snapshot Collection And Pod

Collect representative solution snapshots and extract a low-dimensional basis by proper orthogonal decomposition, choosing the basis size from the captured energy.

## Inputs

- `full-order-model`: The high-fidelity simulation whose behavior the reduced model must reproduce
- `parameter-and-time-range`: The parameter values and time span over which the reduced model must be valid

## Outputs

- `snapshot-set`: The matrix of full-order solution snapshots sampled across time and parameters
- `pod-basis`: The reduced basis of dominant modes with the truncation rank chosen from captured energy

## Process

1. Sample snapshots that span the behavior you need to reproduce. Run the full-order model at a spread of parameter values and save the state at many time points; the reduced model can only represent dynamics present in the snapshots, so cover the parameter and time range the application will exercise, including transients and any regime changes.
2. Assemble the snapshot matrix X with each column a state vector of dimension n (the full-order size) and m columns (the snapshots). Subtract a reference state (the mean or a steady solution) so the decomposition captures fluctuations rather than the offset.
3. Compute the proper orthogonal decomposition by the singular value decomposition X = U*Sigma*V^T. The left singular vectors in U are the orthonormal spatial modes ordered by energy, and the singular values in Sigma give each mode energy as sigma_i^2; this is the optimal linear basis in the sense that no other rank-k basis captures more energy.
4. Choose the truncation rank k from the captured-energy criterion. Keep the smallest k such that the cumulative energy sum of sigma_i^2 for i up to k divided by the total sum of sigma_i^2 exceeds a threshold, commonly 0.99 or 0.9999 depending on required fidelity; a sharp drop in the singular-value spectrum indicates a low intrinsic dimension and a small k will suffice.
5. Use the method of snapshots when the state dimension is huge. When n is far larger than m, form the small m by m correlation matrix X^T*X and solve its eigenproblem instead of decomposing the tall X directly; the reduced basis follows from the eigenvectors at a fraction of the cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
