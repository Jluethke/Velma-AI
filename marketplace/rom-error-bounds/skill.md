# Rom Error Bounds

Attach an a posteriori error estimate to the reduced-model output so its prediction carries a bound, and use that bound to drive a greedy basis construction.

## Inputs

- `stabilized-reduced-model`: The reduced model whose error must be bounded
- `full-order-model`: The operators needed to compute the residual and stability constant

## Outputs

- `error-bound`: The a posteriori bound on the reduced-model error as a function of parameters
- `greedy-basis-plan`: The next parameter at which to enrich the basis, chosen where the bound is largest

## Process

1. Compute the residual of the reduced solution in the full equations. Insert the reconstructed state Phi*a into the full-order governing equation and evaluate the residual r(p); unlike the true error, the residual is computable without a full-order solve, and it is the engine of a posteriori error estimation.
2. Bound the error by the residual over a stability constant. For many problems the error satisfies ||u - Phi*a|| <= ||r(p)|| / beta_LB(p), where beta_LB is a computable lower bound on the stability (inf-sup or coercivity) constant of the operator; this turns a cheap residual into a certified bound on the output error.
3. Precompute the residual-norm ingredients offline so the bound is cheap online. The residual norm expands into inner products of basis-projected operator pieces that can be assembled once; the online evaluation of the error bound then costs only k-sized operations, preserving the speed that justifies the reduced model.
4. Drive a greedy basis construction with the bound. Over a training set of parameters, evaluate the error bound everywhere, run the full-order model only at the single parameter where the bound is largest, add that snapshot to the basis, and repeat; this reduced-basis greedy builds a near-optimal basis with far fewer full-order solves than sampling blindly.
5. Stop the greedy loop on the bound, not on a guess. Terminate when the maximum error bound over the training set falls below the target tolerance; the bound gives a certified statement that the reduced model meets its accuracy everywhere in the training set, which a snapshot count alone cannot provide.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
