# Context Change Trigger

Trigger rebalancing when the context changes: a new opportunity emerges, a risk materializes, or the goals change.

## Inputs

- `combined-trigger-set`: The drift and performance triggers
- `target-allocation`: The current target allocation

## Outputs

- `context-triggers`: External events that should trigger a rebalancing review: market changes, competitive moves, life events, regulatory changes, new information
- `full-trigger-framework`: The complete trigger framework: drift, performance, and context, with priority and response for each

## Process

1. List the external events that would change the optimal allocation: a new competitor enters the market (reallocate to defense), a new channel opens (reallocate to growth), a life event occurs (reallocate to stability), a regulation changes (reallocate to compliance).
2. For each context trigger, define the expected allocation change: where should resources move, and by how much?
3. Combine all three trigger types (drift, performance, context) into a single framework with priorities. Context triggers typically override drift triggers.
4. The framework replaces the calendar-based review. Rebalancing happens when it is needed, not when a date arrives.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
