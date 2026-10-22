# Trust Ledger Low Account Finder

Identify the thin and overdrawn accounts and separate the ones that are low because of neglect from the ones that are low because of an unrepaired withdrawal, since the two call for different responses.

## Inputs

- `balance-estimates`: The qualitative balance reading per relationship
- `recent-activity-log`: The deposits and withdrawals behind each reading

## Outputs

- `low-account-list`: The thin and overdrawn relationships, ranked by a combination of how low and how important
- `overdrawn-warnings`: Relationships where the balance is low enough that any near-term withdrawal would cause real damage

## Process

1. Pull every relationship reading thin or overdrawn into one list. Rank by combining how low the balance is with how important the relationship is, so an overdrawn inner relationship outranks a thin peripheral one.
2. Diagnose the cause for each. Neglect-low means the balance faded from inattention (no recent deposits, no specific wrong). Withdrawal-low means a specific unrepaired withdrawal is dragging it down. The log tells you which.
3. Flag the overdrawn accounts as warnings. These are relationships where you cannot safely ask for anything right now, and attempting a withdrawal would push them toward rupture.
4. Note any relationship that is important and overdrawn at the same time. That combination is the highest risk on the ledger and gets first claim on your repair attention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
