# Cascade Confirmation Review

After thirty days, read the tracker and decide whether the keystone produced the expected cascade or whether the causal map was wrong.

## Inputs

- `downstream-signal-tracker`: The completed daily log
- `cascade-check-dates`: The fixed read dates

## Outputs

- `cascade-outcome-summary`: A summary of which downstream behaviors improved, held, or worsened over the thirty days
- `keystone-next-step`: The decision to continue and deepen the keystone, or to re-map the cascade if it did not appear

## Process

1. Count the days the keystone held. A keystone that held fewer than twenty of thirty days was not adopted firmly enough to test the cascade, so the first fix is the habit itself.
2. Compare each downstream behavior to its starting point. Two or more improving without deliberate effort confirms the cascade is real.
3. If the cascade appeared, keep the keystone and let the downstream changes deepen for another sixty days before adding the next change.
4. If it did not appear while the keystone held, the causal map was wrong. Return to the mapping step and pick a different upstream habit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
