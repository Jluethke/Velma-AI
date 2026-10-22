# Catalyst Deactivation Management

Characterize and manage catalyst deactivation to set regeneration schedules and predict catalyst lifetime.

## Inputs

- `selected-catalyst`: Catalyst in service
- `kinetic-model`: Kinetic rate expression for fresh catalyst

## Outputs

- `deactivation-mechanism`: Identified deactivation mechanism and rate
- `regeneration-protocol`: Regeneration conditions and expected activity recovery
- `lifetime-prediction`: Expected catalyst life and replacement schedule

## Process

1. Identify the deactivation mechanism from spent catalyst characterization: coking (carbon deposition, diagnosed by TGA/TPO), sintering (particle growth, diagnosed by TEM and chemisorption loss), poisoning (irreversible adsorption of impurity, diagnosed by XPS or ICP of spent catalyst), and leaching (loss of active phase to liquid, diagnosed by ICP of effluent).
2. Model the deactivation kinetics: for coking, activity a(t) often follows a = (1 + k_d * t)^(-n) or exponential decay. For sintering, use the generalized power-law expression: -da/dt = k_s * (a - a_eq)^n where a_eq is the equilibrium activity at the operating temperature.
3. Design the regeneration procedure: for coke, oxidative regeneration (controlled burn in dilute air at temperature below sintering threshold). Measure the activity recovery after regeneration; it will be less than 100% due to irreversible structural changes. Determine the maximum number of regeneration cycles before replacement.
4. Set the regeneration schedule: operate until the activity drops to the economic break-even point where the cost of lost yield equals the cost of regeneration downtime. For continuous processes, swing reactors allow one reactor on-stream while the other regenerates.
5. Predict total catalyst lifetime: extrapolate the irreversible activity loss per cycle to determine when cumulative loss reaches the replacement threshold. Factor in the cost of catalyst, downtime, and disposal. For precious metal catalysts, account for metal recovery value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
