# Collections Escalation

Escalate unresolved balances to an external collections agency or write off as bad debt.

## Inputs

- `follow-up-record`: History of collection attempts
- `balance-summary`: Remaining unpaid balance and age

## Outputs

- `collections-record`: Final disposition of the balance (paid, payment plan, sent to agency, written off)
- `collections-report`: Summary of collection outcomes for the billing cycle

## Process

1. Review the account for any remaining insurance follow-up before escalating.
2. For balances over the threshold and older than 120 days, refer to the collections agency.
3. For small balances below the collection threshold, write off as bad debt.
4. Record the final disposition and update the patient account.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
