# Constraint Feasibility Check

Check whether the constraints are feasible together: can you operate within all of them simultaneously?

## Inputs

- `anti-goals`: All defined anti-goals
- `planning-context`: The situation you are planning for

## Outputs

- `feasibility-assessment`: Whether all anti-goals can be satisfied simultaneously, or whether some conflict with each other
- `resolved-constraints`: The final set of anti-goals after resolving any conflicts (some may be relaxed to make the set feasible)

## Process

1. Check each pair of anti-goals for conflict. 'I will not work more than 40 hours per week' might conflict with 'I will launch the product by March 1' given the current scope.
2. If constraints conflict, decide which is more important. The more important constraint stays; the less important one is relaxed or removed.
3. Test feasibility by imagining a plan that satisfies all constraints. If you can envision at least one such plan, the constraint set is feasible.
4. If no feasible plan exists, you have learned something important: your expectations are internally contradictory, and something has to give. Better to discover this now than midway through execution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
