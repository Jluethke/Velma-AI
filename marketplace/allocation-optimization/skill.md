# Allocation Optimization

Reallocate constraint hours from low-revenue-per-hour work to high-revenue-per-hour work.

## Inputs

- `revenue-per-hour-table`: Products/clients ranked by revenue per constraint hour
- `total-revenue-capacity`: Maximum possible revenue

## Outputs

- `reallocation-plan`: Which work to take more of, which to reduce, which to stop, and which to delegate to non-constraint resources
- `expected-revenue-increase`: The projected revenue increase from reallocation

## Process

1. Identify work in the bottom quartile of revenue per constraint hour. For each item, ask: can this be delegated to a non-constraint resource? Can the price be raised? Can it be discontinued?
2. Identify work in the top quartile. For each item, ask: can we get more of this type of work? What limits the volume? Is the constraint the only bottleneck or are there other limits?
3. Move constraint hours from bottom-quartile work to top-quartile work. Even a 10% shift can produce significant revenue increases because the per-hour value difference is large.
4. For work that cannot be stopped but has low constraint-hour revenue, find ways to reduce the constraint hours it consumes: standardize, templatize, or redesign the workflow.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
