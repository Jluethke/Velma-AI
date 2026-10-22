# Comb Model Bottleneck Finder

Compare the three scores and identify the lowest as the bottleneck, because the lowest component is what the behavior is actually waiting on.

## Inputs

- `capability-score`: The capability score
- `opportunity-score`: The opportunity score
- `motivation-score`: The motivation score

## Outputs

- `lowest-component`: The single component, capability, opportunity, or motivation, with the lowest score
- `bottleneck-rationale`: Why that component is the constraint and why raising the others would not help yet

## Process

1. Lay the three scores side by side. The lowest is the bottleneck, because a behavior cannot happen while any one of the three is missing.
2. Resist the pull to name motivation by default. If capability or opportunity scored lower, more motivation will only produce more frustrated effort.
3. Confirm the bottleneck against the past-attempt history. The component that keeps ending the attempts should match the lowest score.
4. Write why raising the other two would not help yet. Improving a strength that is not the constraint is wasted effort until the bottleneck is addressed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
