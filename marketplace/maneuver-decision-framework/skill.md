# Maneuver Decision Framework

Apply thresholds and operational factors to decide whether to maneuver.

## Inputs

- `collision_probability`: Computed probability per event.
- `pc_sensitivity`: How firm that probability is.
- `mission_constraints`: Propellant, payload, and operational limits that weigh against maneuvering.

## Outputs

- `maneuver_decision`: Go or no-go decision for an avoidance maneuver.
- `decision_rationale`: Factors behind the decision.

## Process

1. Apply tiered thresholds: a common practice treats probability above 1e-4 as an action level (red) and 1e-5 to 1e-4 as a watch level (yellow).
2. Weigh the miss distance and time to closest approach alongside the probability, since a short lead time limits options.
3. Discount events with poor covariance pending an updated tracking solution rather than acting on a diluted probability.
4. Weigh the cost of maneuvering: propellant spent, payload interruption, and the risk of maneuvering into a new conjunction.
5. Coordinate with the other object's owner or operator when known, and document the decision basis for the conjunction-assessment record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
