# Randomization Designer

Design the randomization and assignment mechanism.

## Inputs

- `sample-size`: Required sample per variant
- `user-segments`: Any segment restrictions or targeting

## Outputs

- `randomization-plan`: How users are assigned to variants
- `assignment-config`: Technical configuration for the assignment system

## Process

1. Select the randomization unit (user, session, device, region).
2. Design the assignment mechanism (hash-based, feature flag, CDN).
3. Plan for holdout and exclusion groups.
4. Verify the assignment produces balanced groups (A/A test or simulation).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
