# Rom Online Offline Validation

Validate the reduced model on parameters it was not trained on and account honestly for the offline cost, so the claimed speedup is net of the investment and holds where it will be used.

## Inputs

- `greedy-basis-plan`: The final basis produced by the greedy enrichment
- `parameter-and-time-range`: The operating envelope over which the reduced model is validated

## Outputs

- `validated-rom`: The reduced model with out-of-sample accuracy and its validity envelope
- `cost-benefit-record`: The offline build cost, the online per-query cost, and the net speedup and break-even query count

## Process

1. Test at out-of-sample parameters and times. Evaluate the reduced model at parameter and time points deliberately excluded from the snapshot and greedy sets, and compare to full-order solves; in-sample accuracy is expected and proves little, while out-of-sample accuracy is what the application depends on.
2. Quantify the online speedup against the full dimension. With a reduced dimension k on the order of 10 to 50 and a full dimension n on the order of 1e6 or more, and with nonlinear terms handled by interpolation so no step touches n, the online solve is typically faster by several orders of magnitude; measure it rather than asserting it.
3. Account for the offline cost and the break-even point. The snapshots, decomposition, operator projection, and greedy enrichment are a large one-time cost; divide it by the per-query saving to get the number of online queries needed to break even, and report whether the intended use (many-query optimization, real-time control, uncertainty propagation) clears that threshold.
4. Map the validity envelope and its edges. Confirm where in parameter space the out-of-sample error stays within tolerance and mark where it degrades; a reduced model built from snapshots in one regime will not represent a regime change (a new separation, a bifurcation) that the snapshots never saw, and that edge must be stated.
5. Hand off the reduced model with its certificate. Package the basis, the reduced operators, the interpolation points, the error bound, the out-of-sample accuracy, and the validity envelope, so the model can be deployed in an optimization or control loop with a clear statement of where and how well it stands in for the full simulation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
