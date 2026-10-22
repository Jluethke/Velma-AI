# Cg And Inertia Estimation

Estimate and control the center of gravity and the inertia tensor across configurations, and plan the measurement that confirms them.

## Inputs

- `mass-status`: The component mass list with positions for the current configuration
- `cg-requirements`: The allowable center-of-gravity envelope and the inertia limits the system must meet across its configurations

## Outputs

- `cg-inertia-estimate`: The estimated center of gravity and inertia tensor per configuration, against the allowable envelope and limits
- `measurement-plan`: The plan to measure mass, center of gravity, and inertia on the built hardware and reconcile to the estimate

## Process

1. Compute the center of gravity as the mass-weighted mean position of every component. Sum mass times position over total mass in each axis; carry it per configuration because the center of gravity moves as fuel burns, payloads change, or appendages deploy. Report the center-of-gravity travel across the full configuration set, not just one point.
2. Build the inertia tensor about the center of gravity. Sum each component's own inertia plus its mass times the squared offset from the system center of gravity (the parallel-axis theorem); report the full tensor including products of inertia, because a nonzero product of inertia causes cross-axis coupling that control and dynamics care about.
3. Check the center of gravity and inertia against the allowable envelope for every configuration. Stability, control authority, handling, and dynamic behavior all depend on where the center of gravity sits and how the inertia is distributed; a center of gravity that leaves its envelope in one configuration is a system problem even if it is fine in others. Flag the worst-case configuration.
4. Hold margin on the center-of-gravity estimate for the same reason as mass. The center of gravity is computed from component masses and positions that are still maturing, so the estimate has uncertainty; keep the predicted center of gravity comfortably inside the envelope early, and tighten as masses become measured.
5. Plan the physical measurement to confirm the estimate. Mass is weighed; center of gravity is found by multi-point weighing or a balance method; inertia is measured by a bifilar or torsional pendulum (period gives inertia) or a spin-balance machine. Plan these measurements on the built article and reconcile them to the estimate, because a model error in position shows up here and nowhere earlier.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
