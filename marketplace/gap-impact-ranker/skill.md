# Gap Impact Ranker

Rank gaps by the impact of filling them: how much would the field advance if this question were answered?

## Inputs

- `gap-list`: List of identified gaps
- `tractability-ratings`: Feasibility assessment for each gap
- `concept-matrix`: Papers-by-concepts matrix for context

## Outputs

- `ranked-gaps`: Gaps ordered by impact, with tractability as a secondary sort
- `impact-rationale`: Why each gap matters if filled

## Process

1. Score each gap on theoretical importance: does it block progress on downstream questions?
2. Score each gap on practical importance: does it affect applications, policy, or clinical practice?
3. Combine impact with tractability to produce a priority ranking.
4. Write a one-sentence rationale for each gap's ranking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
