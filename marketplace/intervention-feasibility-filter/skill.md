# Intervention Feasibility Filter

Filter the surviving interventions by what you can actually control and afford. The best leverage point is worthless if the change sits outside your authority or costs more than the recurrence it prevents.

## Inputs

- `intervention-options`: Candidate interventions
- `prevented-symptoms`: Symptoms each prevents
- `side-effect-watchlist`: Side effects to weigh

## Outputs

- `feasible-interventions`: Interventions inside your control and worth their cost
- `feasibility-notes`: Why each kept option is controllable and affordable

## Process

1. Drop any intervention that requires authority or access you do not have and cannot get.
2. Compare each intervention's cost against the cost of the recurrence it prevents over a year.
3. Weigh side effects against prevented symptoms and keep only net-positive options.
4. Record for each survivor why it is both controllable and worth the cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
