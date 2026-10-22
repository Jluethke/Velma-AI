# Trial Balance Reviewer

Review the trial balance for errors, unusual balances, and misclassifications.

## Inputs

- `updated-ledger`: General ledger with all adjustments posted
- `prior-period-trial-balance`: Previous period trial balance for comparison

## Outputs

- `reviewed-trial-balance`: Trial balance with review notes
- `correction-entries`: Any correcting journal entries identified

## Process

1. Generate the adjusted trial balance and verify debits equal credits.
2. Compare each account balance to the prior period and budget.
3. Investigate significant variances or unusual balances.
4. Post any correcting entries found during review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
