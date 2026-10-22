# Leverage Point Scoring

Score each potential intervention point by: number of symptoms it resolves, cost to fix, and how far upstream it is.

## Inputs

- `causal-chains`: All causal chains from symptoms to roots
- `common-roots`: Root causes shared across multiple chains

## Outputs

- `scored-interventions`: Each potential intervention point scored by: symptoms resolved (more = better), cost to fix (less = better), upstream distance (further = better)
- `top-intervention`: The single highest-leverage intervention point to address first

## Process

1. For each common root cause, count the number of downstream symptoms it drives. A root cause that eliminates 8 symptoms when fixed is more valuable than one that eliminates 2.
2. Estimate the cost to fix each root cause. Some root causes are cheap to fix (add a checklist, change a default setting, write a specification). Others are expensive (redesign a system, hire a person, change a vendor).
3. Score each intervention: (number of symptoms eliminated times monthly firefighting cost per symptom) divided by (cost to fix). The highest score is the best investment.
4. Select the top intervention. Do not try to fix multiple root causes simultaneously. Fix one, measure the impact, then move to the next.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
