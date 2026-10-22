# Friction Reduction Design

For each deferrable or removable step, design the change: remove it, move it to after first value, or simplify it.

## Inputs

- `classified-steps`: Steps by category
- `removal-candidates`: Steps to remove

## Outputs

- `redesigned-flow`: The new onboarding flow with only essential steps before first value, deferred steps after first value, and removed steps gone
- `time-to-value-estimate`: Estimated time to first value in the new flow

## Process

1. Remove all removable steps entirely. Do not move them; delete them.
2. Defer all deferrable steps to after first value. The user completes them in the second session, not the first. Examples: profile completion, preferences, integrations, team invites.
3. For essential steps, reduce friction: auto-fill where possible, provide smart defaults, reduce the number of choices, remove validation that blocks progress.
4. Calculate the new time to first value. The target is under 5 minutes. Under 2 minutes is excellent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
