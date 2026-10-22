# Avoidance Strategy Assembly

Assemble the avoidance rules into a strategy. The strategy is the set of behaviors that, if followed, make failure very difficult. Compare it against whatever forward strategy you had before. The inversion-derived strategy will contain rules the forward strategy missed entirely.

## Inputs

- `avoidance-rules`: All avoidance rules
- `high-leverage-rules`: The rules that block multiple failure paths
- `stated-goal`: The original goal

## Outputs

- `inversion-strategy`: The strategy derived from inversion: the minimum set of behaviors that make failure unlikely
- `forward-gap-analysis`: Rules in the inversion strategy that were not present in any prior forward-only plan

## Process

1. Start with the high-leverage rules. These form the core of the strategy.
2. Add single-path rules only if the failure path they block is high-probability or high-impact.
3. Compare the inversion strategy against any existing forward plan. What does the inversion strategy include that the forward plan does not?
4. The gaps between the two strategies are the blind spots that forward-only thinking missed. These are the highest-value findings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
