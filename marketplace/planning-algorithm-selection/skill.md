# Planning Algorithm Selection

Select and implement the planning algorithm: compare sampling-based (RRT, RRT*, PRM), optimization-based (trajectory optimization, MPC), and lattice planners by the problem structure.

## Inputs

- `c-space-model`: Configuration space representation
- `constraint-set`: Kinematic, dynamic, safety, and comfort constraints
- `planning-requirements`: Real-time deadline, optimality needs, and replanning frequency

## Outputs

- `planner-implementation`: Selected planning algorithm with parameters, heuristics, and implementation details
- `performance-characterization`: Expected computation time, path quality, and failure modes for the selected planner

## Process

1. Evaluate sampling-based planners. RRT: fast to find any feasible path in high-dimensional spaces, poor path quality (jerky, suboptimal length). RRT*: asymptotically optimal but convergence is slow in practice, rewiring cost grows with sample count. PRM: good for repeated queries in a static environment (roadmap built once), not suitable for dynamic environments. Bidirectional RRT: faster for point-to-point problems. Informed RRT*: uses heuristic to focus sampling, converges faster. Best for: high-dimensional spaces (manipulators), cluttered static environments, when any feasible path is acceptable.
2. Evaluate optimization-based planners. Trajectory optimization: discretize the trajectory into waypoints, optimize jointly for smoothness, obstacle avoidance, and constraint satisfaction. Can produce high-quality paths but sensitive to initialization (local minima). Model Predictive Control (MPC): optimize over a receding horizon, naturally handles dynamic constraints and replanning, but horizon length limits global reasoning. Best for: structured environments with known dynamics, when path quality matters, when constraints are complex.
3. Evaluate lattice planners. Pre-compute a library of dynamically feasible motion primitives (short trajectory segments that respect vehicle kinematics). Search over a graph of these primitives using A* or similar. Guarantees kinematic feasibility by construction. Resolution determines path quality and computational cost. Best for: structured driving (roads, parking), when kinematic feasibility is paramount, when the environment has moderate complexity.
4. Select the planner based on the application. Most production autonomous driving systems use a hierarchical approach: a route planner (A* on road graph) for global planning, a behavior planner (state machine or decision tree) for lane-level decisions, and a local trajectory planner (optimization-based or lattice) for the final smooth trajectory. For manipulators, sampling-based planners with post-optimization smoothing are standard. Document the selected architecture, key parameters (sample count, horizon length, primitive resolution), and the computational budget for each planning layer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
