# Dynamic Obstacle Handling

Handle dynamic obstacles in motion planning: predict obstacle trajectories, plan around moving objects using velocity obstacles or prediction-aware optimization, and design contingency plans for uncertain behavior.

## Inputs

- `planner-implementation`: Selected planning algorithm
- `c-space-model`: Configuration space model
- `constraint-set`: Safety and comfort constraints

## Outputs

- `dynamic-planning-system`: Motion planner extended with dynamic obstacle prediction and interaction-aware planning
- `contingency-plan-framework`: Framework for generating and selecting contingency trajectories when predictions are uncertain

## Process

1. Implement obstacle trajectory prediction. Constant velocity prediction: extrapolate current state forward, simple but fails at intersections and lane changes. Physics-based prediction: propagate with a kinematic model, respecting road geometry (vehicles follow lanes). Behavior-aware prediction: classify intent (lane keep, lane change, turn) from observed behavior, predict trajectory per intent hypothesis with probability weights. Interaction-aware prediction: model how the ego vehicle's plan affects other agents' behavior (game-theoretic). Start with physics-based prediction and add behavior awareness where interaction density demands it.
2. Integrate predictions into planning using velocity obstacles or spatiotemporal planning. Velocity Obstacle (VO): compute the set of ego velocities that would lead to collision with a predicted obstacle trajectory. Plan in velocity space to avoid all VOs. Reciprocal Velocity Obstacles (ORCA): assume all agents share responsibility for avoidance, halves the avoidance burden. Spatiotemporal planning: plan in (x, y, t) space where obstacles sweep out volumes over time, find a path through free spacetime. For optimization-based planners, add obstacle prediction as time-varying constraints.
3. Design contingency planning for uncertain predictions. Generate multiple trajectory candidates: a nominal trajectory that follows the most likely prediction, and contingency trajectories for alternative obstacle behaviors (e.g., the car ahead brakes hard, the pedestrian steps into the road). Evaluate each contingency for feasibility and cost. Maintain a contingency trajectory that can be executed within the system's reaction time if the nominal plan becomes infeasible. The contingency must always exist; if no safe contingency exists, the system must slow down until one does.
4. Handle the interaction problem. When the ego vehicle's behavior affects other agents (merging, unprotected left turns, pedestrian crossings), pure prediction-then-plan creates a frozen robot problem: the planner waits for the other agent, who also waits. Break the deadlock by committing to an assertive plan when the situation is safe (sufficient gap), or by communicating intent (turn signal, creeping forward). Tune the assertiveness parameter per scenario: more assertive in dense urban traffic where hesitation creates risk, more conservative near vulnerable road users.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
