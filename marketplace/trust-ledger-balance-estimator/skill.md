# Trust Ledger Balance Estimator

Estimate the current balance in each relationship by reviewing recent deposits and withdrawals, producing a rough reading (healthy, thin, overdrawn) rather than a false-precision number, since the goal is to know which accounts are safe to draw on.

## Inputs

- `deposit-catalog`: Concrete deposit behaviors per context
- `withdrawal-catalog`: Concrete withdrawal behaviors per context

## Outputs

- `balance-estimates`: A rough balance reading per relationship: healthy, thin, or overdrawn, with the reasoning
- `recent-activity-log`: The recent deposits and withdrawals you recalled for each relationship, as the evidence behind the reading

## Process

1. For each relationship, recall the last several months of interactions and sort them into deposits and withdrawals using your catalogs. Write them down, because memory favors the dramatic and forgets the quiet deposits.
2. Read the balance qualitatively. Healthy means recent deposits clearly outweigh withdrawals and the relationship absorbs a mistake without strain. Thin means it is roughly even and a withdrawal would be felt. Overdrawn means recent withdrawals dominate and the relationship is running on goodwill you no longer have.
3. Weight recency and withdrawals more heavily. A deposit from a year ago counts for little, and a single serious withdrawal (a broken commitment) can overwhelm months of small deposits.
4. Resist false precision. A number like 73 implies a measurement you did not make. Three bands (healthy, thin, overdrawn) are enough to drive the decisions that follow.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
