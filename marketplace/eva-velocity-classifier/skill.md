# Eva Velocity Classifier

Classify expenses by how fast money leaves.

## Inputs

- `expense-ledger`: The dated list of expenses
- `timing-tags`: The recurring, periodic, and one-time tags

## Outputs

- `slow-leak-set`: Small steady recurring charges
- `lumpy-spend-set`: Large infrequent charges

## Process

1. Group small steady recurring charges as slow leaks.
2. Group large infrequent charges as lumpy spends.
3. Set aside true one-time items separately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
