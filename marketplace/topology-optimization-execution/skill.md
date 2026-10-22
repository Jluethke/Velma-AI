# Topology Optimization Execution

Run the optimization solver and monitor convergence of objective and constraints.

## Inputs

- `optimization-setup`: Complete problem formulation
- `objective-and-constraints`: Formal optimization statement

## Outputs

- `raw-topology`: Element density field showing where material should be placed, with intermediate densities
- `optimization-convergence`: History of objective function, constraint values, and element density histogram over iterations

## Process

1. Run the optimization: SIMP with the OC (optimality criteria) method or MMA (method of moving asymptotes) as the optimizer. OC is fast for compliance minimization. MMA handles general constraints better. Typical convergence in 50-200 iterations.
2. Monitor convergence: plot objective (compliance or volume) vs iteration. It should decrease monotonically (for minimization). Plot constraint values to verify they are satisfied. Plot the element density histogram: early iterations have many intermediate densities; converged solutions should have most elements at 0 or 1.
3. Check for mesh dependence: run the same optimization on a refined mesh. If the topology (structural layout, number of members, connectivity) changes significantly, the result is mesh-dependent. Increase the filter radius or add minimum member size constraints to obtain a mesh-independent result.
4. Run multiple starting points if possible: topology optimization can have local minima. Different initial density distributions or different random seeds can produce different topologies with similar objective values. The one with the simplest topology is usually preferred for manufacturing.
5. Extract the iso-density surface at a threshold (typically 0.3 to 0.5) to define the solid/void boundary. Elements with density above the threshold are solid; below are void. The threshold affects the final volume and compliance. Sweep the threshold to find the best trade-off.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
