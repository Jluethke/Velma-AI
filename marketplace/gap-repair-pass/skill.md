# Gap Repair Pass

Fix every stuck point by adding the missing step, condition, or context to the procedure. A stuck point left unrepaired will stop the next reader in exactly the same place.

## Inputs

- `draft-procedure`: The procedure being repaired
- `stuck-points`: Where the follower could not proceed
- `follower-feedback`: What was missing at each point

## Outputs

- `revised-procedure`: The procedure with every stuck point repaired
- `resolved-gaps`: Record of what was added to fix each stuck point

## Process

1. For each stuck point, add the exact step, condition, or context that would have unblocked the follower.
2. Fold previously assumed knowledge into the document so it no longer depends on the doer.
3. Keep the fixes at the reader's level rather than adding expert shorthand.
4. Record what was changed so repeated gaps across readers become visible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
