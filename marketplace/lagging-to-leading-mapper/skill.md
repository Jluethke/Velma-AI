# Lagging To Leading Mapper

Identify lagging indicators you care about and map the causal chain backward to find the behaviors that cause them.

## Inputs

- `goals`: The outcomes you want to improve
- `current-metrics`: The metrics you currently track

## Outputs

- `causal-chains`: For each outcome: the chain of causes from immediate driver to upstream behaviors, with the time delay at each link
- `candidate-leading-indicators`: Behaviors at the upstream end of each causal chain that predict the outcome

## Process

1. List the outcomes that matter. These are your lagging indicators.
2. For each, map backward: what directly causes this to move? What causes that cause? Continue until you reach behaviors you can directly influence.
3. Note the time delay at each link. Revenue lags pipeline by 30-90 days. Weight lags diet changes by 2-4 weeks.
4. The candidates are the behaviors at the actionable end: outbound activity, demos scheduled, calories consumed, workouts completed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
