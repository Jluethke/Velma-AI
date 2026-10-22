# Inversion Recheck

After implementing the anti-failure actions, re-run the inversion to check for new failure modes.

## Inputs

- `anti-failure-actions`: The actions taken
- `success-indicators`: The metrics showing progress

## Outputs

- `remaining-overlaps`: Any failure methods still partially in effect after the changes
- `new-failure-modes`: New failure methods that emerged as a result of the changes (fixing one problem sometimes creates another)

## Process

1. Re-run the failure guarantee brainstorm with the current state of the system. Some original failure methods should no longer overlap.
2. Check for new failure modes created by the changes. Sometimes fixing a support speed problem creates a support quality problem (rushing leads to shallow answers).
3. If new overlaps exist, repeat the cycle: design anti-failure actions for the new overlaps.
4. Schedule an inversion review quarterly. The failure landscape changes as the business changes, so the inversion needs to be refreshed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
