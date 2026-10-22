# Zero Coverage Gap Finder

Find the skills with zero people at competent or above. These are gaps the team is either not doing or doing badly, often hidden behind workarounds. Rank them by the cost of the function going uncovered.

## Inputs

- `single-point-list`: The single points of failure
- `spof-impact-ranking`: Their impact ranking

## Outputs

- `gap-list`: Every skill with no one at competent or above, with how the function is handled now
- `gap-impact-ranking`: The gaps ranked by the cost of the function going uncovered

## Process

1. Scan the matrix for skills with a count of zero at competent or above.
2. For each, determine how the function is handled now: a workaround, an external contractor, or not at all.
3. Estimate the cost of the gap: what breaks or is left undone because no one owns the skill.
4. Rank the gaps by that cost, so the most damaging uncovered function comes first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
