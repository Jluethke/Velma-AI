# First Principles Principle Rebuild

Rebuild a solution from the hard constraints upward, reasoning from the fundamentals rather than copying how others solved it. The constraints define the smallest box the answer must fit.

## Inputs

- `hard-constraints`: The real limits that survive scrutiny
- `discarded-conventions`: The conventions dropped and what they cost

## Outputs

- `first-principles-solution`: A solution derived from the constraints, not from analogy
- `reasoning-trace`: The step-by-step derivation from each constraint to the solution

## Process

1. Start from the hard constraints and nothing else. Treat the discarded conventions as freed-up room, not rules.
2. Ask what the cheapest or simplest thing is that satisfies every hard constraint.
3. Build the solution one constraint at a time, writing down why each design choice follows from a constraint.
4. Resist reaching for how the industry does it. If a choice is there only because others do it, mark it for review.
5. Keep the reasoning trace so anyone can follow each step from constraint to conclusion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
